import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  isCurrentUserAdmin,
  listPendingChurchVerifications,
  listPendingIdVerifications,
  reviewChurchVerification,
  reviewIdVerification,
  type PendingChurchReview,
  type PendingIdReview,
} from "@/features/profile/api";

export const Route = createFileRoute("/app/admin-review")({
  head: () => ({
    meta: [
      { title: "Verification review — TrueYoke" },
      {
        name: "description",
        content: "Review pending ID and church affiliation verification submissions.",
      },
      { property: "og:title", content: "Verification review — TrueYoke" },
      {
        property: "og:description",
        content: "Review pending ID and church affiliation verification submissions.",
      },
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

  const [churchRows, setChurchRows] = useState<PendingChurchReview[] | null>(null);
  const [churchBusyId, setChurchBusyId] = useState<string | null>(null);
  const [churchRejectingId, setChurchRejectingId] = useState<string | null>(null);
  const [churchReason, setChurchReason] = useState("");
  const [churchError, setChurchError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listPendingIdVerifications()
      .then((r) => alive && setRows(r))
      .catch(() => alive && setRows([]));
    listPendingChurchVerifications()
      .then((r) => alive && setChurchRows(r))
      .catch(() => alive && setChurchRows([]));
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

  async function decideChurch(id: string, decision: "verified" | "rejected", why?: string) {
    setChurchError(null);
    setChurchBusyId(id);
    try {
      await reviewChurchVerification(id, decision, why);
      setChurchRows((prev) => (prev ?? []).filter((r) => r.id !== id));
      setChurchRejectingId(null);
      setChurchReason("");
    } catch {
      setChurchError("Couldn't save that decision. Try again.");
    } finally {
      setChurchBusyId(null);
    }
  }

  return (
    <section className="flex flex-col px-4">
      <header className="mb-6">
        <Link to="/app/profile" className="text-sm text-app-ink underline">
          ← Back to profile
        </Link>
        <h1 className="mt-3 font-serif text-2xl text-app-ink">Verification review</h1>
      </header>

      {error ? (
        <p role="alert" className="mb-3 text-sm text-app-warn">
          {error}
        </p>
      ) : null}

      <h2 className="mb-4 font-serif text-xl text-app-ink">ID review</h2>

      {rows === null ? (
        <p className="text-sm text-app-ink/60">Yoking…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-app-ink/60">No pending submissions.</p>
      ) : (
        <ul className="space-y-6">
          {rows.map((r) => (
            <li key={r.id} className="overflow-hidden rounded-lg border border-app-ink/15 bg-card">
              <div className="flex items-baseline justify-between p-3">
                <span className="font-medium text-app-ink">{r.displayName}</span>
                <span className="text-xs text-app-ink/60">
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
                <p className="px-3 pb-3 text-sm text-app-warn">Document unavailable.</p>
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
                      className="bg-app-primary text-app-on-primary hover:bg-app-primary/90"
                      disabled={busyId === r.id}
                      onClick={() => void decide(r.id, "rejected", reason)}
                    >
                      Confirm reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-app-ink/30 text-app-ink"
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
                    className="flex-1 bg-app-accent text-app-on-primary hover:bg-app-accent/90"
                    disabled={busyId === r.id}
                    onClick={() => void decide(r.id, "verified")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-app-ink/30 text-app-ink"
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

      <h2 className="mb-4 mt-10 font-serif text-xl text-app-ink">Church affiliation review</h2>

      {churchError ? (
        <p role="alert" className="mb-3 text-sm text-app-warn">
          {churchError}
        </p>
      ) : null}

      {churchRows === null ? (
        <p className="text-sm text-app-ink/60">Yoking…</p>
      ) : churchRows.length === 0 ? (
        <p className="text-sm text-app-ink/60">No pending submissions.</p>
      ) : (
        <ul className="space-y-6">
          {churchRows.map((r) => (
            <li key={r.id} className="overflow-hidden rounded-lg border border-app-ink/15 bg-card">
              <div className="p-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-app-ink">{r.displayName}</span>
                  <span className="text-xs text-app-ink/60">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {r.claimedChurchAffiliation ? (
                  <p className="mt-1 text-xs text-app-ink/60">
                    Claims: {r.claimedChurchAffiliation}
                  </p>
                ) : null}
              </div>
              {r.evidenceSignedUrl ? (
                <img
                  src={r.evidenceSignedUrl}
                  alt={`Church verification evidence submitted by ${r.displayName}`}
                  className="w-full object-contain"
                />
              ) : (
                <p className="px-3 pb-3 text-sm text-app-warn">Evidence unavailable.</p>
              )}

              {churchRejectingId === r.id ? (
                <div className="space-y-2 p-3">
                  <Textarea
                    value={churchReason}
                    onChange={(e) => setChurchReason(e.target.value)}
                    placeholder="Optional reason shown to the member"
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-app-primary text-app-on-primary hover:bg-app-primary/90"
                      disabled={churchBusyId === r.id}
                      onClick={() => void decideChurch(r.id, "rejected", churchReason)}
                    >
                      Confirm reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-app-ink/30 text-app-ink"
                      onClick={() => {
                        setChurchRejectingId(null);
                        setChurchReason("");
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
                    className="flex-1 bg-app-accent text-app-on-primary hover:bg-app-accent/90"
                    disabled={churchBusyId === r.id}
                    onClick={() => void decideChurch(r.id, "verified")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-app-ink/30 text-app-ink"
                    disabled={churchBusyId === r.id}
                    onClick={() => setChurchRejectingId(r.id)}
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
