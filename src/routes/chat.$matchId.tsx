import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUserId } from "@/features/auth/api";
import { requireCompleteProfile } from "@/features/auth/guards";
import {
  getMatchWithOther,
  subscribeToMatchStatus,
  type MatchListItem,
} from "@/features/matches/api";
import { displayNameOf, initialsOf } from "@/features/matches/logic";
import {
  listMessages,
  sendMessage,
  subscribeToMessages,
  type MessageRow,
} from "@/features/chat/api";
import { MessageBubble } from "@/features/chat/MessageBubble";
import { MessageComposer } from "@/features/chat/MessageComposer";
import { BlockModal, ReportModal } from "@/features/safety/ReportBlockModals";
import { blockProfile, isBlockedWith, reportProfile } from "@/features/safety/api";
import { formatReason, type ReportReason } from "@/features/safety/logic";

export const Route = createFileRoute("/chat/$matchId")({
  head: () => ({
    meta: [
      { title: "Chat — Yoked" },
      { name: "description", content: "Conversation with your match." },
      { property: "og:title", content: "Chat — Yoked" },
      { property: "og:description", content: "Conversation with your match." },
    ],
  }),
  beforeLoad: requireCompleteProfile,
  component: ChatScreen,
});

function ChatScreen() {
  const { matchId } = Route.useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<MatchListItem | null | undefined>(undefined);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Initial load: current user id, match + other, message history, block state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const uid = await getCurrentUserId();
      if (cancelled) return;
      setUserId(uid);
      const m = await getMatchWithOther(matchId);
      if (cancelled) return;
      setItem(m);
      if (!m) return;
      setStatus(m.match.status);
      const [history, isBlk] = await Promise.all([
        listMessages(matchId),
        isBlockedWith(m.other.id),
      ]);
      if (cancelled) return;
      setMessages(history);
      setBlocked(isBlk);
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  useEffect(() => {
    if (!item) return;
    const offMsg = subscribeToMessages(matchId, (row) => {
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
    });
    const offMatch = subscribeToMatchStatus(matchId, (row) => {
      setStatus(row.status);
    });
    return () => {
      offMsg();
      offMatch();
    };
  }, [matchId, item]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  if (item === undefined) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-brand-linen text-sm text-brand-burgundy/60">
        Loading…
      </main>
    );
  }

  if (item === null) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-brand-linen p-6 text-center">
        <p className="font-serif text-xl text-brand-burgundy">Conversation not found</p>
        <p className="text-sm text-brand-burgundy/60">
          It may have ended, or you no longer have access.
        </p>
        <Link
          to="/app/matches"
          className="mt-2 rounded-full bg-brand-burgundy px-4 py-2 text-sm text-brand-linen"
        >
          Back to matches
        </Link>
      </main>
    );
  }

  const other = item.other;
  const name = displayNameOf(other);
  const isActive = status === "active";
  const composerDisabled = !isActive || blocked;
  const composerReason = blocked
    ? "You've blocked this person, so messages can't be sent."
    : "This conversation has ended. History is preserved, but new messages can't be sent.";

  async function handleSend(body: string) {
    const result = await sendMessage(matchId, body);
    if (result.kind === "not_active") {
      setStatus("expired");
      throw new Error("This conversation is no longer active.");
    }
    if (result.kind === "too_long" || result.kind === "empty") {
      throw new Error("Message could not be sent.");
    }
    if (result.kind === "sent") {
      setMessages((prev) =>
        prev.some((m) => m.id === result.message.id) ? prev : [...prev, result.message],
      );
    }
  }

  async function handleReport(category: ReportReason, details: string) {
    await reportProfile(other.id, formatReason(category, details));
  }

  async function handleBlock() {
    await blockProfile(other.id);
    navigate({ to: "/app/matches" });
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-brand-linen">
      <header className="flex items-center gap-3 border-b border-brand-burgundy/10 bg-brand-linen px-4 py-3">
        <Link to="/app/matches" aria-label="Back to matches" className="text-brand-burgundy">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-brand-sage/20">
          {other.photoSignedUrl ? (
            <img src={other.photoSignedUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-sm text-brand-burgundy/70">
              {initialsOf(other.display_name)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-lg text-brand-burgundy">{name}</p>
          {!isActive ? <p className="text-xs text-brand-terracotta">Conversation ended</p> : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More options"
              className="rounded-full p-2 text-brand-burgundy hover:bg-brand-burgundy/10"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setReportOpen(true)}>Report</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setBlockOpen(true)} className="text-brand-terracotta">
              Block
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <section ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-sm rounded-lg border border-dashed border-brand-burgundy/20 bg-card/40 p-6 text-center text-sm text-brand-burgundy/60">
            Say hello with intention.
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} mine={m.sender_id === userId} />
            ))}
          </div>
        )}
      </section>

      <MessageComposer
        disabled={composerDisabled}
        disabledReason={composerReason}
        onSend={handleSend}
      />

      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        reportedName={name}
        onSubmit={handleReport}
      />
      <BlockModal
        open={blockOpen}
        onOpenChange={setBlockOpen}
        blockedName={name}
        onConfirm={handleBlock}
      />
    </main>
  );
}
