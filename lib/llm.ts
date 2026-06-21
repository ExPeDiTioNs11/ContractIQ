import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash-lite";
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";

export function hasApiKey(): boolean {
  return Boolean(apiKey && apiKey !== "your_free_key_here");
}

function client(): GoogleGenerativeAI {
  if (!hasApiKey()) {
    throw new Error(
      "GEMINI_API_KEY is missing. Copy .env.local.example to .env.local and paste a free key from https://aistudio.google.com/app/apikey"
    );
  }
  return new GoogleGenerativeAI(apiKey as string);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Retry transient errors (503 overloaded, 429 rate limit) with exponential
 * backoff. Real errors (bad key, bad request) are thrown immediately.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      // A daily quota cap won't recover by retrying — fail fast.
      const dailyCap = /per ?day|requestsperday/i.test(msg);
      const transient =
        !dailyCap &&
        /\b(503|429|500|overloaded|high demand|Service Unavailable|UNAVAILABLE|try again later)\b/i.test(
          msg
        );
      if (!transient || i === attempts - 1) throw err;
      await sleep(700 * Math.pow(2, i)); // 0.7s, 1.4s, 2.8s, 5.6s
    }
  }
  throw lastErr;
}

/** Truncate to the first N dimensions (Gemini embeddings are MRL) and L2-normalize. */
function shrink(vec: number[], dim = 768): number[] {
  const v = vec.slice(0, dim);
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum) || 1;
  return v.map((x) => x / norm);
}

/** Embed a single piece of text into a vector (768-d, to match the vector store). */
export async function embed(text: string): Promise<number[]> {
  const model = client().getGenerativeModel({ model: EMBED_MODEL });
  const res = await withRetry(() => model.embedContent(text));
  return shrink(res.embedding.values);
}

/** Plain text generation. */
export async function generate(prompt: string): Promise<string> {
  const model = client().getGenerativeModel({ model: CHAT_MODEL });
  const res = await withRetry(() => model.generateContent(prompt));
  return res.response.text();
}

/** Generation that is forced to return JSON, parsed into an object. */
export async function generateJSON<T = unknown>(prompt: string): Promise<T> {
  const model = client().getGenerativeModel({
    model: CHAT_MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });
  const res = await withRetry(() => model.generateContent(prompt));
  const raw = res.response.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Fallback: pull the first {...} block out of the response
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("Model did not return valid JSON:\n" + raw);
  }
}
