import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Yoked" },
      { name: "description", content: "View and edit your Yoked profile." },
      { property: "og:title", content: "Your profile — Yoked" },
      { property: "og:description", content: "View and edit your Yoked profile." },
    ],
  }),
  component: ProfileScreen,
});

function ProfileScreen() {
  return (
    <section className="flex flex-col px-4 pt-6">
      <header className="mb-6 text-center">
        <div className="mx-auto h-24 w-24 rounded-full bg-brand-sage/20" aria-hidden="true" />
        <h1 className="mt-3 font-serif text-2xl text-brand-burgundy">Your profile</h1>
        {/* TODO: display church-verified sage badge when profile.church_verified */}
        <p className="mt-1 text-sm text-brand-burgundy/60">Not yet complete</p>
      </header>

      <div className="space-y-3">
        <Button className="w-full bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90">
          Edit profile
        </Button>
        <Link
          to="/verify-id"
          className="block rounded-md border border-brand-sage bg-brand-sage/10 px-4 py-3 text-center text-sm font-medium text-brand-burgundy"
        >
          Verify your ID
        </Link>
        <Button variant="outline" className="w-full border-brand-burgundy/30 text-brand-burgundy">
          {/* TODO: sign out via features/auth/api.ts */}
          Sign out
        </Button>
      </div>
    </section>
  );
}
