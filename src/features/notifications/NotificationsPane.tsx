import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getOwnProfile } from "@/features/profile/api";
import { VoucherRequestItem } from "@/features/vouchers/VoucherRequestItem";
import { confirmAndEndorse } from "@/features/vouchers/api";
import { ActivityItemRow } from "@/features/notifications/ActivityItemRow";
import {
  getMatchActivity,
  getMentorActivity,
  respondToVoucher,
  type ActivityItem,
} from "@/features/notifications/api";

export interface NotificationsPaneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lets the shell keep its bell badge in sync with what the pane fetched. */
  onItemsChange?: (items: ActivityItem[]) => void;
}

/**
 * In-app activity pane. Content is fetched each time the dialog opens and
 * differs by account type ("match" vs "mentor").
 */
export function NotificationsPane({ open, onOpenChange, onItemsChange }: NotificationsPaneProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const profile = await getOwnProfile();
        const list =
          profile?.account_type === "mentor" ? await getMentorActivity() : await getMatchActivity();
        if (!alive) return;
        setItems(list);
        onItemsChange?.(list);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Could not load notifications.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dropVoucher(voucherId: string) {
    setItems((prev) => {
      const next = prev.filter((i) => !(i.kind === "voucher_request" && i.voucherId === voucherId));
      onItemsChange?.(next);
      return next;
    });
  }

  async function handleVoucher(voucherId: string, decision: "approved" | "declined") {
    try {
      await respondToVoucher(voucherId, decision);
      dropVoucher(voucherId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that request.");
    }
  }

  async function handleApprove(voucherId: string, endorsement: string) {
    try {
      await confirmAndEndorse(voucherId, endorsement);
      dropVoucher(voucherId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that request.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="py-6 text-center text-sm text-app-ink/60">Yoking…</p>
        ) : error ? (
          <p
            role="alert"
            className="rounded-md border border-app-warn/40 bg-app-warn/10 px-3 py-2 text-sm text-app-warn"
          >
            {error}
          </p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-app-ink/60">Nothing new right now.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, idx) =>
              item.kind === "voucher_request" ? (
                <VoucherRequestItem
                  key={`v-${item.voucherId}`}
                  voucherId={item.voucherId}
                  matchName={item.matchName}
                  matchPhotoUrl={item.matchPhotoUrl}
                  requestNote={item.requestNote}
                  onApprove={handleApprove}
                  onDecline={(id) => handleVoucher(id, "declined")}
                />
              ) : (
                <ActivityItemRow
                  key={`i-${item.kind}-${idx}`}
                  item={item}
                  onOpenChat={(matchId) => {
                    onOpenChange(false);
                    navigate({ to: "/chat/$matchId", params: { matchId } });
                  }}
                  onOpenProfile={() => {
                    onOpenChange(false);
                    navigate({ to: "/app/profile" });
                  }}
                />
              ),
            )}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
