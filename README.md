# Pulse Reader

Local-first speed-reading app built with React, TypeScript, Vite, Tailwind, and shadcn-style controls.

## Features

- Upload PDF, EPUB, or TXT files
- Client-side parsing only
- Adjustable WPM, chunk size, and font size
- Play/pause/reset controls
- Keyboard shortcuts
- Progress indicator
- Punctuation-aware pauses
- Pivot-letter highlighting for single-word mode
- Dark premium UI

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui-style control components built on Radix primitives
- `pdfjs-dist` for PDF parsing
- `epubjs` for EPUB parsing

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Keyboard Shortcuts

- `Space`: Play / pause
- `R`: Reset to the start
- `ArrowRight`: Next chunk
- `ArrowLeft`: Previous chunk
- `[` / `]`: Decrease / increase WPM
- `-` / `=`: Decrease / increase chunk size

## Notes

- Parsing happens fully in the browser.
- PDF.js worker setup uses a module worker with a fallback to `workerSrc`.
- EPUB extraction is defensive and skips unreadable spine items instead of failing the whole book.
