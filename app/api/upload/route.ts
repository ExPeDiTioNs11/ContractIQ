import { NextResponse } from "next/server";
import { extractFromBuffer } from "@/lib/extract-text";
import { chunkText } from "@/lib/chunk";
import { embed, hasApiKey } from "@/lib/llm";
import {
  resetStore,
  saveRecordFamily,
  hasVectorStore,
  type Chunk,
  type DocRecord,
} from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "Gemini API key missing. See .env.local.example." },
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

  let files: File[];
  try {
    const form = await req.formData();
    files = form
      .getAll("files")
      .filter((f): f is File => f instanceof File && f.size > 0);
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "No files received." }, { status: 400 });
  }

  try {
    const docs: DocRecord[] = [];
    const chunks: Chunk[] = [];
    const skipped: string[] = [];

    files.sort((a, b) => a.name.localeCompare(b.name));

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "pdf" && ext !== "txt") {
        skipped.push(file.name);
        continue;
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const fullText = await extractFromBuffer(file.name, buffer);
      if (!fullText) {
        skipped.push(file.name);
        continue;
      }

      docs.push({ source: file.name, fullText });
      const pieces = chunkText(fullText);
      for (let i = 0; i < pieces.length; i++) {
        const embedding = await embed(pieces[i]);
        chunks.push({ id: `${file.name}#${i}`, source: file.name, text: pieces[i], embedding });
      }
    }

    if (docs.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not read any supported files. Please upload PDF or TXT files (scanned image-only PDFs are not supported).",
        },
        { status: 400 }
      );
    }

    await resetStore();
    await saveRecordFamily(docs, chunks);

    return NextResponse.json({
      ok: true,
      documents: docs.map((d) => ({ source: d.source, chars: d.fullText.length })),
      chunkCount: chunks.length,
      skipped,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
