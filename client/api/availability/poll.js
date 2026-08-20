import { applyCors, sendError } from "./_http.js";
import { getPoll } from "./_poll.js";

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET,OPTIONS");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  try {
    res.status(200).json(await getPoll());
  } catch (error) {
    sendError(res, error);
  }
}
