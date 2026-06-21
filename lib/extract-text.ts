import { promises as fs } from "fs";
import path from "path";

/** Read the raw text out of an in-memory PDF or .txt buffer. */
export async function extractFromBuffer(
  name: string,
  buffer: Buffer
): Promise<string> {
  const ext = name.split(".").pop()?.toLowerCase();

  if (ext === "txt") {
    return buffer.toString("utf-8").trim();
  }

  if (ext === "pdf") {
    // Dynamic import keeps pdf-parse (CommonJS) out of the build graph.
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text.replace(/\n{3,}/g, "\n\n").trim();
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

/** Read the raw text out of a PDF or .txt file on disk. */
export async function extractText(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return extractFromBuffer(path.basename(filePath), buffer);
}
