import { applyCors, sendError } from "./_http.js";
import { deletePerson, upsertPerson } from "./_poll.js";

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    if (req.method === "POST") {
      res.status(200).json(await upsertPerson(req.body?.name, req.body?.days));
      return;
    }
    if (req.method === "DELETE") {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        res.status(400).json({ error: "Missing person id." });
        return;
      }
      res.status(200).json(await deletePerson(id));
      return;
    }
    res.setHeader("Allow", "POST,DELETE,OPTIONS");
    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    sendError(res, error);
  }
}
