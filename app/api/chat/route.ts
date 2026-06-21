import { NextResponse } from "next/server";
import { embed, generate, hasApiKey } from "@/lib/llm";
import { loadStore, topK } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "Gemini API key missing. See .env.local.example." },
      { status: 400 }
    );
  }

  const { question } = (await req.json()) as { question?: string };
  if (!question || !question.trim()) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  const store = await loadStore();
  if (store.chunks.length === 0) {
    return NextResponse.json(
      { error: "No documents ingested yet. Click 'Ingest documents' first." },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const queryEmbedding = await embed(question);
    const matches = topK(store.chunks, queryEmbedding, 5);

    const context = matches
      .map((m, i) => `[${i + 1}] (source: ${m.source})\n${m.text}`)
      .join("\n\n");

    const prompt = `You are a contract assistant. Today is ${today}.
Answer the user's question using ONLY the context passages below, which come
from a contract and its later amendments, side letters and invoices. Later or
more specific documents override earlier or more general ones, so report the
CURRENT state.

Rules:
- Be concise and direct, and give an actual figure/answer whenever the
  documents support one.
- If a scheduled future change (e.g. an annual indexation or review) has no
  document showing its outcome, DO NOT refuse. Instead give the most recent
  DOCUMENTED value and add a short caveat (e.g. "as of the latest statement; a
  scheduled review may not yet be reflected").
- Resolve conflicts between documents rather than listing them.
- Only say you don't have the information if the context contains nothing
  relevant to the question at all.
- After the answer, add a line "Sources:" listing the source filenames you used.

CONTEXT:
${context}

QUESTION: ${question}`;

    const answer = await generate(prompt);

    return NextResponse.json({
      ok: true,
      answer,
      sources: Array.from(new Set(matches.map((m) => m.source))),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
