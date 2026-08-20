export const START = "2026-08-24";
export const END = "2026-09-07";
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function eachDay(start = START, end = END) {
  const days = [];
  let cursor = parseDay(start);
  const last = parseDay(end);
  while (cursor <= last) {
    days.push(formatDay(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }
  return days;
}

export function parseDay(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDay(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function weekdayIndex(iso) {
  const day = parseDay(iso).getDay();
  return (day + 6) % 7;
}

export function monthLabel(iso) {
  return parseDay(iso).toLocaleDateString("en-US", { month: "short" });
}

export function dayNumber(iso) {
  return parseDay(iso).getDate();
}

export function longDate(iso) {
  return parseDay(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function shortDate(iso) {
  return parseDay(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function rangeLabel(start = START, end = END) {
  const a = parseDay(start);
  const b = parseDay(end);
  const left = a.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const right = b.toLocaleDateString("en-US", {
    month: a.getMonth() === b.getMonth() ? undefined : "long",
    day: "numeric",
  });
  return `${left} – ${right}`;
}

export function calendarWeeks(start = START, end = END) {
  const days = eachDay(start, end);
  const weeks = [];
  let week = Array(7).fill(null);
  for (const iso of days) {
    const index = weekdayIndex(iso);
    if (index === 0 && week.some(Boolean)) {
      weeks.push(week);
      week = Array(7).fill(null);
    }
    week[index] = iso;
  }
  if (week.some(Boolean)) weeks.push(week);
  return weeks;
}
