import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_KEY_LENGTH = 128;
const MAX_GROUPS = 40;
const MAX_BOOKS = 80;
const MAX_BYTES = 180_000;
const RATE_LIMIT = 40;
const RATE_WINDOW_SEC = 60;

const dataFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "books.json",
);

export function normalizeKey(value) {
  const key = String(value || "").trim();
  if (!key || key.length > MAX_KEY_LENGTH) return null;
  return key;
}

export function recordKey(key) {
  const digest = createHash("sha256").update(`book-tracker:v1:${key}`).digest("hex");
  return `book-tracker:v1:${digest}`;
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
    const key = `book-tracker:rl:${id}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, RATE_WINDOW_SEC);
    if (count > RATE_LIMIT) fail(429, "Too many book sync requests. Wait a minute and try again.");
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
      fail(429, "Too many book sync requests. Wait a minute and try again.");
    }
  }
  await writeFileStore(store);
}

function clipText(value, max) {
  return String(value || "").trim().slice(0, max);
}

function sanitizeBook(value) {
  if (!value || typeof value !== "object") return null;
  const pageCount = Math.max(1, Math.min(100000, Math.floor(Number(value.pageCount)) || 1));
  const pagesRead = Math.min(pageCount, Math.max(0, Math.floor(Number(value.pagesRead)) || 0));
  const title = clipText(value.title, 200) || "Untitled";
  const id = clipText(value.id, 80) || `book-${Math.random().toString(36).slice(2, 10)}`;
  return { id, title, pageCount, pagesRead };
}

function sanitizeGroup(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.books)) return null;
  const books = value.books.map(sanitizeBook).filter(Boolean).slice(0, MAX_BOOKS);
  return {
    id: clipText(value.id, 80) || `stack-${Math.random().toString(36).slice(2, 10)}`,
    name: clipText(value.name, 80) || "Stack",
    deadline: typeof value.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.deadline)
      ? value.deadline
      : null,
    collapsed: value.collapsed === true,
    books,
  };
}

export function sanitizeState(value) {
  if (!value || typeof value !== "object" || Number(value.version) !== 2 || !Array.isArray(value.groups)) {
    return null;
  }
  const groups = value.groups.map(sanitizeGroup).filter(Boolean).slice(0, MAX_GROUPS);
  if (groups.length === 0) {
    return {
      version: 2,
      groups: [{ id: "stack-1", name: "Stack 1", deadline: null, collapsed: false, books: [] }],
    };
  }
  const encoded = JSON.stringify({ version: 2, groups });
  if (encoded.length > MAX_BYTES) fail(413, "Too many books for one key.");
  return { version: 2, groups };
}

function normalizeRecord(value) {
  if (!value || typeof value !== "object") {
    return { found: false, state: null, updatedAt: 0 };
  }
  const state = sanitizeState(value.state);
  if (!state) return { found: false, state: null, updatedAt: 0 };
  return {
    found: true,
    state,
    updatedAt: Number(value.updatedAt) > 0 ? Number(value.updatedAt) : 0,
  };
}

export async function readBooks(key) {
  const redis = await getRedis();
  const id = recordKey(key);
  if (redis) {
    const value = await redis.get(id);
    return normalizeRecord(value);
  }

  if (process.env.VERCEL) {
    fail(500, "Add a Redis store in the Vercel Storage tab, then redeploy, so books can sync.");
  }

  const store = await readFileStore();
  return normalizeRecord(store.records[id]);
}

export async function writeBooks(key, rawState) {
  const state = sanitizeState(rawState);
  if (!state) fail(400, "Could not save those books.");
  const record = { state, updatedAt: Date.now() };
  const redis = await getRedis();
  const id = recordKey(key);
  if (redis) {
    await redis.set(id, record);
    return record;
  }

  if (process.env.VERCEL) {
    fail(500, "Add a Redis store in the Vercel Storage tab, then redeploy, so books can sync.");
  }

  const store = await readFileStore();
  store.records[id] = record;
  await writeFileStore(store);
  return record;
}

export async function handleBooks(body) {
  const action = String(body?.action || "").trim();
  const key = normalizeKey(body?.key);
  if (!key) fail(400, "Enter a key.");

  if (action === "get") return readBooks(key);
  if (action === "put") return writeBooks(key, body?.state);
  fail(400, "Unknown books action.");
}
