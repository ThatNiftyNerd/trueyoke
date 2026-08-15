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
import { BlockModal, ReportModal } from "@/features/safety/ReportBlockModals";
import { blockProfile, reportProfile } from "@/features/safety/api";
import { formatReason, type ReportReason } from "@/features/safety/logic";
import { DiscoverFilters } from "@/features/discovery/DiscoverFilters";
import { EMPTY_FILTERS, activeFilterCount } from "@/features/discovery/logic";
import type { DeckFilters } from "@/features/discovery/api";
import { getOwnProfile } from "@/features/profile/api";
import { MentorLedger } from "@/features/vouchers/MentorLedger";

export const Route = createFileRoute("/app/discover")({
  head: () => ({
    meta: [
      { title: "Discover — TrueYoke" },
      { name: "description", content: "Discover marriage-minded members." },
      { property: "og:title", content: "Discover — TrueYoke" },
      { property: "og:description", content: "Discover marriage-minded members." },
    ],
  }),
  component: DiscoverRoute,
});

/** Mentors get the voucher ledger here; matches get the swipe deck. */
function DiscoverRoute() {
  const [accountType, setAccountType] = useState<"match" | "mentor" | null>(null);

  useEffect(() => {
    let alive = true;
    getOwnProfile()
      .then((p) => alive && p && setAccountType(p.account_type as "match" | "mentor"))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (accountType === "mentor") return <MentorLedger />;
  return <DiscoverScreen />;
}

function DiscoverScreen() {
  const [deck, setDeck] = useState<Candidate[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<Candidate | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [filters, setFilters] = useState<DeckFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterCount = activeFilterCount(filters);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchDeck(filters)
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
  }, [filters]);

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
          setError("You've reached your active conversation limit — free up a match to try again.");
          return;
        }
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

  async function handleReport(category: ReportReason, details: string) {
    if (!current) return;
    await reportProfile(current.id, formatReason(category, details));
  }

  async function handleBlock() {
    if (!current) return;
    await blockProfile(current.id);
    advance();
  }

  return (
    <section className="flex min-h-[calc(100dvh-6rem)] flex-col px-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-app-ink">Discover</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(true)}
          className="relative border-app-ink/30 text-app-ink"
        >
          Filters
          {filterCount > 0 ? (
            <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-app-primary px-1 text-[10px] font-medium text-app-on-primary">
              {filterCount}
            </span>
          ) : null}
        </Button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-6">
        {loading ? (
          <p className="text-sm text-app-ink/60">Loading…</p>
        ) : current ? (
          <>
            <CandidateCard
              candidate={current}
              onLike={() => handleSwipe("like")}
              onPass={() => handleSwipe("pass")}
              onReport={() => setReportOpen(true)}
              onBlock={() => setBlockOpen(true)}
              busy={busy}
            />
            {error ? (
              <p role="alert" className="max-w-sm text-center text-sm text-app-warn">
                {error}
              </p>
            ) : null}
          </>
        ) : (
          <div className="w-full max-w-sm rounded-2xl border border-dashed border-app-ink/30 bg-card/40 p-10 text-center">
            <p className="font-serif text-lg text-app-ink">No profiles yet</p>
            <p className="mt-2 text-sm text-app-ink/60">Check back soon as new members join.</p>
          </div>
        )}
      </div>

      <DiscoverFilters
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        onApply={setFilters}
      />

      {matched ? <MatchDialog displayName={matched.display_name} onClose={closeMatch} /> : null}

      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        reportedName={current?.display_name ?? undefined}
        onSubmit={handleReport}
      />
      <BlockModal
        open={blockOpen}
        onOpenChange={setBlockOpen}
        blockedName={current?.display_name ?? undefined}
        onConfirm={handleBlock}
      />
    </section>
  );
}
