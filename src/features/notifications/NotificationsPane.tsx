import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getOwnProfile } from "@/features/profile/api";
import { initialsOf } from "@/features/matches/logic";
import { VoucherRequestItem } from "@/features/vouchers/VoucherRequestItem";
import { confirmAndEndorse } from "@/features/vouchers/api";

import {
  getMatchActivity,
  getMentorActivity,
  respondToVoucher,
  type ActivityItem,
} from "@/features/notifications/api";

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  if (diff < 3_600_000) return "Just now";
  if (diff < day) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-app-accent/20">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-serif text-sm text-app-ink/70">
          {initialsOf(name)}
        </div>
      )}
    </div>
  );
}

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

  async function handleVoucher(voucherId: string, decision: "approved" | "declined") {
    try {
      await respondToVoucher(voucherId, decision);
      setItems((prev) => {
        const next = prev.filter(
          (i) => !(i.kind === "voucher_request" && i.voucherId === voucherId),
        );
        onItemsChange?.(next);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that request.");
    }
  }

  function dropVoucher(voucherId: string) {
    setItems((prev) => {
      const next = prev.filter((i) => !(i.kind === "voucher_request" && i.voucherId === voucherId));
      onItemsChange?.(next);
      return next;
    });
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
          <p className="py-6 text-center text-sm text-app-ink/60">Loading…</p>
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
            {items.map((item, idx) => {
              if (item.kind === "unread_messages") {
                return (
                  <li key={`m-${item.matchId}`}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md border border-app-ink/15 px-3 py-2 text-left hover:bg-app-primary/5"
                      onClick={() => {
                        onOpenChange(false);
                        navigate({ to: "/chat/$matchId", params: { matchId: item.matchId } });
                      }}
                    >
                      <Avatar url={item.otherPhotoUrl} name={item.otherName} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-app-ink">
                          {item.otherName}
                        </span>
                        <span className="block text-xs text-app-ink/60">
                          {item.count} new message{item.count === 1 ? "" : "s"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              }

              if (item.kind === "pending_mentor_request") {
                return (
                  <li
                    key={`mentor-${item.mentorName}`}
                    className="rounded-md border border-app-ink/15 px-3 py-2 text-sm text-app-ink/70"
                  >
                    Your request to {item.mentorName} is pending.
                  </li>
                );
              }

              if (item.kind === "voucher_request") {
                return (
                  <VoucherRequestItem
                    key={`v-${item.voucherId}`}
                    voucherId={item.voucherId}
                    matchName={item.matchName}
                    matchPhotoUrl={item.matchPhotoUrl}
                    requestNote={item.requestNote}
                    onApprove={handleApprove}
                    onDecline={(id) => handleVoucher(id, "declined")}
                  />
                );
              }

              if (item.kind === "photo_update_needed") {
                return (
                  <li key="photo-update">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md border border-app-ink/15 px-3 py-2 text-left hover:bg-app-primary/5"
                      onClick={() => {
                        onOpenChange(false);
                        navigate({ to: "/app/profile" });
                      }}
                    >
                      <span className="min-w-0 flex-1 text-sm text-app-ink">
                        Take a fresh photo for your new match
                      </span>
                    </button>
                  </li>
                );
              }

              return (
                <li
                  key={`a-${item.id}-${idx}`}
                  className="rounded-md border border-app-ink/15 px-3 py-2"
                >
                  <p className="text-sm font-medium text-app-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-app-ink/70">{item.body}</p>
                  <p className="mt-1 text-xs text-app-ink/50">{relativeDate(item.createdAt)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
