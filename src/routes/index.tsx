import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, MotionConfig } from "framer-motion";
import { redirectIfSignedIn } from "@/features/auth/guards";
import { CopyrightNotice } from "@/components/app/CopyrightNotice";
import { SocialLinks } from "@/components/marketing/SocialLinks";
import { BrandLockup } from "@/components/marketing/BrandLockup";
import { ThemeToggle } from "@/components/marketing/ThemeToggle";
import { useTheme } from "@/theme/ThemeProvider";
import { Reveal, RevealItem, riseItem, staggerContainer } from "@/components/marketing/motion";
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
      { title: "TrueYoke: Faith-centered relationships" },
      {
        name: "description",
        content:
          "TrueYoke helps Christian singles from any tradition pursue marriage-minded relationships with accountability: verified profiles, church vouching, and intentional matching.",
      },
      { property: "og:title", content: "TrueYoke: Faith-centered relationships" },
      {
        property: "og:description",
        content:
          "TrueYoke helps Christian singles from any tradition pursue marriage-minded relationships with accountability: verified profiles, church vouching, and intentional matching.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // Public welcome screen; signed-in users go straight to the app.
  beforeLoad: () => redirectIfSignedIn(),
  component: Landing,
});

// Mirrors ThemeProvider's own storage key — only read here to check whether
// a preference has ever been explicitly saved (by this page's toggle or the
// in-app one), without importing internals from that module.
const THEME_STORAGE_KEY = "trueyoke-theme";

// Scroll distance (px) after which the sticky header morphs into the
// existing `.app-glass` chrome treatment. Roughly "as soon as the hero
// image stops being the only thing behind it."
const HEADER_GLASS_THRESHOLD = 24;

function Landing() {
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  // This is a public marketing page, so a first-time visitor should never
  // land in dark mode just because their OS is set to dark — that reads as
  // broken/unfinished rather than intentional. If nothing has ever been
  // explicitly chosen (here or in the app), force light once on mount.
  // The header toggle lets a visitor switch afterward, and that's a real,
  // deliberate choice — it persists through the same ThemeProvider/
  // localStorage key the in-app toggle uses, so it carries over after
  // signup instead of jarringly resetting to light.
  useEffect(() => {
    const hasStoredPreference = localStorage.getItem(THEME_STORAGE_KEY) !== null;
    if (!hasStoredPreference && theme === "dark") {
      setTheme("light");
    }
    // Intentionally mount-only: this is a one-time "no prior choice" check,
    // not a live sync with theme state (that would fight the toggle).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sticky header morphs to the app's existing glass treatment once the
  // reader scrolls past roughly the top of the hero, instead of sitting on
  // a hard-edged bar the whole time.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > HEADER_GLASS_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <main className="flex min-h-[100dvh] flex-col items-center bg-app-canvas">
        {/* Header: brand lockup top-left, social links + theme toggle top-right.
            Sizes step up at sm: the lockup and icons run noticeably smaller on
            phones so the two clusters don't crowd each other on a narrow
            viewport. Sticky + glass-on-scroll so it stays legible over the
            hero photo without ever hard-cutting into it. */}
        <header
          className={`sticky top-0 z-40 flex w-full items-center justify-between px-4 py-3 transition-[background-color,backdrop-filter,box-shadow] duration-300 sm:px-6 sm:py-4 ${
            scrolled ? "app-glass shadow-sm" : "bg-transparent"
          }`}
        >
          <BrandLockup />
          <div className="flex items-center gap-2 sm:gap-4">
            <SocialLinks gap="gap-2 sm:gap-4" iconClassName="h-4 w-4 sm:h-5 sm:w-5" />
            <ThemeToggle />
          </div>
        </header>

        {/* Hero */}
        <div className="relative flex w-full flex-col items-center overflow-hidden">
          <motion.img
            src="https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=1600&q=70"
            alt=""
            aria-hidden="true"
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-app-canvas/60 via-app-canvas/85 to-app-canvas" />
          <motion.div
            className="relative flex w-full flex-col items-center gap-8 px-6 py-16 text-center sm:py-24 lg:py-28"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <div className="max-w-sm space-y-3 sm:max-w-md lg:max-w-xl">
              <motion.p variants={riseItem} className="text-sm uppercase tracking-widest text-app-on-accent">
                The TrueYoke Project
              </motion.p>
              <motion.h1
                variants={riseItem}
                className="text-4xl font-serif font-semibold text-app-ink sm:text-5xl lg:text-6xl"
              >
                Do not be unequally yoked.
              </motion.h1>
              <motion.p variants={riseItem} className="text-app-ink/70 sm:text-lg">
                A marriage-minded space open to every Christian believer, for anyone ready to build a
                wholesome relationship with another God-fearing individual.
              </motion.p>
            </div>
            <motion.div
              variants={riseItem}
              className="flex w-full max-w-sm flex-col gap-3 sm:max-w-md sm:flex-row sm:justify-center"
            >
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
            </motion.div>
            {/* Scroll cue: fades and bobs in once the hero's own stagger has
                had time to finish, so it never competes with it for attention. */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-app-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, 8, 0] }}
              transition={{
                opacity: { duration: 0.6, delay: 0.9 },
                y: { duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.9 },
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </motion.div>
          </motion.div>
        </div>

        {/* Scripture opening */}
        <Reveal as="section" className="w-full bg-app-surface px-6 py-14">
          <RevealItem className="mx-auto max-w-xl text-center">
            <p className="font-serif text-lg italic text-app-ink sm:text-xl">
              "Do not be unequally yoked with unbelievers. For what partnership has righteousness with
              lawlessness? Or what fellowship has light with darkness?"
            </p>
            <p className="mt-3 text-xs uppercase tracking-widest text-app-ink/50">
              2 Corinthians 6:14
            </p>
          </RevealItem>
        </Reveal>

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
          <SocialLinks className="mt-2" iconClassName="h-5 w-5" />
          <CopyrightNotice className="mt-2" />
        </div>
      </main>
    </MotionConfig>
  );
}
