import { createFileRoute, Link } from "@tanstack/react-router";
import { redirectIfSignedIn } from "@/features/auth/guards";
import { CopyrightNotice } from "@/components/app/CopyrightNotice";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrueYoke — Faith-centered relationships" },
      {
        name: "description",
        content:
          "TrueYoke helps Church of Christ and conservative Christian singles pursue marriage-minded relationships with accountability.",
      },
      { property: "og:title", content: "TrueYoke — Faith-centered relationships" },
      {
        property: "og:description",
        content:
          "TrueYoke helps Church of Christ and conservative Christian singles pursue marriage-minded relationships with accountability.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // Public welcome screen; signed-in users go straight to the app.
  beforeLoad: () => redirectIfSignedIn(),
  component: Landing,
});

function Landing() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-app-canvas px-6 text-center">
      <div className="max-w-sm space-y-3">
        <p className="text-sm uppercase tracking-widest text-app-on-accent">TrueYoke</p>
        <h1 className="text-4xl font-serif font-semibold text-app-ink">
          Do not be unequally yoked.
        </h1>
        <p className="text-app-ink/70">A marriage-minded space for the Lord's church.</p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          to="/choose-type"
          className="rounded-md bg-app-primary px-6 py-3 text-app-on-primary font-medium"
        >
          Get started
        </Link>
        <Link to="/auth" search={{ mode: "signin" }} className="text-sm text-app-ink underline">
          I already have an account
        </Link>
      </div>


      <CopyrightNotice className="mt-4" />
    </main>
  );
}
