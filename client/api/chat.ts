import OpenAI from "openai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { input } = req.body;
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model: "gpt-5-nano",
    input: input,
    store: true,
  });
  let reply = "";

  const first = response.output?.[0];

  if (first?.type === "message") {
    const part = first.content.find((c) => c.type === "output_text");
    if (part && part.type === "output_text") {
      reply = part.text;
  }
}

  return res.status(200).json({
    reply: reply, 
  });
}
