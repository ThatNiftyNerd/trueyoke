import { createFileRoute } from "@tanstack/react-router";
import { ACTIVE_MATCH_CAP, MATCH_EXPIRY_HOURS } from "@/lib/constants";

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
  // TODO: fetch counts via features/matches/api.ts
  const activeCount = 0;

  return (
    <section className="flex flex-col px-4 pt-6">
      <header className="mb-4">
        <h1 className="font-serif text-2xl text-brand-burgundy">Matches</h1>
        {/* Chat-cap indicator — terracotta is functional only (cap / expiry). */}
        <p className="mt-1 text-sm text-brand-terracotta">
          {activeCount} of {ACTIVE_MATCH_CAP} active conversations
        </p>
      </header>

      <div className="mb-6">
        <h2 className="mb-2 text-xs uppercase tracking-wider text-brand-burgundy/60">
          Active
        </h2>
        <div className="rounded-lg border border-dashed border-brand-burgundy/20 bg-white/40 p-6 text-center text-sm text-brand-burgundy/60">
          {/* TODO: list active matches. Server-side trigger auto-expires after {MATCH_EXPIRY_HOURS}h. */}
          No active matches yet. Matches expire after {MATCH_EXPIRY_HOURS} hours of no activity.
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs uppercase tracking-wider text-brand-burgundy/60">
          Expired
        </h2>
        <div className="rounded-lg border border-dashed border-brand-burgundy/20 bg-white/40 p-6 text-center text-sm text-brand-burgundy/60">
          {/* TODO: list expired matches */}
          Nothing here.
        </div>
      </div>
    </section>
  );
}
