import { createFileRoute, redirect } from "@tanstack/react-router";
import { getOwnProfile } from "@/features/profile/api";
import { useEffect, useState } from "react";
import { ACTIVE_MATCH_CAP, MATCH_EXPIRY_HOURS } from "@/lib/constants";
import { listOwnMatches, type MatchListItem } from "@/features/matches/api";
import { partitionByStatus } from "@/features/matches/logic";
import { MatchRow } from "@/features/matches/MatchRow";

export const Route = createFileRoute("/app/matches")({
  // Defensive: mentors have no Matches tab, so bounce them to Discover.
  beforeLoad: async () => {
    const profile = await getOwnProfile().catch(() => null);
    if (profile?.account_type === "mentor") throw redirect({ to: "/app/discover" });
  },
  head: () => ({
    meta: [
      { title: "Matches — TrueYoke" },
      { name: "description", content: "Your active and expired matches." },
      { property: "og:title", content: "Matches — TrueYoke" },
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
    <section className="flex flex-col px-4 pb-8">
      <header className="mb-4">
        <h1 className="font-serif text-2xl text-app-ink">Matches</h1>
        <p className={`mt-1 text-sm ${atCap ? "text-app-warn font-medium" : "text-app-warn"}`}>
          <span className="font-mono tabular-nums">{activeCount}</span> of{" "}
          <span className="font-mono tabular-nums">{ACTIVE_MATCH_CAP}</span> active conversations
          {atCap ? " — cap reached" : ""}
        </p>
      </header>

      {error ? (
        <p className="mb-4 rounded border border-app-warn/40 bg-card/60 p-3 text-sm text-app-warn">
          {error}
        </p>
      ) : null}

      <div className="mb-6">
        <h2 className="mb-2 text-xs uppercase tracking-wider text-app-ink/60">Active</h2>
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
        <h2 className="mb-2 text-xs uppercase tracking-wider text-app-ink/60">Expired</h2>
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
    <div className="rounded-lg border border-dashed border-app-ink/20 bg-card/40 p-6 text-center text-sm text-app-ink/60">
      {children}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="rounded-lg border border-dashed border-app-ink/10 bg-card/30 p-6 text-center text-sm text-app-ink/40">
      Loading…
    </div>
  );
}
