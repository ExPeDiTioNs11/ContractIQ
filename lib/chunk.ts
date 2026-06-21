/**
 * Split text into overlapping chunks by paragraph, so that retrieval can
 * cite a small relevant passage instead of a whole document.
 */
export function chunkText(text: string, maxChars = 900, overlap = 150): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if ((current + " " + p).length > maxChars && current) {
      chunks.push(current.trim());
      // keep a little overlap for context continuity
      current = current.slice(-overlap) + " " + p;
    } else {
      current = current ? current + " " + p : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}
