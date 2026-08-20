import { readPoll, writePoll } from "./_store.js";

export function normalizeName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);
}

export function normalizeDays(days) {
  if (!Array.isArray(days)) return [];
  return [...new Set(days.filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)))].sort();
}

export async function getPoll() {
  return readPoll();
}

export async function upsertPerson(rawName, rawDays) {
  const name = normalizeName(rawName);
  const days = normalizeDays(rawDays);
  if (!name) {
    const error = new Error("Please enter your name.");
    error.status = 400;
    throw error;
  }

  const poll = await readPoll();
  const existing = poll.people.find(
    (person) => person.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    existing.name = name;
    existing.days = days;
  } else {
    poll.people.push({
      id: crypto.randomUUID(),
      name,
      days,
    });
  }
  poll.people.sort((a, b) => a.name.localeCompare(b.name));
  await writePoll(poll);
  return poll;
}

export async function deletePerson(id) {
  const poll = await readPoll();
  poll.people = poll.people.filter((person) => person.id !== id);
  await writePoll(poll);
  return poll;
}
