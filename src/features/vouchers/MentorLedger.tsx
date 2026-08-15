/**
 * Mentor "Discover" surface: a voucher ledger with pending requests (reusing
 * the notifications-pane pattern) and previously endorsed matches.
 */
import { useEffect, useState } from "react";
import { VoucherRequestItem } from "@/features/vouchers/VoucherRequestItem";
import { confirmAndEndorse, listOwnEndorsedVouchers } from "@/features/vouchers/api";
import type { EndorsedVoucher } from "@/features/vouchers/api";
import {
  getMentorActivity,
  respondToVoucher,
  type ActivityItem,
} from "@/features/notifications/api";
import { initialsOf } from "@/features/matches/logic";

type PendingItem = Extract<ActivityItem, { kind: "voucher_request" }>;

export function MentorLedger() {
  const [pending, setPending] = useState<PendingItem[] | null>(null);
  const [endorsed, setEndorsed] = useState<EndorsedVoucher[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [activity, approved] = await Promise.all([
          getMentorActivity(),
          listOwnEndorsedVouchers(),
        ]);
        if (!alive) return;
        setPending(activity.filter((i): i is PendingItem => i.kind === "voucher_request"));
        setEndorsed(approved);
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "Could not load your voucher ledger.");
          setPending([]);
          setEndorsed([]);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function refreshEndorsed() {
    try {
      setEndorsed(await listOwnEndorsedVouchers());
    } catch {
      // Non-fatal: the pending list has already been updated optimistically.
    }
  }

  async function handleApprove(voucherId: string, endorsement: string) {
    try {
      await confirmAndEndorse(voucherId, endorsement);
      setPending((prev) => (prev ?? []).filter((p) => p.voucherId !== voucherId));
      await refreshEndorsed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that request.");
    }
  }

  async function handleDecline(voucherId: string) {
    try {
      await respondToVoucher(voucherId, "declined");
      setPending((prev) => (prev ?? []).filter((p) => p.voucherId !== voucherId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that request.");
    }
  }

  return (
    <section className="flex flex-col px-4">
      <header className="mb-4">
        <h1 className="font-serif text-2xl text-app-ink">Voucher ledger</h1>
        <p className="mt-1 text-sm text-app-ink/70">
          Review endorsement requests and the matches you&apos;ve already endorsed.
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="mb-3 rounded-md border border-app-warn/40 bg-app-warn/10 px-3 py-2 text-sm text-app-warn"
        >
          {error}
        </p>
      ) : null}

      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-app-ink/60">Pending</h2>
      {pending === null ? (
        <p className="text-sm text-app-ink/60">Loading…</p>
      ) : pending.length === 0 ? (
        <p className="text-sm text-app-ink/60">No requests waiting on you.</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((p) => (
            <VoucherRequestItem
              key={p.voucherId}
              voucherId={p.voucherId}
              matchName={p.matchName}
              matchPhotoUrl={p.matchPhotoUrl}
              requestNote={p.requestNote}
              onApprove={handleApprove}
              onDecline={handleDecline}
            />
          ))}
        </ul>
      )}

      <h2 className="mb-2 mt-8 text-sm font-medium uppercase tracking-wide text-app-ink/60">
        Endorsed
      </h2>
      {endorsed === null ? (
        <p className="text-sm text-app-ink/60">Loading…</p>
      ) : endorsed.length === 0 ? (
        <p className="text-sm text-app-ink/60">You haven&apos;t endorsed anyone yet.</p>
      ) : (
        <ul className="space-y-3">
          {endorsed.map((e) => (
            <li
              key={e.id}
              className="flex gap-3 rounded-md border border-app-ink/15 bg-card px-3 py-3"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-app-accent/20">
                {e.photoSignedUrl ? (
                  <img src={e.photoSignedUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-serif text-sm text-app-ink/70">
                    {initialsOf(e.displayName)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-app-ink">{e.displayName}</p>
                {e.endorsement ? (
                  <p className="mt-1 text-sm text-app-ink/80">{e.endorsement}</p>
                ) : null}
                <p className="mt-1 text-xs text-app-ink/50">
                  {new Date(e.createdAt).toLocaleDateString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
