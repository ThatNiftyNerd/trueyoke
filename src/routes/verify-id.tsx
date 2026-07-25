import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/features/auth/api";

export const Route = createFileRoute("/verify-id")({
  head: () => ({
    meta: [
      { title: "Verify your ID — Yoked" },
      { name: "description", content: "Upload a government ID for verification." },
      { property: "og:title", content: "Verify your ID — Yoked" },
      { property: "og:description", content: "Upload a government ID for verification." },
    ],
  }),
  beforeLoad: async () => {
    const session = await getCurrentSession();
    if (!session) throw redirect({ to: "/auth" });
  },
  component: VerifyIdScreen,
});

function VerifyIdScreen() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="flex min-h-[100dvh] flex-col bg-brand-linen px-6 py-8">
      <header className="mb-6">
        <Link to="/app/profile" className="text-sm text-brand-burgundy underline">
          ← Back to profile
        </Link>
        <h1 className="mt-4 font-serif text-2xl text-brand-burgundy">Verify your ID</h1>
        <p className="mt-1 text-sm text-brand-burgundy/70">
          A quick check keeps Yoked safe for the church.
        </p>
      </header>

      {submitted ? (
        <div className="rounded-lg border border-brand-sage bg-brand-sage/10 p-6 text-center">
          <p className="font-serif text-lg text-brand-burgundy">Pending review</p>
          <p className="mt-2 text-sm text-brand-burgundy/70">
            We'll let you know once your ID has been reviewed.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex-1 rounded-lg border border-dashed border-brand-burgundy/30 bg-white/40 p-8 text-center text-sm text-brand-burgundy/60">
            {/* TODO: real capture UI (camera / file input) wired to Storage upload */}
            Upload a photo of your government-issued ID.
          </div>
          <Button
            type="button"
            className="bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90"
            onClick={() => setSubmitted(true)}
          >
            Submit for review
          </Button>
        </div>
      )}
    </main>
  );
}
