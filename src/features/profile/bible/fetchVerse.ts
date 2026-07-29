/**
 * Thin client for bible-api.com — free, no key, CORS-enabled, public-domain
 * translations only. See books.ts for why NKJV/NIV/ESV aren't wired to a
 * live source yet.
 */
import { BIBLE_BOOKS, TRANSLATIONS } from "./books";

export interface ChapterVerse {
  verse: number;
  text: string;
}

export interface ChapterResult {
  bookName: string;
  chapter: number;
  verses: ChapterVerse[];
  /** True when this chapter came from a live API fetch (KJV today). */
  isLive: boolean;
}

const BASE_URL = "https://bible-api.com";

/** Fetch every verse in a chapter, for the given translation code (e.g. "KJV"). */
export async function fetchChapter(
  bookId: string,
  chapter: number,
  translationCode: string,
): Promise<ChapterResult> {
  const book = BIBLE_BOOKS.find((b) => b.id === bookId);
  if (!book) throw new Error(`Unknown book id: ${bookId}`);

  const translation = TRANSLATIONS.find((t) => t.code === translationCode);
  if (!translation) throw new Error(`Unknown translation: ${translationCode}`);

  // NKJV/NIV/ESV: no live source configured. Fall back to KJV so the preview
  // still shows real scripture, but mark it not-live so the UI can disclose that.
  const apiId = translation.apiId ?? "kjv";
  const isLive = Boolean(translation.apiId);

  const url = `${BASE_URL}/${encodeURIComponent(book.name)}+${chapter}?translation=${apiId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${book.name} ${chapter} (${res.status})`);
  const data = await res.json();

  if (!Array.isArray(data.verses) || data.verses.length === 0) {
    throw new Error(`No verses returned for ${book.name} ${chapter}`);
  }

  return {
    bookName: book.name,
    chapter,
    verses: data.verses.map((v: { verse: number; text: string }) => ({
      verse: v.verse,
      text: v.text.trim(),
    })),
    isLive,
  };
}
