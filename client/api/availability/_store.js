import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KEY = "when-were-free-poll";
const dataFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "poll.json",
);

export function emptyPoll() {
  return {
    title: "When we're free",
    start: "2026-08-24",
    end: "2026-09-07",
    people: [],
  };
}

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function getRedis() {
  const config = redisConfig();
  if (!config) return null;
  const { Redis } = await import("@upstash/redis");
  return new Redis(config);
}

function normalizePoll(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.people)) {
    return emptyPoll();
  }
  return { ...emptyPoll(), ...value, people: value.people };
}

let writeQueue = Promise.resolve();

async function readFilePoll() {
  try {
    return normalizePoll(JSON.parse(await fs.readFile(dataFile, "utf8")));
  } catch (error) {
    if (error.code === "ENOENT") return emptyPoll();
    throw error;
  }
}

async function writeFilePoll(poll) {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    const tmp = `${dataFile}.tmp`;
    await fs.writeFile(tmp, `${JSON.stringify(poll, null, 2)}\n`);
    await fs.rename(tmp, dataFile);
  });
  return writeQueue;
}

export async function readPoll() {
  const redis = await getRedis();
  if (redis) return normalizePoll(await redis.get(KEY));
  if (process.env.VERCEL) {
    throw new Error(
      "Add a Redis store in the Vercel Storage tab, then redeploy, so everyone can share one poll.",
    );
  }
  return readFilePoll();
}

export async function writePoll(poll) {
  const redis = await getRedis();
  if (redis) {
    await redis.set(KEY, poll);
    return poll;
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Add a Redis store in the Vercel Storage tab, then redeploy, so everyone can share one poll.",
    );
  }
  await writeFilePoll(poll);
  return poll;
}
