import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yoked — Faith-centered relationships" },
      {
        name: "description",
        content:
          "Yoked helps Church of Christ and conservative Christian singles pursue marriage-minded relationships with accountability.",
      },
      { property: "og:title", content: "Yoked — Faith-centered relationships" },
      {
        property: "og:description",
        content:
          "Yoked helps Church of Christ and conservative Christian singles pursue marriage-minded relationships with accountability.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-brand-linen px-6 text-center">
      <div className="max-w-sm space-y-3">
        <p className="text-sm uppercase tracking-widest text-brand-sage">Yoked</p>
        <h1 className="text-4xl font-serif font-semibold text-brand-burgundy">
          Do not be unequally yoked.
        </h1>
        <p className="text-brand-burgundy/70">
          A marriage-minded space for the Lord's church.
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          to="/auth"
          className="rounded-md bg-brand-burgundy px-6 py-3 text-brand-linen font-medium"
        >
          Get started
        </Link>
        <Link to="/auth" className="text-sm text-brand-burgundy underline">
          I already have an account
        </Link>
      </div>
    </main>
  );
}
