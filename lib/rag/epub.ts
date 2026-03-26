import path from "path";

/**
 * Extracts plain text from an EPUB file using epub2.
 * Iterates all chapters in reading order, strips HTML, and joins the result.
 */
export async function extractTextFromEpub(filePath: string): Promise<string> {
  const { EPub } = await import("epub2");
  const epub = await EPub.createAsync(filePath);

  const chapterTexts: string[] = [];

  for (const chapter of epub.flow) {
    if (!chapter.id) continue;
    try {
      const html = await epub.getChapterAsync(chapter.id);
      chapterTexts.push(stripHtml(html));
    } catch {
      // Skip chapters that can't be read (e.g. nav/toc-only entries)
    }
  }

  return cleanEpubText(chapterTexts.join("\n\n"));
}

/**
 * Returns the EPUB's embedded title from metadata, or falls back to the
 * filename (kebab/snake case converted to title case).
 */
export async function titleFromEpub(filePath: string): Promise<string> {
  try {
    const { EPub } = await import("epub2");
    const epub = await EPub.createAsync(filePath);
    if (epub.metadata?.title) return epub.metadata.title;
  } catch {
    // fall through to filename
  }
  const base = path.basename(filePath, ".epub");
  return base.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Strips HTML tags and decodes common HTML entities. */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/** Collapses excessive whitespace and blank lines from extracted EPUB text. */
function cleanEpubText(raw: string): string {
  return raw
    .replace(/[ \t]{2,}/g, " ")         // collapse horizontal whitespace
    .replace(/\n{3,}/g, "\n\n")          // collapse blank lines
    .trim();
}
