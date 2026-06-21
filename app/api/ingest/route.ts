import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { extractText } from "@/lib/extract-text";
import { chunkText } from "@/lib/chunk";
import { embed, hasApiKey } from "@/lib/llm";
import {
  resetStore,
  saveRecordFamily,
  hasVectorStore,
  type Chunk,
  type DocRecord,
} from "@/lib/store";
import { isValidDataset } from "@/lib/datasets";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!hasApiKey()) {
    return NextResponse.json(
      {
        error:
          "Gemini API key missing. Copy .env.local.example to .env.local and paste a free key from https://aistudio.google.com/app/apikey, then restart the dev server.",
      },
      { status: 400 }
    );
  }
  if (!hasVectorStore()) {
    return NextResponse.json(
      {
        error:
          "Vector store not configured. Add UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN (free at https://console.upstash.com).",
      },
      { status: 400 }
    );
  }

  let dataset = "subscription";
  try {
    const body = (await req.json()) as { dataset?: string };
    if (body?.dataset && isValidDataset(body.dataset)) dataset = body.dataset;
  } catch {
    // no body — use default dataset
  }

  const SAMPLE_DIR = path.join(process.cwd(), "datasets", dataset);

  try {
    const files = (await fs.readdir(SAMPLE_DIR))
      .filter((f) => f.endsWith(".pdf") || f.endsWith(".txt"))
      .sort();

    const docs: DocRecord[] = [];
    const chunks: Chunk[] = [];

    for (const file of files) {
      const fullText = await extractText(path.join(SAMPLE_DIR, file));
      docs.push({ source: file, fullText });

      const pieces = chunkText(fullText);
      for (let i = 0; i < pieces.length; i++) {
        const embedding = await embed(pieces[i]);
        chunks.push({ id: `${file}#${i}`, source: file, text: pieces[i], embedding });
      }
    }

    await resetStore();
    await saveRecordFamily(docs, chunks);

    return NextResponse.json({
      ok: true,
      dataset,
      documents: docs.map((d) => ({ source: d.source, chars: d.fullText.length })),
      chunkCount: chunks.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
