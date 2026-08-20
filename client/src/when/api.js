async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Could not load availability.");
  return payload;
}

export async function fetchPoll() {
  return readJson(await fetch("/api/availability/poll"));
}

export async function savePerson(name, days) {
  return readJson(
    await fetch("/api/availability/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, days }),
    }),
  );
}

export async function removePerson(id) {
  return readJson(await fetch(`/api/availability/people?id=${encodeURIComponent(id)}`, { method: "DELETE" }));
}
