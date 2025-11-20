import OpenAI from "openai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { input } = req.body;

  if (!input || typeof input !== "string") {
    return res.status(400).json({ reply: "No input provided." });
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  try {
    const response = await client.responses.create({
      model: "gpt-5-nano",
      input,
      store: true,
    });

    let reply = "";

    // Safely find first output_text
    const first = response.output?.[0];
    if (first?.type === "message") {
      const part = first.content.find(c => c.type === "output_text");
      if (part && part.type === "output_text") {
        reply = part.text;
      }
    }

    // Ensure reply is never empty
    if (!reply) reply = "I couldn't generate a response.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("OpenAI API error:", err);
    return res.status(500).json({ reply: "Server error" });
  }
}
