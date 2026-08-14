import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DisplaySettingsPanel } from "@/components/app/DisplaySettingsPanel";
import { MarketingPreferenceToggle } from "@/features/marketing/MarketingPreferenceToggle";
import { BugReportDrawer } from "@/features/bug-report/BugReportDrawer";

import { CopyrightNotice } from "@/components/app/CopyrightNotice";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { copyText } from "@/features/diagnostics/clipboard";
import {
  exportOwnData,
  getOwnProfile,
  getPhotoSignedUrl,
  isCurrentUserAdmin,
  listOwnPhotos,
} from "@/features/profile/api";
import type { OwnProfile } from "@/features/profile/api";
import { MentorSelect } from "@/features/vouchers/MentorSelect";
import { SelfieCapture } from "@/features/profile/SelfieCapture";
import { deleteOwnAccount, getCurrentSession, signOut } from "@/features/auth/api";

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
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    return () => {
      alive = false;
    };
  }, []);

  async function handleSignOut() {
    setError(null);
    setSigningOut(true);
    try {
      await signOut();
      navigate({ to: "/auth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign out. Please try again.");
      setSigningOut(false);
    }
  }

  async function handleExport() {
    setError(null);
    setExporting(true);
    setCopied(false);
    try {
      setExportJson(await exportOwnData());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare your data export.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      await deleteOwnAccount();
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete your account.");
      setDeleting(false);
    }
  }

  return (
    <section className="flex flex-col px-4 pt-6">
      <header className="mb-6 text-center">
        <div className="mx-auto h-24 w-24 rounded-full bg-app-accent/20" aria-hidden="true" />
        <h1 className="mt-3 font-serif text-2xl text-app-ink">Your profile</h1>
        {/* TODO: display church-verified sage badge when profile.church_verified */}
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
        <Link
          to="/app/blocked"
          className="block rounded-md border border-app-ink/20 px-4 py-3 text-center text-sm font-medium text-app-ink"
        >
          Manage blocked users
        </Link>
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
            ID review
          </Link>
        ) : null}
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="block w-full rounded-md border border-app-ink/20 px-4 py-3 text-center text-sm font-medium text-app-ink"
        >
          {exporting ? "Preparing…" : "Download my data"}
        </button>
        <Link
          to="/diagnostics"
          className="block rounded-md border border-app-ink/20 px-4 py-3 text-center text-sm font-medium text-app-ink"
        >
          Connection diagnostics
        </Link>
        <MarketingPreferenceToggle />
        <DisplaySettingsPanel />
        <BugReportDrawer />

        {error ? (
          <p
            role="alert"
            className="rounded-md border border-app-warn/40 bg-app-warn/10 px-3 py-2 text-sm text-app-warn"
          >
            {error}
          </p>
        ) : null}
        <Button
          variant="outline"
          disabled={signingOut}
          onClick={handleSignOut}
          className="w-full border-app-ink/30 text-app-ink"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={deleting}
              className="w-full border-app-warn/50 text-app-warn hover:bg-app-warn/10 hover:text-app-warn"
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes your profile, photos, matches, and messages. This
                can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-app-warn text-app-on-primary hover:bg-app-warn/90"
                onClick={handleDelete}
              >
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Dialog open={exportJson !== null} onOpenChange={(open) => !open && setExportJson(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Your data</DialogTitle>
          </DialogHeader>
          <pre className="max-h-[50vh] overflow-auto rounded-md bg-app-ink/5 p-3 text-left text-xs text-app-ink">
            {exportJson}
          </pre>
          <Button
            className="bg-app-primary text-app-on-primary hover:bg-app-primary/90"
            onClick={async () => setCopied(await copyText(exportJson ?? ""))}
          >
            {copied ? "Copied" : "Copy to clipboard"}
          </Button>
        </DialogContent>
      </Dialog>

      <p className="mt-8 text-center text-xs text-app-ink/60">
        TrueYoke is a product of House603 Digital Solutions.
      </p>

      <CopyrightNotice className="mt-2 pb-4" />
    </section>
  );
}
