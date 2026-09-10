import { sendError } from "../availability/_http.js";
import { enforceRateLimit, handleTimer } from "./_store.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST,OPTIONS");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const ip =
      String(req.headers["x-forwarded-for"] || "")
        .split(",")[0]
        .trim() ||
      req.socket?.remoteAddress ||
      "local";
    await enforceRateLimit(ip);
    res.status(200).json(await handleTimer(req.body || {}));
  } catch (error) {
    sendError(res, error);
  }
}
