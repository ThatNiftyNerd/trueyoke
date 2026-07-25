import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/features/auth/api";
import { getIdVerification, submitIdVerification } from "@/features/profile/api";
import type { Database } from "@/integrations/supabase/types";

type IdStatus = Database["public"]["Enums"]["id_status"];

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
  const [status, setStatus] = useState<IdStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    getIdVerification()
      .then((info) => {
        if (!alive) return;
        setStatus(info?.id_verification_status ?? "none");
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
      await submitIdVerification(file);
      setStatus("pending");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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

      {status === null ? (
        <p className="text-sm text-brand-burgundy/60">Loading…</p>
      ) : status === "verified" ? (
        <div className="rounded-lg border border-brand-sage bg-brand-sage/10 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-brand-sage" aria-hidden />
          <p className="mt-2 font-serif text-lg text-brand-burgundy">Your ID has been verified.</p>
        </div>
      ) : status === "pending" ? (
        <div className="rounded-lg border border-brand-sage bg-brand-sage/10 p-6 text-center">
          <p className="font-serif text-lg text-brand-burgundy">Pending review</p>
          <p className="mt-2 text-sm text-brand-burgundy/70">
            We'll let you know once your ID has been reviewed.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          {status === "rejected" ? (
            <p className="rounded-md border border-brand-terracotta/40 bg-brand-terracotta/10 p-3 text-sm text-brand-terracotta">
              Your previous submission wasn't approved. Please try again with a clearer photo.
            </p>
          ) : null}

          <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-brand-burgundy/30 bg-white/40 p-8 text-center text-sm text-brand-burgundy/60">
            Tap to upload a photo of your government-issued ID (JPG, PNG, or WebP; max 8 MB).
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
            <p role="alert" className="text-sm text-brand-terracotta">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            className="bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90"
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
