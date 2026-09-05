import { useEffect } from "react";
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
  // This is a public marketing page, so it should never open in dark mode
  // just because a first-time visitor's OS is set to dark — that reads as
  // broken/unfinished rather than intentional. Scope the override to this
  // route's mount lifetime only: strip `.dark` from <html> while mounted,
  // then restore whatever it was on unmount, so the app's own light/dark
  // toggle (and the localStorage value it persists) is untouched for every
  // other screen.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (hadDark) root.classList.add("dark");
    };
  }, []);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center bg-app-canvas">
      {/* Hero */}
      <div className="relative flex w-full flex-col items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=70"
          alt=""
          aria-hidden="true"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-app-canvas/60 via-app-canvas/85 to-app-canvas" />
        <div className="relative flex w-full flex-col items-center gap-8 px-6 py-16 text-center sm:py-24 lg:py-28">
          <div className="max-w-sm space-y-3 sm:max-w-md lg:max-w-xl">
            <p className="text-sm uppercase tracking-widest text-app-on-accent">
              The TrueYoke Project
            </p>
            <h1 className="text-4xl font-serif font-semibold text-app-ink sm:text-5xl lg:text-6xl">
              Do not be unequally yoked.
            </h1>
            <p className="text-app-ink/70 sm:text-lg">
              A marriage-minded space open to every Christian believer, for anyone ready to build a
              wholesome relationship with another God-fearing individual.
            </p>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-3 sm:max-w-md sm:flex-row sm:justify-center">
            <Link
              to="/choose-type"
              className="rounded-md bg-app-primary px-6 py-3 text-center text-app-on-primary font-medium sm:flex-1"
            >
              Get started
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="flex items-center justify-center text-sm text-app-ink underline sm:flex-1"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>

      {/* Scripture opening */}
      <div className="w-full bg-app-surface px-6 py-14">
        <div className="mx-auto max-w-xl text-center">
          <p className="font-serif text-lg italic text-app-ink sm:text-xl">
            "Do not be unequally yoked with unbelievers. For what partnership has righteousness with
            lawlessness? Or what fellowship has light with darkness?"
          </p>
          <p className="mt-3 text-xs uppercase tracking-widest text-app-ink/50">
            2 Corinthians 6:14
          </p>
        </div>
      </div>

      <WhoThisIsFor />
      <div className="w-full bg-app-accent/15">
        <WhatWeBelieve />
      </div>
      <TwoWaysToJoin />
      <div className="w-full bg-app-accent/15">
        <TrustAndSafety />
      </div>
      <div className="w-full bg-app-accent/10">
        <GetTheApp apkUrl={APK_DOWNLOAD_URL} />
      </div>

      {/* Closing CTAs, mirrored from the hero so a scrolled-down reader doesn't have to scroll back up */}
      <div className="flex w-full flex-col items-center gap-3 px-6 pb-10 pt-4">
        <div className="flex w-full max-w-sm flex-col gap-3 sm:max-w-md sm:flex-row">
          <Link
            to="/choose-type"
            className="rounded-md bg-app-primary px-6 py-3 text-center text-app-on-primary font-medium sm:flex-1"
          >
            Get started
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="flex items-center justify-center text-center text-sm text-app-ink underline sm:flex-1"
          >
            I already have an account
          </Link>
        </div>
        <CopyrightNotice className="mt-4" />
      </div>
    </main>
  );
}
