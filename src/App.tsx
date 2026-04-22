import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Upload,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { extractEpubText } from "@/lib/epub";
import { extractPdfText } from "@/lib/pdf";
import { extractPivotLetters, splitIntoChunks, type ReaderChunk } from "@/lib/text";
import { cn } from "@/lib/utils";

type ReaderSettings = {
  wpm: number;
  chunkSize: number;
  fontSize: number;
};

type LoadedDocument = {
  title: string;
  sourceName: string;
  text: string;
  chunks: ReaderChunk[];
  totalWords: number;
};

const DEFAULT_SETTINGS: ReaderSettings = {
  wpm: 360,
  chunkSize: 1,
  fontSize: 72,
};

const STORAGE_KEY = "pulse-reader-settings";

export default function App() {
  const [settings, setSettings] = React.useState<ReaderSettings>(() => loadSettings());
  const [document, setDocument] = React.useState<LoadedDocument | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("Preparing reader...");
  const [error, setError] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const settingsRef = React.useRef(settings);
  const playbackTokenRef = React.useRef(0);

  React.useEffect(() => {
    settingsRef.current = settings;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) &&
        event.code !== "Space"
      ) {
        return;
      }

      switch (event.code) {
        case "Space":
          event.preventDefault();
          togglePlayback();
          break;
        case "ArrowRight":
          event.preventDefault();
          stepForward();
          break;
        case "ArrowLeft":
          event.preventDefault();
          stepBackward();
          break;
        case "KeyR":
          event.preventDefault();
          resetPlayback();
          break;
        case "BracketRight":
          event.preventDefault();
          setSettings((prev) => ({ ...prev, wpm: Math.min(1200, prev.wpm + 25) }));
          break;
        case "BracketLeft":
          event.preventDefault();
          setSettings((prev) => ({ ...prev, wpm: Math.max(80, prev.wpm - 25) }));
          break;
        case "Minus":
          event.preventDefault();
          setSettings((prev) => ({ ...prev, chunkSize: Math.max(1, prev.chunkSize - 1) }));
          break;
        case "Equal":
          event.preventDefault();
          setSettings((prev) => ({ ...prev, chunkSize: Math.min(8, prev.chunkSize + 1) }));
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [document, isPlaying, currentIndex]);

  React.useEffect(() => {
    if (!document || !isPlaying || document.chunks.length === 0) {
      return;
    }

    const token = ++playbackTokenRef.current;
    const chunk = document.chunks[currentIndex];
    if (!chunk) {
      setIsPlaying(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      if (token !== playbackTokenRef.current) {
        return;
      }

      setCurrentIndex((index) => {
        if (!document) {
          return index;
        }

        if (index >= document.chunks.length - 1) {
          setIsPlaying(false);
          return index;
        }

        return index + 1;
      });
    }, chunk.pauseMs);

    return () => window.clearTimeout(timeout);
  }, [document, isPlaying, currentIndex]);

  const progress =
    document && document.chunks.length > 0
      ? (Math.min(currentIndex + 1, document.chunks.length) / document.chunks.length) * 100
      : 0;
  const activeChunk =
    document && document.chunks.length > 0
      ? document.chunks[Math.min(currentIndex, document.chunks.length - 1)]
      : null;
  const hasDocument = document !== null;
  const canPlayback = Boolean(document && document.chunks.length > 0);

  async function handleFile(file: File) {
    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Loading ${file.name}...`);

    try {
      const result = await loadFile(file, (message) => setLoadingMessage(message));
      const text = result.text.trim();
      if (!text) {
        throw new Error("No readable text was found in the selected file.");
      }
      setDocument({
        title: result.title,
        sourceName: file.name,
        text,
        chunks: splitIntoChunks(text, settingsRef.current.chunkSize, settingsRef.current.wpm),
        totalWords: text.match(/\S+/g)?.length ?? 0,
      });
      setCurrentIndex(0);
      setIsPlaying(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to read the uploaded file.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function rebuildChunks(nextSettings = settings) {
    setDocument((current) => {
      if (!current) {
        return current;
      }

      const chunks = splitIntoChunks(current.text, nextSettings.chunkSize, nextSettings.wpm);
      setCurrentIndex((index) => Math.min(index, Math.max(0, chunks.length - 1)));
      return {
        ...current,
        chunks,
        totalWords: current.text.match(/\S+/g)?.length ?? 0,
      };
    });
  }

  function updateSettings(updater: (prev: ReaderSettings) => ReaderSettings) {
    setSettings((prev) => {
      const next = updater(prev);
      queueMicrotask(() => rebuildChunks(next));
      return next;
    });
  }

  function togglePlayback() {
    if (!document || document.chunks.length === 0) {
      return;
    }
    setIsPlaying((value) => !value);
  }

  function resetPlayback() {
    playbackTokenRef.current += 1;
    setIsPlaying(false);
    setCurrentIndex(0);
  }

  function stepForward() {
    if (!document || document.chunks.length === 0) {
      return;
    }
    setIsPlaying(false);
    setCurrentIndex((index) => Math.min(index + 1, document.chunks.length - 1));
  }

  function stepBackward() {
    if (!document || document.chunks.length === 0) {
      return;
    }
    setIsPlaying(false);
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  const progressLabel = document
    ? document.chunks.length > 0
      ? `${Math.min(currentIndex + 1, document.chunks.length)} / ${document.chunks.length} chunks`
      : "0 chunks available"
    : "No document loaded";

  return (
    <main className="reader-shell">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="subtle-label">Pulse Reader</p>
          <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Local-first speed reading for PDFs, EPUBs, and text files.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Upload a file, tune the pacing, and read one chunk at a time with punctuation-aware
            pauses and a single-word pivot highlight.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-3">
            <span>Space play/pause</span>
            <span>R reset</span>
            <span>[ ] WPM</span>
            <span>- + chunk size</span>
            <span>Arrow keys step</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="space-y-4">
          <Card className="glass-panel overflow-hidden">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Import document</h2>
                  <p className="text-sm text-muted-foreground">PDF, EPUB, or TXT only.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={async (event) => {
                  event.preventDefault();
                  setDragActive(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) {
                    await handleFile(file);
                  }
                }}
                className={cn(
                  "flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition-colors",
                  dragActive ? "border-cyan-300 bg-cyan-400/10" : "border-white/[0.12] bg-white/[0.03]",
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white/90">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-white">Drop a file here or browse</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  The file stays local. Parsing happens in the browser.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Choose file
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.epub,.txt,application/pdf,application/epub+zip,text/plain"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      await handleFile(file);
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-white">
                    {isLoading ? loadingMessage : error ? "Needs attention" : "Ready"}
                  </span>
                </div>
                {document ? (
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p className="truncate text-sm text-white">{document.title}</p>
                    <p>{document.sourceName}</p>
                    <p>{document.totalWords.toLocaleString()} words</p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Load a document to begin. Controls update immediately and remain client-side.
                  </p>
                )}
                {error ? (
                  <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                    {error}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader className="border-b border-white/10">
              <h2 className="text-base font-semibold">Playback controls</h2>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <ControlRow
                label="WPM"
                value={`${settings.wpm}`}
                hint="Words per minute"
                slider={
                  <Slider
                    min={80}
                    max={1200}
                    step={5}
                    value={[settings.wpm]}
                    onValueChange={([value]) =>
                      updateSettings((prev) => ({ ...prev, wpm: value ?? prev.wpm }))
                    }
                  />
                }
              />
              <ControlRow
                label="Chunk size"
                value={`${settings.chunkSize}`}
                hint="Words per chunk"
                slider={
                  <Slider
                    min={1}
                    max={8}
                    step={1}
                    value={[settings.chunkSize]}
                    onValueChange={([value]) =>
                      updateSettings((prev) => ({ ...prev, chunkSize: value ?? prev.chunkSize }))
                    }
                  />
                }
              />
              <ControlRow
                label="Font size"
                value={`${settings.fontSize}px`}
                hint="Reader display"
                slider={
                  <Slider
                    min={42}
                    max={120}
                    step={2}
                    value={[settings.fontSize]}
                    onValueChange={([value]) =>
                      updateSettings((prev) => ({ ...prev, fontSize: value ?? prev.fontSize }))
                    }
                  />
                }
              />

              <div className="grid grid-cols-3 gap-2">
                <Button variant="secondary" onClick={stepBackward} disabled={!canPlayback || isLoading}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={togglePlayback} disabled={!canPlayback || isLoading} className="px-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={stepForward}
                  disabled={!canPlayback || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={resetPlayback}
                disabled={!hasDocument || isLoading}
              >
                <RotateCcw className="h-4 w-4" />
                Reset reader
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <Card className="glass-panel min-h-[680px]">
            <CardHeader className="border-b border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="subtle-label">Reader</p>
                  <h2 className="text-base font-semibold">
                    {document ? document.title : "Waiting for a file"}
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground">
                  {progressLabel}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex min-h-[600px] flex-col pt-6">
              <Progress value={progress} />
              <div className="mt-6 flex min-h-[480px] flex-1 items-center justify-center rounded-[2rem] border border-white/[0.08] bg-black/20 px-6 py-8">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
                    <div>
                      <p className="text-lg font-medium text-white">{loadingMessage}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Large books can take a moment to parse on the client.
                      </p>
                    </div>
                  </div>
                ) : activeChunk ? (
                  <div
                    key={activeChunk.id}
                    className="animate-fade-in-up text-center"
                    style={{ fontSize: `${settings.fontSize}px` }}
                  >
                    <div className="mx-auto flex max-w-5xl flex-wrap items-baseline justify-center gap-x-3 gap-y-2 text-[1em] leading-none tracking-[-0.04em] text-white">
                      {activeChunk.words.length === 1 ? (
                        <WordWithPivot word={activeChunk.words[0]} />
                      ) : (
                        activeChunk.words.map((word, index) => (
                          <span key={`${activeChunk.id}-${index}`} className="whitespace-pre-wrap">
                            {word}
                          </span>
                        ))
                      )}
                    </div>
                    <div className="mt-8 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      <Volume2 className="h-3.5 w-3.5" />
                      {Math.round(activeChunk.pauseMs)} ms pause
                    </div>
                  </div>
                ) : (
                  <div className="max-w-xl text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                      <Play className="h-7 w-7 text-white/70" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Load a document to start</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      The reader renders one chunk at a time and adjusts the cadence based on
                      punctuation and your chosen pace.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Playback</p>
                    <p className="font-medium text-white">
                      {document ? `${Math.round(progress)}% complete` : "No active document"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Mode</p>
                    <p className="font-medium text-white">
                      {settings.chunkSize === 1 ? "Single-word pivot" : "Grouped chunks"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function ControlRow({
  label,
  value,
  hint,
  slider,
}: {
  label: string;
  value: string;
  hint: string;
  slider: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <p className="text-sm font-semibold text-cyan-200">{value}</p>
      </div>
      {slider}
    </div>
  );
}

function WordWithPivot({ word }: { word: string }) {
  const pivot = extractPivotLetters(word);
  return (
    <span className="inline-flex items-baseline rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-white shadow-[0_0_50px_rgba(0,0,0,0.25)]">
      <span className="opacity-70">{pivot.prefix}</span>
      <span className="text-cyan-300">{pivot.pivot}</span>
      <span className="opacity-70">{pivot.suffix}</span>
    </span>
  );
}

async function loadFile(file: File, onProgress: (message: string) => void) {
  const normalizedName = file.name.toLowerCase();
  const kind =
    file.type === "application/pdf" || normalizedName.endsWith(".pdf")
      ? "pdf"
      : file.type === "application/epub+zip" || normalizedName.endsWith(".epub")
        ? "epub"
        : file.type.startsWith("text/") || normalizedName.endsWith(".txt")
          ? "txt"
          : null;

  if (!kind) {
    throw new Error("Unsupported file type. Use a PDF, EPUB, or TXT file.");
  }

  onProgress("Parsing content...");

  switch (kind) {
    case "pdf":
      return extractPdfText(file);
    case "epub":
      return extractEpubText(file);
    case "txt": {
      const text = await file.text();
      return {
        title: file.name.replace(/\.[^.]+$/, ""),
        text,
      };
    }
    default:
      throw new Error("Unsupported file type.");
  }
}

function loadSettings(): ReaderSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<ReaderSettings>;
    return {
      wpm: clamp(parsed.wpm ?? DEFAULT_SETTINGS.wpm, 80, 1200),
      chunkSize: clamp(parsed.chunkSize ?? DEFAULT_SETTINGS.chunkSize, 1, 8),
      fontSize: clamp(parsed.fontSize ?? DEFAULT_SETTINGS.fontSize, 42, 120),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
