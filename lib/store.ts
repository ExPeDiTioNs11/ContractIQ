import { Index } from "@upstash/vector";

/** Embedding size we store (Gemini 3072-d truncated to 768 via MRL). */
export const EMBED_DIM = 768;

export type Chunk = {
  id: string;
  source: string;
  text: string;
  embedding: number[];
};
export type DocRecord = { source: string; fullText: string };

type Meta = { kind: "doc" | "chunk"; source: string; text: string };

let _index: Index<Meta> | null = null;

function idx(): Index<Meta> {
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Vector store not configured. Add UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN to .env.local (free at https://console.upstash.com)."
    );
  }
  if (!_index) _index = new Index<Meta>({ url, token });
  return _index;
}

export function hasVectorStore(): boolean {
  return Boolean(
    process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN
  );
}

/** Clear everything so the active "record family" is the one just loaded. */
export async function resetStore(): Promise<void> {
  await idx().reset();
}

/**
 * Store the record family: one "doc" entry per file (full text, for analysis)
 * plus one "chunk" entry per piece (for retrieval).
 */
export async function saveRecordFamily(
  docs: DocRecord[],
  chunks: Chunk[]
): Promise<void> {
  const firstEmbedding = new Map<string, number[]>();
  for (const c of chunks) {
    if (!firstEmbedding.has(c.source)) firstEmbedding.set(c.source, c.embedding);
  }

  const docVectors = docs.map((d) => ({
    id: `doc:${d.source}`,
    vector: firstEmbedding.get(d.source) ?? new Array(EMBED_DIM).fill(0.001),
    metadata: { kind: "doc" as const, source: d.source, text: d.fullText },
  }));

  const chunkVectors = chunks.map((c) => ({
    id: c.id,
    vector: c.embedding,
    metadata: { kind: "chunk" as const, source: c.source, text: c.text },
  }));

  const all = [...docVectors, ...chunkVectors];
  const BATCH = 50;
  for (let i = 0; i < all.length; i += BATCH) {
    await idx().upsert(all.slice(i, i + BATCH));
  }
}

/** All document full texts (used for the current-state analysis and suggestions). */
export async function getAllDocs(): Promise<DocRecord[]> {
  const res = await idx().query({
    vector: new Array(EMBED_DIM).fill(0.001),
    topK: 100,
    includeMetadata: true,
    filter: "kind = 'doc'",
  });
  return res
    .filter((r) => r.metadata)
    .map((r) => ({ source: r.metadata!.source, fullText: r.metadata!.text }));
}

/** The chunks most relevant to a question (vector search). */
export async function searchChunks(
  queryEmbedding: number[],
  k: number
): Promise<{ source: string; text: string }[]> {
  const res = await idx().query({
    vector: queryEmbedding,
    topK: k,
    includeMetadata: true,
    filter: "kind = 'chunk'",
  });
  return res
    .filter((r) => r.metadata)
    .map((r) => ({ source: r.metadata!.source, text: r.metadata!.text }));
}
