import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import type { MatchListItem } from "./api";
import { displayNameOf, initialsOf } from "./logic";

interface Props {
  item: MatchListItem;
  dim?: boolean;
}

export function MatchRow({ item, dim }: Props) {
  const { match, other } = item;
  const name = displayNameOf(other);
  const relTime = formatDistanceToNow(new Date(match.last_activity_at), { addSuffix: true });

  return (
    <Link
      to="/chat/$matchId"
      params={{ matchId: match.id }}
      className={`flex items-center gap-3 rounded-lg border border-brand-burgundy/15 bg-white p-3 transition active:bg-brand-linen ${
        dim ? "opacity-70" : ""
      }`}
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-brand-sage/20">
        {other.photoSignedUrl ? (
          <img src={other.photoSignedUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif text-lg text-brand-burgundy/70">
            {initialsOf(other.display_name)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-base text-brand-burgundy">{name}</p>
        <p className="truncate text-xs text-brand-burgundy/60">Last activity {relTime}</p>
      </div>
    </Link>
  );
}
