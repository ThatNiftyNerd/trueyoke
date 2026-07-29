import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BIBLE_BOOKS, TRANSLATIONS } from "../bible/books";
import { fetchChapter, type ChapterResult } from "../bible/fetchVerse";

interface Props {
  /** Called with the fully-formed save string whenever a verse resolves. */
  onResolved: (saved: string) => void;
}

/**
 * Four dropdowns (Translation / Book / Chapter / Verse) that progressively
 * narrow down to a single verse, then show a read-only preview. Chapter and
 * Verse fetch real data instead of guessing verse counts, see fetchVerse.ts.
 */
export function LifeVerseLookup({ onResolved }: Props) {
  const [translation, setTranslation] = useState("KJV");
  const [bookId, setBookId] = useState("");
  const [chapterNum, setChapterNum] = useState<number | null>(null);
  const [verseNum, setVerseNum] = useState<number | null>(null);

  const [chapterData, setChapterData] = useState<ChapterResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const book = useMemo(() => BIBLE_BOOKS.find((b) => b.id === bookId), [bookId]);
  const chapterOptions = useMemo(
    () => (book ? Array.from({ length: book.chapters }, (_, i) => i + 1) : []),
    [book],
  );

  // Reset downstream selections whenever an upstream one changes.
  useEffect(() => {
    setChapterNum(null);
    setVerseNum(null);
    setChapterData(null);
  }, [bookId, translation]);

  useEffect(() => {
    setVerseNum(null);
  }, [chapterNum]);

  useEffect(() => {
    if (!bookId || !chapterNum) return;
    let alive = true;
    setLoading(true);
    setError(null);
    fetchChapter(bookId, chapterNum, translation)
      .then((result) => alive && setChapterData(result))
      .catch(
        (err) =>
          alive &&
          setError(err instanceof Error ? err.message : "Could not load chapter"),
      )
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [bookId, chapterNum, translation]);

  const selectedVerseText = useMemo(
    () => chapterData?.verses.find((v) => v.verse === verseNum)?.text ?? null,
    [chapterData, verseNum],
  );

  useEffect(() => {
    if (!book || !chapterNum || !verseNum || !selectedVerseText) return;
    const reference = `${book.name} ${chapterNum}:${verseNum}`;
    const saved = `${reference} (${translation}) — ${selectedVerseText}`;
    onResolved(saved);
  }, [book, chapterNum, verseNum, selectedVerseText, translation, onResolved]);

  const showFallbackNotice = chapterData && !chapterData.isLive;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Translation</Label>
          <Select value={translation} onValueChange={setTranslation}>
            <SelectTrigger>
              <SelectValue placeholder="Translation" />
            </SelectTrigger>
            <SelectContent>
              {TRANSLATIONS.map((t) => (
                <SelectItem key={t.code} value={t.code}>
                  {t.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Book</Label>
          <Select value={bookId} onValueChange={setBookId}>
            <SelectTrigger>
              <SelectValue placeholder="Select book" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {BIBLE_BOOKS.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Chapter</Label>
          <Select
            value={chapterNum ? String(chapterNum) : ""}
            onValueChange={(v) => setChapterNum(Number(v))}
            disabled={!book}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chapter" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {chapterOptions.map((c) => (
                <SelectItem key={c} value={String(c)}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Verse</Label>
          <Select
            value={verseNum ? String(verseNum) : ""}
            onValueChange={(v) => setVerseNum(Number(v))}
            disabled={!chapterData}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading…" : "Verse"} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {chapterData?.verses.map((v) => (
                <SelectItem key={v.verse} value={String(v.verse)}>
                  {v.verse}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showFallbackNotice ? (
        <p className="text-xs text-muted-foreground">
          Live lookup for {translation} isn't available yet (it requires a licensed API key). Showing
          the King James wording below — you can still tag it as {translation} and hand-edit the text
          if you prefer that translation's phrasing.
        </p>
      ) : null}

      {selectedVerseText ? (
        <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Preview</Label>
          <p className="text-sm leading-relaxed">
            {book?.name} {chapterNum}:{verseNum} — {selectedVerseText}
          </p>
        </div>
      ) : null}
    </div>
  );
}
