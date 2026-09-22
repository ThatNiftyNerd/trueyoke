import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/features/auth/guards";
import {
  getChurchVerification,
  getOwnProfile,
  submitChurchVerification,
} from "@/features/profile/api";
import type { Database } from "@/integrations/supabase/types";

type ChurchStatus = Database["public"]["Enums"]["church_verification_status"] | "none";

export const Route = createFileRoute("/verify-church")({
  head: () => ({
    meta: [
      { title: "Verify your church — TrueYoke" },
      {
        name: "description",
        content: "Verify your church affiliation for the Church Verified badge.",
      },
      { property: "og:title", content: "Verify your church — TrueYoke" },
      {
        property: "og:description",
        content: "Verify your church affiliation for the Church Verified badge.",
      },
    ],
  }),
  // Church verification is a Mentor-only function: a Mentor's endorsement of
  // a Match already covers verification, on top of what a Match submits at
  // signup, so a Match account has no reason to be on this screen. Grandfathered:
  // this only blocks a Match from starting a *new* submission going forward — an
  // existing verified/pending row for a Match account, if one somehow exists, is
  // left untouched (see the matching RLS tightening in the church_verifications
  // migration, which is the real enforcement boundary; this is defense-in-depth).
  beforeLoad: async () => {
    await requireAuth();
    const profile = await getOwnProfile().catch(() => null);
    if (profile?.account_type === "match") throw redirect({ to: "/app/profile" });
  },
  component: VerifyChurchScreen,
});

function VerifyChurchScreen() {
  const [status, setStatus] = useState<ChurchStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    getChurchVerification()
      .then((info) => {
        if (!alive) return;
        setStatus(info?.status ?? "none");
        setRejectionReason(info?.rejection_reason ?? null);
      })
      .catch(() => alive && setStatus("none"));
    return () => {
      alive = false;
    };
  }, []);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      await submitChurchVerification(file);
      setStatus("pending");
      setRejectionReason(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-app-canvas px-6 py-8">
      <header className="mb-6">
        <Link to="/app/profile" className="text-sm text-app-ink underline">
          ← Back to profile
        </Link>
        <h1 className="mt-4 font-serif text-2xl text-app-ink">Verify your church</h1>
        <p className="mt-1 text-sm text-app-ink/70">
          A quick check confirms your church affiliation is real.
        </p>
      </header>

      {status === null ? (
        <p className="text-sm text-app-ink/60">Yoking…</p>
      ) : status === "verified" ? (
        <div className="rounded-lg border border-app-accent bg-app-accent/10 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-app-on-accent" aria-hidden />
          <p className="mt-2 font-serif text-lg text-app-ink">
            Your church affiliation has been verified.
          </p>
        </div>
      ) : status === "pending" ? (
        <div className="rounded-lg border border-app-accent bg-app-accent/10 p-6 text-center">
          <p className="font-serif text-lg text-app-ink">Pending review</p>
          <p className="mt-2 text-sm text-app-ink/70">
            We'll let you know once this has been reviewed.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          {status === "rejected" ? (
            <p className="rounded-md border border-app-warn/40 bg-app-warn/10 p-3 text-sm text-app-warn">
              {rejectionReason ??
                "Your previous submission wasn't approved. Please try again with clearer evidence."}
            </p>
          ) : null}

          <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-app-ink/30 bg-card/40 p-8 text-center text-sm text-app-ink/60">
            Tap to upload evidence of your church membership — a membership card, a letter from your
            congregation, or a screenshot of a church directory listing (JPG, PNG, or WebP; max 8
            MB).
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </label>

          {error ? (
            <p role="alert" className="text-sm text-app-warn">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            className="bg-app-primary text-app-on-primary hover:bg-app-primary/90"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Choose file"}
          </Button>
        </div>
      )}
    </main>
  );
}
