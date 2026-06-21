import { NextResponse } from "next/server";
import { generateJSON, hasApiKey } from "@/lib/llm";
import { loadStore } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

type Suggestions = { questions: string[] };

export async function POST() {
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "Gemini API key missing. See .env.local.example." },
      { status: 400 }
    );
  }

  const store = await loadStore();
  if (store.docs.length === 0) {
    return NextResponse.json(
      { error: "No documents ingested yet." },
      { status: 400 }
    );
  }

  // The documents are short, so we can show the model all of them.
  const corpus = store.docs
    .map((d) => `=== ${d.source} ===\n${d.fullText}`)
    .join("\n\n");

  const prompt = `You are helping a user explore a set of contract documents.
Based ONLY on the actual content below, write FOUR short, natural questions a
user would realistically want to ask about THESE specific documents.

Rules:
- Make them specific to the real content (amounts, dates, parties, terms you see).
- Keep each question under ~12 words.
- Prefer questions about what currently applies (price, renewal, discounts, obligations).
- Return JSON exactly as: { "questions": ["...", "...", "...", "..."] }

DOCUMENTS:
${corpus}`;

  try {
    const result = await generateJSON<Suggestions>(prompt);
    const questions = Array.isArray(result.questions)
      ? result.questions.slice(0, 4)
      : [];
    return NextResponse.json({ ok: true, questions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
