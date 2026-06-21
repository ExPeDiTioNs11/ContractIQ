import { promises as fs } from "fs";
import path from "path";

export type Chunk = {
  id: string;
  source: string; // filename the chunk came from
  text: string;
  embedding: number[];
};

export type DocRecord = {
  source: string; // filename
  fullText: string;
};

export type Store = {
  docs: DocRecord[];
  chunks: Chunk[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

export async function loadStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as Store;
  } catch {
    return { docs: [], chunks: [] };
  }
}

export async function saveStore(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store), "utf-8");
}

/** Cosine similarity between two equal-length vectors. */
export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Return the top-k chunks most similar to a query embedding. */
export function topK(
  chunks: Chunk[],
  queryEmbedding: number[],
  k: number
): Chunk[] {
  return chunks
    .map((c) => ({ c, score: cosine(c.embedding, queryEmbedding) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k)
    .map((x) => x.c);
}
