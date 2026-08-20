import { useEffect, useMemo, useRef, useState } from "react";
import { fetchPoll, removePerson, savePerson } from "./api.js";
import {
  calendarWeeks,
  dayNumber,
  eachDay,
  longDate,
  monthLabel,
  rangeLabel,
  shortDate,
  WEEKDAYS,
} from "./dates.js";

const NAME_KEY = "when-were-free-name";

function peopleOnDay(people, iso) {
  return people.filter((person) => person.days.includes(iso));
}

export default function App() {
  const [poll, setPoll] = useState(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("view");
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || "");
  const [draftDays, setDraftDays] = useState([]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hoverDay, setHoverDay] = useState(null);
  const paintRef = useRef(null);

  async function load() {
    try {
      setPoll(await fetchPoll());
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, []);

  const people = poll?.people ?? [];
  const days = useMemo(() => eachDay(poll?.start, poll?.end), [poll]);
  const weeks = useMemo(() => calendarWeeks(poll?.start, poll?.end), [poll]);
  const maxCount = Math.max(people.length, 1);

  const ranked = useMemo(() => {
    return days
      .map((iso) => ({ iso, count: peopleOnDay(people, iso).length }))
      .sort((a, b) => b.count - a.count || a.iso.localeCompare(b.iso));
  }, [days, people]);

  const bestCount = ranked[0]?.count ?? 0;
  const bestDays = ranked.filter((day) => day.count > 0 && day.count === bestCount).slice(0, 3);

  function startEditing(existingName = name) {
    const match = people.find(
      (person) => person.name.toLowerCase() === existingName.trim().toLowerCase(),
    );
    setName(existingName);
    setDraftDays(match?.days ?? []);
    setMode("edit");
    setError("");
  }

  function toggleDay(iso, force) {
    setDraftDays((current) => {
      const on = force ?? !current.includes(iso);
      if (on) return current.includes(iso) ? current : [...current, iso].sort();
      return current.filter((day) => day !== iso);
    });
  }

  function onPointerDown(iso, event) {
    if (mode !== "edit") return;
    event.preventDefault();
    const adding = !draftDays.includes(iso);
    paintRef.current = adding;
    toggleDay(iso, adding);
  }

  function onPointerEnter(iso) {
    setHoverDay(iso);
    if (mode === "edit" && paintRef.current !== null) {
      toggleDay(iso, paintRef.current);
    }
  }

  useEffect(() => {
    function onMove(event) {
      if (paintRef.current === null) return;
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const iso = el?.closest?.("[data-day]")?.getAttribute("data-day");
      if (iso) {
        setHoverDay(iso);
        setDraftDays((current) => {
          const on = paintRef.current;
          if (on) return current.includes(iso) ? current : [...current, iso].sort();
          return current.filter((day) => day !== iso);
        });
      }
    }
    function stopPaint() {
      paintRef.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stopPaint);
    window.addEventListener("pointercancel", stopPaint);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stopPaint);
      window.removeEventListener("pointercancel", stopPaint);
    };
  }, []);

  async function onSave(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Add your name so friends know who is free.");
      return;
    }
    setSaving(true);
    try {
      const next = await savePerson(trimmed, draftDays);
      localStorage.setItem(NAME_KEY, trimmed);
      setPoll(next);
      setName(trimmed);
      setMode("view");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onRemove(id) {
    try {
      setPoll(await removePerson(id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(new URL("/when", window.location.origin).toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const showHomeLink = /^\/when(\.html)?\/?$/.test(window.location.pathname);

  const hoverPeople = hoverDay ? peopleOnDay(people, hoverDay) : [];

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Day planner for the group</p>
        <div className="hero-row">
          <div>
            <h1>{poll?.title ?? "When we're free"}</h1>
            <p className="range">{rangeLabel(poll?.start, poll?.end)}</p>
          </div>
          <div className="hero-actions">
            {showHomeLink && (
              <a className="ghost" href="/">
                Back to site
              </a>
            )}
            <button className="ghost" type="button" onClick={copyLink}>
              {copied ? "Link copied" : "Copy share link"}
            </button>
          </div>
        </div>
      </header>

      {error && <p className="banner">{error}</p>}

      <main className="layout">
        <section className="card calendar-card">
          <div className="card-head">
            <div>
              <h2>{mode === "edit" ? "Tap or drag the days you can do" : "Group overlap"}</h2>
              <p>
                {mode === "edit"
                  ? "Green days are the ones you can make. Drag across a week to paint several at once."
                  : people.length
                    ? "Darker days work for more people. Hover a day to see who is free."
                    : "Nobody has added days yet. Be the first."}
              </p>
            </div>
            {mode === "view" ? (
              <button type="button" className="primary" onClick={() => startEditing()}>
                {people.some((person) => person.name.toLowerCase() === name.trim().toLowerCase())
                  ? "Edit my days"
                  : "Add my availability"}
              </button>
            ) : (
              <button type="button" className="ghost" onClick={() => setMode("view")}>
                Cancel
              </button>
            )}
          </div>

          {mode === "edit" && (
            <form className="editor" onSubmit={onSave}>
              <label>
                Your name
                <input
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex"
                  maxLength={40}
                />
              </label>
              <div className="editor-actions">
                <button type="button" className="ghost" onClick={() => setDraftDays(days)}>
                  Select all
                </button>
                <button type="button" className="ghost" onClick={() => setDraftDays([])}>
                  Clear
                </button>
                <button type="submit" className="primary" disabled={saving}>
                  {saving ? "Saving…" : "Save my days"}
                </button>
              </div>
            </form>
          )}

          <div className="calendar" onPointerLeave={() => setHoverDay(null)}>
            <div className="weekday-row">
              {WEEKDAYS.map((weekday) => (
                <div key={weekday} className="weekday">
                  {weekday}
                </div>
              ))}
            </div>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="week">
                {week.map((iso, index) => {
                  if (!iso) return <div key={`empty-${index}`} className="day empty" />;
                  const count = peopleOnDay(people, iso).length;
                  const selected = draftDays.includes(iso);
                  const heat = people.length ? count / maxCount : 0;
                  const isBest = mode === "view" && count > 0 && count === bestCount;
                  return (
                    <button
                      key={iso}
                      type="button"
                      data-day={iso}
                      className={`day ${mode === "edit" ? "editable" : ""} ${selected ? "selected" : ""} ${isBest ? "best" : ""}`}
                      style={
                        mode === "view"
                          ? { "--heat": heat }
                          : undefined
                      }
                      onPointerDown={(event) => onPointerDown(iso, event)}
                      onPointerEnter={() => onPointerEnter(iso)}
                      onClick={() => mode === "view" && setHoverDay(iso)}
                    >
                      <span className="month">{dayNumber(iso) === 1 || iso === poll?.start ? monthLabel(iso) : ""}</span>
                      <span className="num">{dayNumber(iso)}</span>
                      <span className="count">
                        {mode === "edit"
                          ? selected
                            ? "Free"
                            : "—"
                          : people.length
                            ? `${count}/${people.length}`
                            : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {mode === "view" && hoverDay && (
            <div className="hover-card">
              <strong>{longDate(hoverDay)}</strong>
              <p>
                {hoverPeople.length
                  ? `${hoverPeople.map((person) => person.name).join(", ")}`
                  : "Nobody marked this day yet."}
              </p>
            </div>
          )}
        </section>

        <aside className="side">
          <section className="card">
            <h2>Best days</h2>
            {bestDays.length && bestCount ? (
              <ul className="best-list">
                {bestDays.map((day) => (
                  <li key={day.iso}>
                    <span>{shortDate(day.iso)}</span>
                    <em>
                      {day.count} of {people.length}
                    </em>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Once people add days, the strongest overlaps will show up here.</p>
            )}
          </section>

          <section className="card">
            <h2>Who’s in</h2>
            {people.length ? (
              <ul className="people">
                {people.map((person) => (
                  <li key={person.id}>
                    <button type="button" className="person" onClick={() => startEditing(person.name)}>
                      <span>{person.name}</span>
                      <small>{person.days.length} days</small>
                    </button>
                    <button
                      type="button"
                      className="remove"
                      aria-label={`Remove ${person.name}`}
                      onClick={() => onRemove(person.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Waiting on the first person to jump in.</p>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
}
