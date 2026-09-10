import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_KEY_LENGTH = 128;
const MAX_MS = 10 * 365 * 24 * 60 * 60 * 1000;
const RATE_LIMIT = 40;
const RATE_WINDOW_SEC = 60;

const dataFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "timers.json",
);

export function normalizeKey(value) {
  const key = String(value || "").trim();
  if (!key || key.length > MAX_KEY_LENGTH) return null;
  return key;
}

export function normalizeMs(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms < 0 || ms > MAX_MS) return null;
  return Math.floor(ms);
}

export function normalizeAccumulated(value) {
  if (!value || typeof value !== "object") return { study: 0, practice: 0 };
  return {
    study: normalizeMs(value.study) || 0,
    practice: normalizeMs(value.practice) || 0,
  };
}

export function recordKey(key) {
  const digest = createHash("sha256").update(`mas-i-timer:v2:${key}`).digest("hex");
  return `mas-i-timer:v2:${digest}`;
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

function emptyFileStore() {
  return { records: {}, limits: {} };
}

let writeQueue = Promise.resolve();

async function readFileStore() {
  try {
    return JSON.parse(await fs.readFile(dataFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return emptyFileStore();
    throw error;
  }
}

async function writeFileStore(store) {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    const tmp = `${dataFile}.tmp`;
    await fs.writeFile(tmp, `${JSON.stringify(store, null, 2)}\n`);
    await fs.rename(tmp, dataFile);
  });
  return writeQueue;
}

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export async function enforceRateLimit(clientId) {
  const id = String(clientId || "local").slice(0, 128);
  const redis = await getRedis();
  if (redis) {
    const key = `mas-i-timer:rl:${id}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, RATE_WINDOW_SEC);
    if (count > RATE_LIMIT) fail(429, "Too many timer requests. Wait a minute and try again.");
    return;
  }

  if (process.env.VERCEL) return;

  const store = await readFileStore();
  const now = Date.now();
  const current = store.limits[id];
  if (!current || now - current.startedAt > RATE_WINDOW_SEC * 1000) {
    store.limits[id] = { startedAt: now, count: 1 };
  } else {
    current.count += 1;
    if (current.count > RATE_LIMIT) {
      await writeFileStore(store);
      fail(429, "Too many timer requests. Wait a minute and try again.");
    }
  }
  await writeFileStore(store);
}

function normalizeRecord(value) {
  if (!value || typeof value !== "object") {
    return { found: false, accumulated: { study: 0, practice: 0 }, updatedAt: 0 };
  }
  return {
    found: true,
    accumulated: normalizeAccumulated(value.accumulated),
    updatedAt: Number(value.updatedAt) > 0 ? Number(value.updatedAt) : 0,
  };
}

export async function readTimer(key) {
  const redis = await getRedis();
  const id = recordKey(key);
  if (redis) {
    const value = await redis.get(id);
    return normalizeRecord(value);
  }

  if (process.env.VERCEL) {
    fail(500, "Add a Redis store in the Vercel Storage tab, then redeploy, so timers can sync.");
  }

  const store = await readFileStore();
  return normalizeRecord(store.records[id]);
}

export async function writeTimer(key, accumulated) {
  const record = { accumulated, updatedAt: Date.now() };
  const redis = await getRedis();
  const id = recordKey(key);
  if (redis) {
    await redis.set(id, record);
    return record;
  }

  if (process.env.VERCEL) {
    fail(500, "Add a Redis store in the Vercel Storage tab, then redeploy, so timers can sync.");
  }

  const store = await readFileStore();
  store.records[id] = record;
  await writeFileStore(store);
  return record;
}

export async function handleTimer(body) {
  const action = String(body?.action || "").trim();
  const key = normalizeKey(body?.key);
  if (!key) fail(400, "Enter a key.");

  if (action === "get") return readTimer(key);
  if (action === "put") {
    const accumulated = normalizeAccumulated(body?.accumulated);
    return writeTimer(key, accumulated);
  }
  fail(400, "Unknown timer action.");
}
