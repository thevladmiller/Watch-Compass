import * as pdfjsLib from "pdfjs-dist";

let pdfWorkerReady: Promise<void> | null = null;
let sharedWorker: Worker | null = null;

export async function ensurePdfWorker() {
  if (pdfWorkerReady) {
    return pdfWorkerReady;
  }

  pdfWorkerReady = (async () => {
    const workerUrl = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url);

    try {
      if (typeof Worker !== "undefined") {
        sharedWorker = new Worker(workerUrl, { type: "module" });
        pdfjsLib.GlobalWorkerOptions.workerPort = sharedWorker;
        return;
      }
    } catch {
      // Fall through to the URL-based worker configuration below.
    }

    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.toString();
    } catch {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs";
    }
  })();

  return pdfWorkerReady;
}

export async function extractPdfText(file: File) {
  await ensurePdfWorker();
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: buffer,
    useWorkerFetch: false,
    isEvalSupported: false,
  });

  const pdf = await loadingTask.promise;

  try {
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent({ includeMarkedContent: false });
      const words = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean);
      pages.push(words.join(" "));
    }

    return {
      title: file.name.replace(/\.[^.]+$/, ""),
      text: pages.join("\n\n"),
    };
  } finally {
    await pdf.destroy();
  }
}
