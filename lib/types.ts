export type Field = { label: string; value: string; evidence: string };
export type Truth = { summary: string; fields: Field[]; risks: string[] };
export type ChatMsg = {
  role: "user" | "bot";
  text: string;
  sources?: string[];
  streaming?: boolean;
};
export type Doc = { source: string; chars: number };
