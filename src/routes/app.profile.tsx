import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getOwnProfile,
  getPhotoSignedUrl,
  isCurrentUserAdmin,
  listOwnPhotos,
} from "@/features/profile/api";
import type { OwnProfile } from "@/features/profile/api";
import { MentorSelect } from "@/features/vouchers/MentorSelect";
import { SelfieCapture } from "@/features/profile/SelfieCapture";
import { getCurrentSession } from "@/features/auth/api";
import { SettingsSheet } from "@/features/settings/SettingsSheet";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — TrueYoke" },
      { name: "description", content: "View and edit your TrueYoke profile." },
      { property: "og:title", content: "Your profile — TrueYoke" },
      { property: "og:description", content: "View and edit your TrueYoke profile." },
    ],
  }),
  component: ProfileScreen,
});

function ProfileScreen() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    isCurrentUserAdmin()
      .then((v) => alive && setIsAdmin(v))
      .catch(() => undefined);
    getOwnProfile()
      .then((p) => alive && setProfile(p))
      .catch(() => undefined);
    getCurrentSession()
      .then((s) => alive && setEmail(s?.user.email ?? null))
      .catch(() => undefined);
    (async () => {
      try {
        const photos = await listOwnPhotos();
        const first = photos[0];
        if (!first) return;
        const url = await getPhotoSignedUrl(first.storage_path);
        if (alive && url) setAvatarUrl(url);
      } catch {
        // Avatar is decorative-optional; fall back to the placeholder circle.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="flex flex-col px-4">
      <header className="mb-6 text-center">
        <div className="flex items-center justify-end">
          <SettingsSheet />
        </div>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Your profile photo"
            className="mx-auto h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="mx-auto h-24 w-24 rounded-full bg-app-accent/20" aria-hidden="true" />
        )}
        <h1 className="mt-3 font-serif text-2xl text-app-ink">Your profile</h1>
        {profile?.church_verified ? (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-app-accent/15 px-2.5 py-1 text-xs font-medium text-app-on-accent">
            Church Verified
          </span>
        ) : null}
        {email ? <p className="mt-1 text-sm text-app-ink/70">{email}</p> : null}
        <p className="mt-1 text-sm text-app-ink/60">Not yet complete</p>
      </header>

      <div className="space-y-3">
        <Link
          to="/app/edit-profile"
          className="flex w-full items-center justify-center rounded-md bg-app-primary px-4 py-3 text-center text-sm font-medium text-app-on-primary hover:bg-app-primary/90"
        >
          Edit profile
        </Link>

        <Link
          to="/verify-id"
          className="block rounded-md border border-app-accent bg-app-accent/10 px-4 py-3 text-center text-sm font-medium text-app-ink"
        >
          Verify your ID
        </Link>
        {!profile?.church_verified ? (
          <Link
            to="/verify-church"
            className="block rounded-md border border-app-accent bg-app-accent/10 px-4 py-3 text-center text-sm font-medium text-app-ink"
          >
            Verify your church affiliation
          </Link>
        ) : null}
        {profile?.account_type === "match" && profile.profile_complete === true ? (
          <SelfieCapture />
        ) : null}
        {profile?.account_type === "match" && profile.profile_complete === true ? (
          <MentorSelect />
        ) : null}

        {isAdmin ? (
          <Link
            to="/app/admin-review"
            className="block rounded-md border border-app-ink/20 px-4 py-3 text-center text-sm font-medium text-app-ink"
          >
            Verification review
          </Link>
        ) : null}
        {isAdmin ? (
          <Link
            to="/diagnostics"
            className="block rounded-md border border-app-ink/20 px-4 py-3 text-center text-sm font-medium text-app-ink"
          >
            Connection diagnostics
          </Link>
        ) : null}
      </div>
    </section>
  );
}
