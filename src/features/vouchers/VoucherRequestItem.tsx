import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { initialsOf } from "@/features/matches/logic";
import { VOUCHER_TEXT_MAX, canApprove, counterLabel } from "@/features/vouchers/logic";

export interface VoucherRequestItemProps {
  voucherId: string;
  matchName: string;
  matchPhotoUrl: string | null;
  requestNote: string | null;
  onApprove: (voucherId: string, endorsement: string) => void | Promise<void>;
  onDecline: (voucherId: string) => void | Promise<void>;
}

/**
 * Mentor-side card for a single pending endorsement request. The Approve
 * button's disabled state is UI-only optimism — the real gate is the
 * `vouchers_approved_requires_confirmation` CHECK constraint in the database,
 * which rejects any approval without confirmation and non-empty endorsement.
 */
export function VoucherRequestItem({
  voucherId,
  matchName,
  matchPhotoUrl,
  requestNote,
  onApprove,
  onDecline,
}: VoucherRequestItemProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [endorsement, setEndorsement] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleApprove() {
    setBusy(true);
    try {
      await onApprove(voucherId, endorsement.trim());
    } finally {
      setBusy(false);
    }
  }

  async function handleDecline() {
    setBusy(true);
    try {
      await onDecline(voucherId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="space-y-3 rounded-md border border-app-ink/15 px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-app-accent/20">
          {matchPhotoUrl ? (
            <img src={matchPhotoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-sm text-app-ink/70">
              {initialsOf(matchName)}
            </div>
          )}
        </div>
        <span className="min-w-0 flex-1 truncate text-sm text-app-ink">
          {matchName} requested your endorsement
        </span>
      </div>

      {requestNote ? (
        <blockquote className="rounded-md bg-app-primary/5 px-3 py-2 text-sm text-app-ink/80">
          {requestNote}
        </blockquote>
      ) : null}

      <label className="flex items-start gap-2 text-sm text-app-ink/80">
        <Checkbox
          checked={confirmed}
          disabled={busy}
          onCheckedChange={(v) => setConfirmed(v === true)}
        />
        <span>I&apos;ve reviewed this request</span>
      </label>

      <div>
        <Textarea
          aria-label="Your endorsement"
          placeholder="Write a short endorsement…"
          maxLength={VOUCHER_TEXT_MAX}
          rows={3}
          value={endorsement}
          disabled={busy}
          onChange={(e) => setEndorsement(e.target.value)}
        />
        <p className="mt-1 text-right text-xs font-mono tabular-nums text-app-ink/50">
          {counterLabel(endorsement)}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy || !canApprove(confirmed, endorsement)}
          onClick={handleApprove}
          className="bg-app-primary text-app-on-primary hover:bg-app-primary/90"
        >
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={handleDecline}
          className="border-app-ink/25 text-app-ink"
        >
          Decline
        </Button>
      </div>
    </li>
  );
}
