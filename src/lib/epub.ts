import ePub from "epubjs";
import { normalizeText, stripHtml } from "@/lib/text";

type MaybeBook = {
  ready?: Promise<unknown>;
  loaded?: Record<string, Promise<unknown>>;
  spine?: { items?: MaybeSpineItem[] };
  navigation?: { toc?: Array<{ href?: string; label?: string }> };
  load?: (href: string) => Promise<unknown>;
  archive?: { request?: (href: string) => Promise<unknown> };
  package?: {
    metadata?: {
      title?: string;
    };
  };
};

type MaybeSpineItem = {
  idref?: string;
  href?: string;
  url?: string;
  linear?: string;
  load?: (loader: (href: string) => Promise<unknown>) => Promise<unknown>;
};

export async function extractEpubText(file: File) {
  const buffer = await file.arrayBuffer();
  const book = ePub(buffer) as unknown as MaybeBook;

  await Promise.allSettled([book.ready, book.loaded?.metadata, book.loaded?.navigation]);

  const title =
    (book.package as { metadata?: { title?: string } } | undefined)?.metadata?.title ||
    file.name.replace(/\.[^.]+$/, "");

  const sourceItems = book.spine?.items ?? [];
  const fallbackItems = book.navigation?.toc?.map((item) => ({ href: item.href })) ?? [];
  const spineItems = sourceItems.length > 0 ? sourceItems : (fallbackItems as MaybeSpineItem[]);
  const sections: string[] = [];

  for (const item of spineItems) {
    const href = item.href ?? item.url ?? item.idref;
    if (!href || item.linear === "no") {
      continue;
    }

    try {
      const loaded = item.load
        ? await item.load(async (sectionHref) => {
            if (typeof book.load === "function") {
              return book.load(sectionHref);
            }
            if (typeof book.archive?.request === "function") {
              return book.archive.request(sectionHref);
            }
            throw new Error("No EPUB loader available.");
          })
        : typeof book.load === "function"
          ? await book.load(href)
          : typeof book.archive?.request === "function"
            ? await book.archive.request(href)
            : null;

      const text = coerceBookText(loaded);
      if (text) {
        sections.push(text);
      }
    } catch {
      // Skip unreadable sections and continue with the rest of the spine.
    }
  }

  if (sections.length === 0) {
    throw new Error("Could not extract readable text from the EPUB file.");
  }

  return {
    title,
    text: normalizeText(sections.join("\n\n")),
  };
}

function coerceBookText(value: unknown) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return stripHtml(value);
  }

  if (value instanceof ArrayBuffer) {
    return stripHtml(new TextDecoder().decode(value));
  }

  if (ArrayBuffer.isView(value)) {
    return stripHtml(new TextDecoder().decode(value));
  }

  if (typeof value === "object") {
    const candidate = value as {
      text?: string;
      contents?: string;
      document?: Document;
      body?: { textContent?: string };
      toString?: () => string;
    };

    if (typeof candidate.text === "string") {
      return stripHtml(candidate.text);
    }

    if (typeof candidate.contents === "string") {
      return stripHtml(candidate.contents);
    }

    if (candidate.document?.body?.textContent) {
      return normalizeText(candidate.document.body.textContent);
    }

    if (candidate.body?.textContent) {
      return normalizeText(candidate.body.textContent);
    }

    if (typeof candidate.toString === "function") {
      const str = candidate.toString();
      if (str && str !== "[object Object]") {
        return stripHtml(str);
      }
    }
  }

  return "";
}
