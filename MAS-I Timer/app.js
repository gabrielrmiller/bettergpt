(() => {
  const STORAGE_KEY = "mas-i-timer-v4";
  const LEGACY_KEYS = ["mas-i-timer-v3", "exam-timer-v2", "mas-i-timer-v1"];
  const CATEGORIES = ["study", "practice"];
  const STALE_RUN_MS = 12 * 60 * 60 * 1000;

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
      const form = els.cards[id].querySelector("[data-adjust-form]");
      form.hidden = true;
    }
  }

  function toggleAdjustForm(category) {
    const form = els.cards[category].querySelector("[data-adjust-form]");
    const opening = form.hidden;
    closeAdjustForms(category);
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

  load();
  bind();
  render();
  syncTick();
})();
