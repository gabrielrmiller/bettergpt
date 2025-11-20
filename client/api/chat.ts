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
  let reply = response.output_text;

  return res.status(200).json({reply: reply});
}
