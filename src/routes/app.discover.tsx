import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/discover")({
  head: () => ({
    meta: [
      { title: "Discover — Yoked" },
      { name: "description", content: "Discover marriage-minded members." },
      { property: "og:title", content: "Discover — Yoked" },
      { property: "og:description", content: "Discover marriage-minded members." },
    ],
  }),
  component: DiscoverScreen,
});

function DiscoverScreen() {
  return (
    <section className="flex min-h-[calc(100dvh-6rem)] flex-col px-4 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-brand-burgundy">Discover</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-brand-burgundy/30 text-brand-burgundy"
        >
          {/* TODO: open distance / compatibility filter sheet */}
          Filters
        </Button>
      </header>

      {/* Swipe deck placeholder — empty state */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl border border-dashed border-brand-burgundy/30 bg-white/40 p-10 text-center">
          <p className="font-serif text-lg text-brand-burgundy">No profiles yet</p>
          <p className="mt-2 text-sm text-brand-burgundy/60">
            Check back soon as new members join.
          </p>
        </div>
      </div>
    </section>
  );
}
