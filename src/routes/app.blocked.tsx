import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { listBlockedProfiles, unblockProfile, type BlockedProfile } from "@/features/safety/api";
import { initialsOf } from "@/features/discovery/logic";

export const Route = createFileRoute("/app/blocked")({
  head: () => ({
    meta: [
      { title: "Blocked users — Yoked" },
      { name: "description", content: "Review and unblock people you've blocked on Yoked." },
      { property: "og:title", content: "Blocked users — Yoked" },
      {
        property: "og:description",
        content: "Review and unblock people you've blocked on Yoked.",
      },
    ],
  }),
  component: BlockedScreen,
});

function BlockedScreen() {
  const [rows, setRows] = useState<BlockedProfile[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listBlockedProfiles()
      .then((r) => alive && setRows(r))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, []);

  async function handleUnblock(blockedId: string) {
    setError(null);
    setBusyId(blockedId);
    try {
      await unblockProfile(blockedId);
      setRows((prev) => (prev ?? []).filter((r) => r.blockedId !== blockedId));
    } catch {
      setError("Couldn't unblock right now. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="flex flex-col px-4 pt-6">
      <header className="mb-6">
        <Link to="/app/profile" className="text-sm text-app-ink underline">
          ← Back to profile
        </Link>
        <h1 className="mt-3 font-serif text-2xl text-app-ink">Blocked users</h1>
      </header>

      {error ? (
        <p role="alert" className="mb-3 text-sm text-app-warn">
          {error}
        </p>
      ) : null}

      {rows === null ? (
        <p className="text-sm text-app-ink/60">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-app-ink/60">You haven't blocked anyone.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.blockedId}
              className="flex items-center gap-3 rounded-lg border border-app-ink/15 bg-card p-3"
            >
              {r.photoSignedUrl ? (
                <img
                  src={r.photoSignedUrl}
                  alt={r.displayName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-accent/20 font-serif text-app-ink/70">
                  {initialsOf(r.displayName)}
                </div>
              )}
              <span className="flex-1 text-sm font-medium text-app-ink">{r.displayName}</span>
              <Button
                variant="outline"
                size="sm"
                className="border-app-ink/30 text-app-ink"
                disabled={busyId === r.blockedId}
                onClick={() => void handleUnblock(r.blockedId)}
              >
                {busyId === r.blockedId ? "…" : "Unblock"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
