import { createFileRoute, Link } from "@tanstack/react-router";
import { redirectIfSignedIn } from "@/features/auth/guards";
import { CopyrightNotice } from "@/components/app/CopyrightNotice";
import {
  WhoThisIsFor,
  WhatWeBelieve,
  TwoWaysToJoin,
  TrustAndSafety,
  GetTheApp,
} from "@/components/marketing/LandingSections";
import { SUPABASE_URL } from "@/lib/supabase-env";

const APK_DOWNLOAD_URL = `${SUPABASE_URL}/functions/v1/download-apk`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrueYoke — Faith-centered relationships" },
      {
        name: "description",
        content:
          "TrueYoke helps Christian singles from any tradition pursue marriage-minded relationships with accountability — verified profiles, church vouching, and intentional matching.",
      },
      { property: "og:title", content: "TrueYoke — Faith-centered relationships" },
      {
        property: "og:description",
        content:
          "TrueYoke helps Christian singles from any tradition pursue marriage-minded relationships with accountability — verified profiles, church vouching, and intentional matching.",
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
    <main className="flex min-h-[100dvh] flex-col items-center bg-app-canvas">
      {/* Hero */}
      <div className="flex w-full flex-col items-center gap-8 px-6 py-16 text-center">
        <div className="max-w-sm space-y-3">
          <p className="text-sm uppercase tracking-widest text-app-on-accent">
            The TrueYoke Project
          </p>
          <h1 className="text-4xl font-serif font-semibold text-app-ink">
            Do not be unequally yoked.
          </h1>
          <p className="text-app-ink/70">
            A marriage-minded space open to every Christian believer, for anyone ready to build a
            wholesome relationship with another God-fearing individual.
          </p>
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
      </div>

      {/* Scripture opening */}
      <div className="w-full bg-app-surface px-6 py-14">
        <div className="mx-auto max-w-xl text-center">
          <p className="font-serif text-lg italic text-app-ink">
            "Do not be unequally yoked with unbelievers. For what partnership has righteousness with
            lawlessness? Or what fellowship has light with darkness?"
          </p>
          <p className="mt-3 text-xs uppercase tracking-widest text-app-ink/50">
            2 Corinthians 6:14
          </p>
        </div>
      </div>

      <WhoThisIsFor />
      <div className="w-full bg-app-surface">
        <WhatWeBelieve />
      </div>
      <TwoWaysToJoin />
      <div className="w-full bg-app-surface">
        <TrustAndSafety />
      </div>
      <GetTheApp apkUrl={APK_DOWNLOAD_URL} />

      {/* Closing CTAs, mirrored from the hero so a scrolled-down reader doesn't have to scroll back up */}
      <div className="flex w-full flex-col items-center gap-3 px-6 pb-10 pt-4">
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Link
            to="/choose-type"
            className="rounded-md bg-app-primary px-6 py-3 text-center text-app-on-primary font-medium"
          >
            Get started
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="text-center text-sm text-app-ink underline"
          >
            I already have an account
          </Link>
        </div>
        <CopyrightNotice className="mt-4" />
      </div>
    </main>
  );
}
