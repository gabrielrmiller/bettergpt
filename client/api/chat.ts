import OpenAI from "openai";

export default async function handler(req, res) {
  const { input } = req.body;
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model: "gpt-5-nano",
    input: input,
    store: true,
  });

  return res.status(200).json({
    reply: response.output[0].content[0].text,
  });
}
