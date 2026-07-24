import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/chat/$matchId")({
  head: () => ({
    meta: [
      { title: "Chat — Yoked" },
      { name: "description", content: "Conversation with your match." },
      { property: "og:title", content: "Chat — Yoked" },
      { property: "og:description", content: "Conversation with your match." },
    ],
  }),
  component: ChatScreen,
});

function ChatScreen() {
  const { matchId } = Route.useParams();

  return (
    <main className="flex min-h-[100dvh] flex-col bg-brand-linen">
      <header className="flex items-center gap-3 border-b border-brand-burgundy/10 bg-brand-linen px-4 py-3">
        <Link to="/app/matches" aria-label="Back to matches" className="text-brand-burgundy">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          {/* TODO: render match partner display name */}
          <p className="font-serif text-lg text-brand-burgundy">Conversation</p>
          <p className="text-xs text-brand-burgundy/50">match {matchId.slice(0, 8)}</p>
        </div>
      </header>

      <section className="flex-1 overflow-y-auto px-4 py-4">
        {/* TODO: message list via features/chat/api.ts + realtime subscription */}
        <div className="mx-auto max-w-sm rounded-lg border border-dashed border-brand-burgundy/20 bg-white/40 p-6 text-center text-sm text-brand-burgundy/60">
          Say hello with intention.
        </div>
      </section>

      <footer className="border-t border-brand-burgundy/10 bg-brand-linen p-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: sendMessage via features/chat/api.ts
          }}
        >
          <input
            type="text"
            placeholder="Write a message"
            className="flex-1 rounded-full border border-brand-burgundy/20 bg-white px-4 py-2 text-sm outline-none focus:border-brand-burgundy"
          />
          <button
            type="submit"
            className="rounded-full bg-brand-burgundy px-4 py-2 text-sm font-medium text-brand-linen"
          >
            Send
          </button>
        </form>
      </footer>
    </main>
  );
}
