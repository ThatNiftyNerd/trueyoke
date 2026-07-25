import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ACTIVE_MATCH_CAP, MATCH_EXPIRY_HOURS } from "@/lib/constants";
import { listOwnMatches, type MatchListItem } from "@/features/matches/api";
import { partitionByStatus } from "@/features/matches/logic";
import { MatchRow } from "@/features/matches/MatchRow";

export const Route = createFileRoute("/app/matches")({
  head: () => ({
    meta: [
      { title: "Matches — Yoked" },
      { name: "description", content: "Your active and expired matches." },
      { property: "og:title", content: "Matches — Yoked" },
      { property: "og:description", content: "Your active and expired matches." },
    ],
  }),
  component: MatchesScreen,
});

function MatchesScreen() {
  const [items, setItems] = useState<MatchListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listOwnMatches()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load matches.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { active, expired } = partitionByStatus(items ?? []);
  const activeCount = active.length;
  const atCap = activeCount >= ACTIVE_MATCH_CAP;

  return (
    <section className="flex flex-col px-4 pt-6 pb-8">
      <header className="mb-4">
        <h1 className="font-serif text-2xl text-brand-burgundy">Matches</h1>
        <p className={`mt-1 text-sm ${atCap ? "text-brand-terracotta font-medium" : "text-brand-terracotta"}`}>
          {activeCount} of {ACTIVE_MATCH_CAP} active conversations
          {atCap ? " — cap reached" : ""}
        </p>
      </header>

      {error ? (
        <p className="mb-4 rounded border border-brand-terracotta/40 bg-white/60 p-3 text-sm text-brand-terracotta">
          {error}
        </p>
      ) : null}

      <div className="mb-6">
        <h2 className="mb-2 text-xs uppercase tracking-wider text-brand-burgundy/60">Active</h2>
        {items === null ? (
          <SectionSkeleton />
        ) : active.length === 0 ? (
          <EmptyState>
            No active matches yet. Matches expire after {MATCH_EXPIRY_HOURS} hours of no activity.
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {active.map((it) => (
              <MatchRow key={it.match.id} item={it} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-xs uppercase tracking-wider text-brand-burgundy/60">Expired</h2>
        {items === null ? (
          <SectionSkeleton />
        ) : expired.length === 0 ? (
          <EmptyState>Nothing here.</EmptyState>
        ) : (
          <div className="space-y-2">
            {expired.map((it) => (
              <MatchRow key={it.match.id} item={it} dim />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-brand-burgundy/20 bg-white/40 p-6 text-center text-sm text-brand-burgundy/60">
      {children}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="rounded-lg border border-dashed border-brand-burgundy/10 bg-white/30 p-6 text-center text-sm text-brand-burgundy/40">
      Loading…
    </div>
  );
}
