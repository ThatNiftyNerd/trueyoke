import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
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
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-lg transition-shadow hover:shadow-lg focus-within:shadow-lg"
    >
      <Link
        to="/chat/$matchId"
        params={{ matchId: match.id }}
        className={`app-glass flex items-center gap-3 rounded-lg p-3 transition active:bg-app-canvas ${
          dim ? "opacity-70" : ""
        }`}
      >
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-app-accent/20">
          {other.photoSignedUrl ? (
            <img src={other.photoSignedUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-lg text-app-ink/70">
              {initialsOf(other.display_name)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-base text-app-ink">{name}</p>
          <p className="truncate text-xs text-app-ink/60">Last activity {relTime}</p>
        </div>
      </Link>
    </motion.div>
  );
}
