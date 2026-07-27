import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  isCurrentUserAdmin,
  listPendingIdVerifications,
  reviewIdVerification,
  type PendingIdReview,
} from "@/features/profile/api";

export const Route = createFileRoute("/app/admin-review")({
  head: () => ({
    meta: [
      { title: "ID review — Yoked" },
      { name: "description", content: "Review pending ID verification submissions." },
      { property: "og:title", content: "ID review — Yoked" },
      { property: "og:description", content: "Review pending ID verification submissions." },
    ],
  }),
  // UI-level guard. RLS on id_verifications remains the real data boundary.
  beforeLoad: async () => {
    const admin = await isCurrentUserAdmin();
    if (!admin) throw redirect({ to: "/app/profile" });
  },
  component: AdminReviewScreen,
});

function AdminReviewScreen() {
  const [rows, setRows] = useState<PendingIdReview[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listPendingIdVerifications()
      .then((r) => alive && setRows(r))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, []);

  async function decide(id: string, decision: "verified" | "rejected", why?: string) {
    setError(null);
    setBusyId(id);
    try {
      await reviewIdVerification(id, decision, why);
      setRows((prev) => (prev ?? []).filter((r) => r.id !== id));
      setRejectingId(null);
      setReason("");
    } catch {
      setError("Couldn't save that decision. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="flex flex-col px-4 pt-6">
      <header className="mb-6">
        <Link to="/app/profile" className="text-sm text-brand-burgundy underline">
          ← Back to profile
        </Link>
        <h1 className="mt-3 font-serif text-2xl text-brand-burgundy">ID review</h1>
      </header>

      {error ? (
        <p role="alert" className="mb-3 text-sm text-brand-terracotta">
          {error}
        </p>
      ) : null}

      {rows === null ? (
        <p className="text-sm text-brand-burgundy/60">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-brand-burgundy/60">No pending submissions.</p>
      ) : (
        <ul className="space-y-6">
          {rows.map((r) => (
            <li
              key={r.id}
              className="overflow-hidden rounded-lg border border-brand-burgundy/15 bg-card"
            >
              <div className="flex items-baseline justify-between p-3">
                <span className="font-medium text-brand-burgundy">{r.displayName}</span>
                <span className="text-xs text-brand-burgundy/60">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              {r.documentSignedUrl ? (
                <img
                  src={r.documentSignedUrl}
                  alt={`ID document submitted by ${r.displayName}`}
                  className="w-full object-contain"
                />
              ) : (
                <p className="px-3 pb-3 text-sm text-brand-terracotta">Document unavailable.</p>
              )}

              {rejectingId === r.id ? (
                <div className="space-y-2 p-3">
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Optional reason shown to the member"
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90"
                      disabled={busyId === r.id}
                      onClick={() => void decide(r.id, "rejected", reason)}
                    >
                      Confirm reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-brand-burgundy/30 text-brand-burgundy"
                      onClick={() => {
                        setRejectingId(null);
                        setReason("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 p-3">
                  <Button
                    size="sm"
                    className="flex-1 bg-brand-sage text-brand-linen hover:bg-brand-sage/90"
                    disabled={busyId === r.id}
                    onClick={() => void decide(r.id, "verified")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-brand-burgundy/30 text-brand-burgundy"
                    disabled={busyId === r.id}
                    onClick={() => setRejectingId(r.id)}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
