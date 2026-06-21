import { NextResponse } from "next/server";
import { generateJSON, hasApiKey } from "@/lib/llm";
import { loadStore } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

type Field = {
  label: string;
  value: string;
  evidence: string; // which document + clause proves it
};

type CurrentTruth = {
  summary: string;
  fields: Field[];
  risks: string[];
};

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
      { error: "No documents ingested yet. Click 'Ingest documents' first." },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const corpus = store.docs
    .map((d) => `=== DOCUMENT: ${d.source} ===\n${d.fullText}`)
    .join("\n\n");

  const prompt = `You are a post-signature contract intelligence engine.
Today's date is ${today}.

Below is a "record family": an original contract plus later amendments, side
letters, notices and/or invoices. Later or more specific documents override
earlier or more general ones. Read ALL of them and determine what governs
RIGHT NOW.

Choose the 5 to 7 MOST IMPORTANT current terms for THIS specific type of
contract (e.g. for a lease: rent, parking, subletting, renewal; for employment:
salary, role, remote work, notice, non-compete; for a subscription: fee, seats,
discount, renewal). Use clear, domain-appropriate labels — do NOT force unrelated
labels onto the contract.

For every field:
- Report the CURRENT state, not the original, when something was amended,
  superseded, or expired.
- When documents conflict, resolve the conflict and pick the governing value.
- Cite the exact document filename (and clause/section if visible) as evidence.

Return JSON with this exact shape:
{
  "summary": "one or two sentences describing the current governing state",
  "fields": [
    { "label": "<domain-appropriate term>", "value": "<current value>", "evidence": "filename + clause" }
  ],
  "risks": [ "short risk, deadline or conflict the party should act on" ]
}

RECORD FAMILY:
${corpus}`;

  try {
    const result = await generateJSON<CurrentTruth>(prompt);
    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
