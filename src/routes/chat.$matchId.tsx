import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getCurrentSession, getCurrentUserId } from "@/features/auth/api";
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

export const Route = createFileRoute("/chat/$matchId")({
  head: () => ({
    meta: [
      { title: "Chat — Yoked" },
      { name: "description", content: "Conversation with your match." },
      { property: "og:title", content: "Chat — Yoked" },
      { property: "og:description", content: "Conversation with your match." },
    ],
  }),
  beforeLoad: async () => {
    const session = await getCurrentSession();
    if (!session) throw redirect({ to: "/auth" });
  },
  component: ChatScreen,
});

function ChatScreen() {
  const { matchId } = Route.useParams();
  const [item, setItem] = useState<MatchListItem | null | undefined>(undefined);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Initial load: current user id, match + other, message history.
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
      const history = await listMessages(matchId);
      if (cancelled) return;
      setMessages(history);
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  // Realtime: new messages + match status flips.
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

  // Auto-scroll to latest whenever the message list changes.
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

  const name = displayNameOf(item.other);
  const isActive = status === "active";

  async function handleSend(body: string) {
    const result = await sendMessage(matchId, body);
    if (result.kind === "not_active") {
      setStatus("expired");
      throw new Error("This conversation is no longer active.");
    }
    if (result.kind === "too_long" || result.kind === "empty") {
      throw new Error("Message could not be sent.");
    }
    // On success, Realtime INSERT will append; guard added in subscription.
    if (result.kind === "sent") {
      setMessages((prev) => (prev.some((m) => m.id === result.message.id) ? prev : [...prev, result.message]));
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-brand-linen">
      <header className="flex items-center gap-3 border-b border-brand-burgundy/10 bg-brand-linen px-4 py-3">
        <Link to="/app/matches" aria-label="Back to matches" className="text-brand-burgundy">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-brand-sage/20">
          {item.other.photoSignedUrl ? (
            <img src={item.other.photoSignedUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-sm text-brand-burgundy/70">
              {initialsOf(item.other.display_name)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-lg text-brand-burgundy">{name}</p>
          {!isActive ? (
            <p className="text-xs text-brand-terracotta">Conversation ended</p>
          ) : null}
        </div>
      </header>

      <section ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-sm rounded-lg border border-dashed border-brand-burgundy/20 bg-white/40 p-6 text-center text-sm text-brand-burgundy/60">
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
        disabled={!isActive}
        disabledReason="This conversation has ended. History is preserved, but new messages can't be sent."
        onSend={handleSend}
      />
    </main>
  );
}
