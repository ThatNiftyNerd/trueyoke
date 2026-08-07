import { initialsOf } from "@/features/matches/logic";
import type { ActivityItem } from "@/features/notifications/api";

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

export interface ActivityItemRowProps {
  /** Any activity item except `voucher_request`, which has its own component. */
  item: Exclude<ActivityItem, { kind: "voucher_request" }>;
  onOpenChat: (matchId: string) => void;
  onOpenProfile: () => void;
}

/** Renders one non-voucher activity row. */
export function ActivityItemRow({ item, onOpenChat, onOpenProfile }: ActivityItemRowProps) {
  if (item.kind === "unread_messages") {
    return (
      <li>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md border border-app-ink/15 px-3 py-2 text-left hover:bg-app-primary/5"
          onClick={() => onOpenChat(item.matchId)}
        >
          <Avatar url={item.otherPhotoUrl} name={item.otherName} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-app-ink">{item.otherName}</span>
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
      <li className="rounded-md border border-app-ink/15 px-3 py-2 text-sm text-app-ink/70">
        Your request to {item.mentorName} is pending.
      </li>
    );
  }

  if (item.kind === "photo_update_needed") {
    return (
      <li>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md border border-app-ink/15 px-3 py-2 text-left hover:bg-app-primary/5"
          onClick={onOpenProfile}
        >
          <span className="min-w-0 flex-1 text-sm text-app-ink">
            Take a fresh photo for your new match
          </span>
        </button>
      </li>
    );
  }

  return (
    <li className="rounded-md border border-app-ink/15 px-3 py-2">
      <p className="text-sm font-medium text-app-ink">{item.title}</p>
      <p className="mt-1 text-sm text-app-ink/70">{item.body}</p>
      <p className="mt-1 text-xs text-app-ink/50">{relativeDate(item.createdAt)}</p>
    </li>
  );
}
