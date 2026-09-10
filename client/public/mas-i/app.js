(() => {
  const STORAGE_KEY = "mas-i-timer-v4";
  const KEYS_STORAGE = "mas-i-timer-keys-v1";
  const LEGACY_KEYS = ["mas-i-timer-v3", "exam-timer-v2", "mas-i-timer-v1"];
  const CATEGORIES = ["study", "practice"];
  const STALE_RUN_MS = 12 * 60 * 60 * 1000;
  const SYNC_URL = "/api/timer/sync";
  const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const state = {
    accumulated: { study: 0, practice: 0 },
    session: { study: 0, practice: 0 },
    active: null,
    startedAt: null,
  };

  const els = {
    grandTotal: document.getElementById("grand-total"),
    sessionTotal: document.getElementById("session-total"),
    endSessionButtons: [...document.querySelectorAll("[data-end-session]")],
    cards: Object.fromEntries(
      CATEGORIES.map((id) => [id, document.querySelector(`[data-category="${id}"]`)])
    ),
  };

  const keys = { study: "", practice: "" };
  const cloudTimers = { study: 0, practice: 0 };
  let tickTimer = 0;

  function now() {
    return Date.now();
  }

  function format(ms) {
    const totalSec = Math.floor(Math.max(0, ms) / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  }

  function toDurationAttr(ms) {
    const totalSec = Math.floor(Math.max(0, ms) / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `PT${h}H${m}M${s}S`;
  }

  function positiveMs(value) {
    const ms = Number(value);
    return Number.isFinite(ms) && ms >= 0 ? ms : 0;
  }

  function blankBucket() {
    return { study: 0, practice: 0 };
  }

  function normalizeActive(active) {
    if (active === "exam" || active === "quiz") return "practice";
    return CATEGORIES.includes(active) ? active : null;
  }

  function toAccumulated(source) {
    if (!source || typeof source !== "object") return blankBucket();

    if ("practice" in source) {
      return {
        study: positiveMs(source.study),
        practice: positiveMs(source.practice),
      };
    }

    return {
      study: positiveMs(source.study),
      practice: positiveMs(source.exam) + positiveMs(source.quiz),
    };
  }

  function toSession(source) {
    if (!source || typeof source !== "object") return blankBucket();
    return {
      study: positiveMs(source.study),
      practice: positiveMs(source.practice) + positiveMs(source.exam) + positiveMs(source.quiz),
    };
  }

  function migrateLegacy() {
    for (const key of LEGACY_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const saved = JSON.parse(raw);

        if (key === "exam-timer-v2" && Array.isArray(saved?.exams)) {
          const mas =
            saved.exams.find((exam) => /^mas[- ]?i$/i.test(String(exam?.name || "").trim())) ||
            saved.exams[0];
          if (!mas) continue;
          return {
            accumulated: toAccumulated(mas.accumulated),
            session: blankBucket(),
            active: normalizeActive(mas.active),
            startedAt: typeof mas.startedAt === "number" ? mas.startedAt : null,
          };
        }

        return {
          accumulated: toAccumulated(saved?.accumulated),
          session: toSession(saved?.session),
          active: normalizeActive(saved?.active),
          startedAt: typeof saved?.startedAt === "number" ? saved.startedAt : null,
        };
      } catch {
        /* try next */
      }
    }
    return null;
  }

  function settleInto(target, id, startedAt, at = now()) {
    if (!id || startedAt == null) return 0;
    const delta = Math.max(0, at - startedAt);
    target[id] += delta;
    return delta;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        state.accumulated = toAccumulated(saved?.accumulated);
        state.session = toSession(saved?.session);
        const active = normalizeActive(saved?.active);
        const startedAt = typeof saved.startedAt === "number" ? saved.startedAt : null;

        if (active && startedAt != null) {
          // Bank very old "still running" timers so a forgotten tab doesn't keep inventing time.
          if (now() - startedAt > STALE_RUN_MS) {
            settleInto(state.accumulated, active, startedAt);
            state.active = null;
            state.startedAt = null;
            save();
          } else {
            state.active = active;
            state.startedAt = startedAt;
          }
        }
        return;
      }

      const migrated = migrateLegacy();
      if (migrated) {
        state.accumulated = migrated.accumulated;
        state.session = migrated.session;
        if (
          migrated.active &&
          migrated.startedAt != null &&
          now() - migrated.startedAt <= STALE_RUN_MS
        ) {
          state.active = migrated.active;
          state.startedAt = migrated.startedAt;
        } else if (migrated.active && migrated.startedAt != null) {
          settleInto(state.accumulated, migrated.active, migrated.startedAt);
        }
        save();
        for (const key of LEGACY_KEYS) localStorage.removeItem(key);
      }
    } catch {
      /* start fresh */
    }
  }

  function save() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        accumulated: state.accumulated,
        session: state.session,
        active: state.active,
        startedAt: state.startedAt,
      })
    );
    for (const id of CATEGORIES) queueCloudSave(id);
  }

  function loadKeys() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEYS_STORAGE) || "{}");
      for (const id of CATEGORIES) {
        keys[id] = typeof saved?.[id] === "string" ? saved[id].trim() : "";
      }
    } catch {
      /* start without keys */
    }
  }

  function saveKeys() {
    localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
  }

  function generateKey() {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => KEY_ALPHABET[byte & 31]).join("");
  }

  function validKey(value) {
    const key = String(value || "").trim();
    return key.length > 0 && key.length <= 128 ? key : "";
  }

  function setSyncStatus(category, message) {
    const status = els.cards[category].querySelector("[data-sync-status]");
    status.textContent = message;
  }

  function updateSyncUi(category) {
    const card = els.cards[category];
    const linked = Boolean(keys[category]);
    const badge = card.querySelector("[data-sync-badge]");
    const input = card.querySelector("[data-sync-key]");
    badge.hidden = !linked;
    if (document.activeElement !== input) input.value = keys[category];
    if (linked) {
      setSyncStatus(category, "Linked. Hours sync with any device that uses this key.");
    } else {
      setSyncStatus(category, "This timer stays on this browser until you set a key.");
    }
  }

  async function syncRequest(action, category, extra = {}) {
    const key = keys[category];
    if (!key) return null;
    const response = await fetch(SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, category, key, ...extra }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Could not sync timer.");
    }
    return data;
  }

  function queueCloudSave(category) {
    if (!keys[category]) return;
    clearTimeout(cloudTimers[category]);
    cloudTimers[category] = window.setTimeout(() => {
      pushCloud(category).catch((error) => {
        setSyncStatus(category, error.message || "Could not save to your key.");
      });
    }, 400);
  }

  async function pushCloud(category) {
    if (!keys[category]) return;
    await syncRequest("put", category, { accumulatedMs: elapsed(category) });
    updateSyncUi(category);
  }

  async function linkKey(category, rawKey) {
    const key = validKey(rawKey);
    if (!key) {
      throw new Error("Enter a key first.");
    }

    const previous = keys[category];
    keys[category] = key;
    let remote;
    try {
      remote = await syncRequest("get", category);
    } catch (error) {
      keys[category] = previous;
      throw error;
    }
    const localMs = state.accumulated[category];
    const remoteMs = remote?.found ? positiveMs(remote.accumulatedMs) : 0;

    if (remote?.found && remoteMs !== localMs && localMs > 0 && remoteMs > 0) {
      const useCloud = window.confirm(
        `This key already has ${format(remoteMs)} for ${category}. This device has ${format(localMs)}. OK uses the key's time. Cancel keeps this device and overwrites the key.`
      );
      if (useCloud) {
        if (state.active === category) {
          state.active = null;
          state.startedAt = null;
        }
        state.accumulated[category] = remoteMs;
      }
    } else if (remote?.found && localMs === 0) {
      state.accumulated[category] = remoteMs;
    }

    saveKeys();
    save();
    render();
    if (!remote?.found || localMs > 0) await pushCloud(category);
    updateSyncUi(category);
  }

  function liveDelta(category, at = now()) {
    if (state.active === category && state.startedAt != null) {
      return Math.max(0, at - state.startedAt);
    }
    return 0;
  }

  function wholeSeconds(ms) {
    return Math.floor(Math.max(0, ms) / 1000);
  }

  function liveSeconds(at = now()) {
    if (state.active == null || state.startedAt == null) return 0;
    return wholeSeconds(at - state.startedAt);
  }

  function liveSecondsFor(category, at = now()) {
    return state.active === category ? liveSeconds(at) : 0;
  }

  // Banked seconds + shared live seconds, so every running clock ticks together.
  function displayMs(bankedMs, category, at = now()) {
    return (wholeSeconds(bankedMs) + liveSecondsFor(category, at)) * 1000;
  }

  function elapsed(category, at = now()) {
    return state.accumulated[category] + liveDelta(category, at);
  }

  function sessionElapsed(category, at = now()) {
    return state.session[category] + liveDelta(category, at);
  }

  function stopTick() {
    clearTimeout(tickTimer);
    tickTimer = 0;
  }

  function syncTick() {
    stopTick();
    if (state.active == null || state.startedAt == null) return;
    const elapsedMs = Math.max(0, now() - state.startedAt);
    const delay = 1000 - (elapsedMs % 1000);
    tickTimer = window.setTimeout(() => {
      render();
      syncTick();
    }, delay);
  }

  function settleActive(at = now()) {
    if (state.active == null || state.startedAt == null) return;
    const id = state.active;
    const delta = settleInto(state.accumulated, id, state.startedAt, at);
    state.session[id] += delta;
    state.active = null;
    state.startedAt = null;
  }

  function start(category) {
    if (state.active === category) {
      settleActive();
    } else {
      settleActive();
      state.active = category;
      state.startedAt = now();
    }
    save();
    render();
    syncTick();
  }

  function endSession() {
    const at = now();
    const hasSession =
      state.active != null || CATEGORIES.some((id) => sessionElapsed(id, at) > 0);
    if (!hasSession) return;

    settleActive();
    state.session = blankBucket();
    save();
    render();
    syncTick();
  }

  function reset(category) {
    const label = category.charAt(0).toUpperCase() + category.slice(1);
    const ok = window.confirm(
      `Reset all accumulated ${label} time to zero? This cannot be undone.`
    );
    if (!ok) return;

    if (state.active === category) {
      state.active = null;
      state.startedAt = null;
    }
    state.accumulated[category] = 0;
    state.session[category] = 0;
    save();
    render();
    syncTick();
  }

  function closeAdjustForms(exceptId) {
    for (const id of CATEGORIES) {
      if (id === exceptId) continue;
      const card = els.cards[id];
      card.querySelector("[data-adjust-form]").hidden = true;
      card.querySelector("[data-sync-form]").hidden = true;
    }
  }

  function toggleSyncForm(category) {
    const form = els.cards[category].querySelector("[data-sync-form]");
    const opening = form.hidden;
    closeAdjustForms(category);
    els.cards[category].querySelector("[data-adjust-form]").hidden = true;
    form.hidden = !opening;
    if (opening) {
      const input = form.querySelector("[data-sync-key]");
      input.value = keys[category];
      input.focus();
    }
  }

  function toggleAdjustForm(category) {
    const form = els.cards[category].querySelector("[data-adjust-form]");
    const opening = form.hidden;
    closeAdjustForms(category);
    els.cards[category].querySelector("[data-sync-form]").hidden = true;
    form.hidden = !opening;
    if (opening) {
      form.querySelector("[data-hours]").value = "0";
      form.querySelector("[data-minutes]").value = "0";
      form.querySelector("[data-minutes]").focus();
    }
  }

  function adjust(category, direction, hours, minutes) {
    const deltaMs = (Math.max(0, hours) * 60 + Math.max(0, minutes)) * 60 * 1000;
    if (deltaMs === 0) return;

    if (state.active === category) settleActive();

    const signed = direction * deltaMs;
    state.accumulated[category] = Math.max(0, state.accumulated[category] + signed);
    // Keep session aligned with all-time corrections without inventing session time.
    if (signed < 0) {
      state.session[category] = Math.max(0, state.session[category] + signed);
    } else {
      state.session[category] += signed;
    }
    save();
    render();
    syncTick();
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function isCardFullscreen(card) {
    return fullscreenElement() === card || card.classList.contains("is-focus");
  }

  async function enterFullscreen(card) {
    try {
      if (card.requestFullscreen) await card.requestFullscreen();
      else if (card.webkitRequestFullscreen) card.webkitRequestFullscreen();
      else card.classList.add("is-focus");
    } catch {
      card.classList.add("is-focus");
    }
    render();
  }

  async function exitFullscreen(card) {
    card.classList.remove("is-focus");
    const current = fullscreenElement();
    if (current) {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } catch {
        /* ignore */
      }
    }
    render();
  }

  function toggleFullscreen(category) {
    const card = els.cards[category];
    if (isCardFullscreen(card)) exitFullscreen(card);
    else {
      for (const id of CATEGORIES) {
        if (id !== category) els.cards[id].classList.remove("is-focus");
      }
      enterFullscreen(card);
    }
  }

  function updateFullscreenButtons() {
    for (const id of CATEGORIES) {
      const card = els.cards[id];
      const button = card.querySelector("[data-fullscreen]");
      const active = isCardFullscreen(card);
      button.textContent = active ? "Exit" : "Fullscreen";
      button.setAttribute(
        "aria-label",
        active ? `Exit ${id} fullscreen` : `Fullscreen ${id} timer`
      );
      button.title = active ? `Exit ${id} fullscreen` : `Fullscreen ${id} timer`;
    }
  }

  function setTime(el, ms) {
    el.textContent = format(ms);
    el.setAttribute("datetime", toDurationAttr(ms));
  }

  function render() {
    const at = now();
    let grand = 0;
    let session = 0;

    for (const id of CATEGORIES) {
      const totalMs = displayMs(state.accumulated[id], id, at);
      const sessionMs = displayMs(state.session[id], id, at);
      grand += totalMs;
      session += sessionMs;

      const card = els.cards[id];
      const running = state.active === id;
      const focused = isCardFullscreen(card);

      // Same two clocks everywhere; fullscreen only swaps which one is primary.
      setTime(card.querySelector("[data-display]"), focused ? sessionMs : totalMs);
      setTime(card.querySelector("[data-all-time]"), focused ? totalMs : sessionMs);
      card.querySelector("[data-clock-label]").textContent = focused
        ? "This session"
        : "All time";
      card.querySelector("[data-secondary-label]").textContent = focused
        ? "All time"
        : "This session";
      card.querySelector("[data-status]").textContent = running ? "Running" : "Ready";
      card.querySelector("[data-toggle]").textContent = running ? "Pause" : "Start";
      card.classList.toggle("is-running", running);
    }

    setTime(els.grandTotal, grand);
    setTime(els.sessionTotal, session);
    const endDisabled = state.active == null && session === 0;
    for (const button of els.endSessionButtons) button.disabled = endDisabled;
    updateFullscreenButtons();
  }

  function bind() {
    for (const id of CATEGORIES) {
      const card = els.cards[id];
      const form = card.querySelector("[data-adjust-form]");

      card.querySelector("[data-toggle]").addEventListener("click", () => start(id));
      card.querySelector("[data-reset]").addEventListener("click", () => reset(id));
      card.querySelector("[data-adjust]").addEventListener("click", () => toggleAdjustForm(id));
      card.querySelector("[data-fullscreen]").addEventListener("click", () => toggleFullscreen(id));
      card.querySelector("[data-sync-toggle]").addEventListener("click", () => toggleSyncForm(id));
      form.querySelector("[data-adjust-cancel]").addEventListener("click", () => {
        form.hidden = true;
      });

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const dir = Number(event.submitter?.dataset.adjustDir || -1);
        const hours = Number(form.querySelector("[data-hours]").value) || 0;
        const minutes = Number(form.querySelector("[data-minutes]").value) || 0;
        adjust(id, dir, hours, minutes);
        form.hidden = true;
      });

      const syncForm = card.querySelector("[data-sync-form]");
      syncForm.querySelector("[data-sync-generate]").addEventListener("click", () => {
        const input = syncForm.querySelector("[data-sync-key]");
        input.type = "text";
        input.value = generateKey();
        input.select();
        setSyncStatus(id, "Copy this key, then click Use key. Store it somewhere private.");
      });
      syncForm.querySelector("[data-sync-copy]").addEventListener("click", async () => {
        const value = syncForm.querySelector("[data-sync-key]").value.trim() || keys[id];
        if (!value) {
          setSyncStatus(id, "Generate or type a key first.");
          return;
        }
        try {
          await navigator.clipboard.writeText(value);
          setSyncStatus(id, "Copied. Keep this key private.");
        } catch {
          setSyncStatus(id, "Copy failed. Select the key and copy it yourself.");
        }
      });
      syncForm.querySelector("[data-sync-forget]").addEventListener("click", () => {
        keys[id] = "";
        saveKeys();
        syncForm.querySelector("[data-sync-key]").value = "";
        updateSyncUi(id);
        setSyncStatus(id, "Forgotten on this device. Cloud hours stay until someone uses the key.");
      });
      syncForm.querySelector("[data-sync-cancel]").addEventListener("click", () => {
        syncForm.hidden = true;
      });
      syncForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          setSyncStatus(id, "Linking key…");
          await linkKey(id, syncForm.querySelector("[data-sync-key]").value);
        } catch (error) {
          setSyncStatus(id, error.message || "Could not link this key.");
        }
      });
    }

    for (const button of els.endSessionButtons) {
      button.addEventListener("click", endSession);
    }

    document.addEventListener("fullscreenchange", render);
    document.addEventListener("webkitfullscreenchange", render);

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      for (const id of CATEGORIES) {
        const card = els.cards[id];
        if (card.classList.contains("is-focus")) exitFullscreen(card);
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        save();
        return;
      }
      render();
      syncTick();
    });

    window.addEventListener("beforeunload", save);
  }

  async function restoreLinkedTimers() {
    for (const id of CATEGORIES) {
      if (!keys[id]) {
        updateSyncUi(id);
        continue;
      }
      try {
        const remote = await syncRequest("get", id);
        if (remote?.found) {
          const remoteMs = positiveMs(remote.accumulatedMs);
          const next = Math.max(remoteMs, state.accumulated[id]);
          if (next !== state.accumulated[id]) {
            if (state.active === id) {
              state.active = null;
              state.startedAt = null;
            }
            state.accumulated[id] = next;
          }
        }
        await pushCloud(id);
        updateSyncUi(id);
      } catch (error) {
        setSyncStatus(id, error.message || "Could not load this key.");
      }
    }
    save();
    render();
  }

  loadKeys();
  load();
  bind();
  render();
  syncTick();
  restoreLinkedTimers();
})();
