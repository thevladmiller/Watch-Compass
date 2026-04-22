export type ReaderChunk = {
  id: string;
  text: string;
  words: string[];
  pauseMs: number;
};

export function normalizeText(input: string) {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\u200b/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitIntoChunks(text: string, chunkSize: number, wpm: number) {
  const normalized = normalizeText(text);
  const words = normalized.match(/\S+/g) ?? [];
  const safeChunkSize = Math.max(1, Math.floor(chunkSize));
  const safeWpm = Math.max(60, Math.floor(wpm));
  const baseWordMs = 60000 / safeWpm;

  const chunks: ReaderChunk[] = [];

  for (let index = 0; index < words.length; index += safeChunkSize) {
    const slice = words.slice(index, index + safeChunkSize);
    const chunkText = slice.join(" ");
    chunks.push({
      id: `${index}-${slice.length}`,
      text: chunkText,
      words: slice,
      pauseMs: computeChunkPause(chunkText, baseWordMs, slice.length),
    });
  }

  return chunks;
}

function computeChunkPause(chunkText: string, baseWordMs: number, wordCount: number) {
  const trimmed = chunkText.trimEnd();
  const lastChar = trimmed.slice(-1);
  const tail = trimmed.slice(-3);
  const punctuationMultiplier =
    tail.includes("...") ? 2.4 : /[.!?]/.test(lastChar) ? 1.9 : /[,;:]/.test(lastChar) ? 1.4 : 1;

  const emphasisBonus = wordCount === 1 ? 0.2 : wordCount === 2 ? 0.1 : 0;
  return Math.round(baseWordMs * wordCount * punctuationMultiplier * (1 + emphasisBonus));
}

export function stripHtml(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return normalizeText(doc.body.textContent ?? "");
}

export function extractPivotLetters(word: string) {
  const match = word.match(/^([^A-Za-z0-9]*)([A-Za-z0-9]+)([^A-Za-z0-9]*)$/);
  if (!match) {
    return { prefix: "", pivot: word, suffix: "" };
  }

  const [, prefix, letters, suffix] = match;
  if (letters.length <= 1) {
    return { prefix, pivot: letters, suffix };
  }

  const pivotIndex = Math.max(0, Math.floor(letters.length / 3));
  return {
    prefix: `${prefix}${letters.slice(0, pivotIndex)}`,
    pivot: letters.slice(pivotIndex, pivotIndex + 1),
    suffix: `${letters.slice(pivotIndex + 1)}${suffix}`,
  };
}
