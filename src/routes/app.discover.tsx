import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  fetchDeck,
  findMatchWith,
  recordSwipe,
  type Candidate,
  type SwipeDirection,
} from "@/features/discovery/api";
import { CandidateCard } from "@/features/discovery/CandidateCard";
import { MatchDialog } from "@/features/discovery/MatchDialog";

export const Route = createFileRoute("/app/discover")({
  head: () => ({
    meta: [
      { title: "Discover — Yoked" },
      { name: "description", content: "Discover marriage-minded members." },
      { property: "og:title", content: "Discover — Yoked" },
      { property: "og:description", content: "Discover marriage-minded members." },
    ],
  }),
  component: DiscoverScreen,
});

function DiscoverScreen() {
  const [deck, setDeck] = useState<Candidate[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<Candidate | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchDeck()
      .then((rows) => {
        if (!alive) return;
        setDeck(rows);
        setIndex(0);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load candidates");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const current = deck[index] ?? null;

  const advance = useCallback(() => {
    setIndex((i) => i + 1);
    setError(null);
  }, []);

  const handleSwipe = useCallback(
    async (direction: SwipeDirection) => {
      if (!current || busy) return;
      setBusy(true);
      setError(null);
      try {
        const result = await recordSwipe(current.id, direction);
        if (result.kind === "cap_reached") {
          setError(
            "You've reached your active conversation limit — free up a match to try again.",
          );
          return;
        }
        // duplicate or recorded: proceed
        if (direction === "like" && result.kind === "recorded") {
          const isMatch = await findMatchWith(current.id);
          if (isMatch) {
            setMatched(current);
            return;
          }
        }
        advance();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong, try again");
      } finally {
        setBusy(false);
      }
    },
    [advance, busy, current],
  );

  const closeMatch = useCallback(() => {
    setMatched(null);
    advance();
  }, [advance]);

  return (
    <section className="flex min-h-[calc(100dvh-6rem)] flex-col px-4 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-brand-burgundy">Discover</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="border-brand-burgundy/30 text-brand-burgundy"
        >
          {/* TODO: open distance / compatibility filter sheet */}
          Filters
        </Button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-6">
        {loading ? (
          <p className="text-sm text-brand-burgundy/60">Loading…</p>
        ) : current ? (
          <>
            <CandidateCard
              candidate={current}
              onLike={() => handleSwipe("like")}
              onPass={() => handleSwipe("pass")}
              busy={busy}
            />
            {error ? (
              <p
                role="alert"
                className="max-w-sm text-center text-sm text-brand-terracotta"
              >
                {error}
              </p>
            ) : null}
          </>
        ) : (
          <div className="w-full max-w-sm rounded-2xl border border-dashed border-brand-burgundy/30 bg-white/40 p-10 text-center">
            <p className="font-serif text-lg text-brand-burgundy">No profiles yet</p>
            <p className="mt-2 text-sm text-brand-burgundy/60">
              Check back soon as new members join.
            </p>
          </div>
        )}
      </div>

      {matched ? (
        <MatchDialog displayName={matched.display_name} onClose={closeMatch} />
      ) : null}
    </section>
  );
}
