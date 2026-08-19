import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { DisplaySettingsPanel } from "@/components/app/DisplaySettingsPanel";
import { MarketingPreferenceToggle } from "@/features/marketing/MarketingPreferenceToggle";
import { BugReportDrawer } from "@/features/bug-report/BugReportDrawer";
import { AboutPanel } from "@/features/settings/AboutPanel";
import { copyText } from "@/features/diagnostics/clipboard";
import { exportOwnData } from "@/features/profile/api";
import { deleteOwnAccount, signOut } from "@/features/auth/api";

/**
 * Account-level settings, reached via the hamburger icon on the Profile
 * screen header. Self-contained — owns its own export/sign-out/delete-account
 * state, matching the "drop in, no props" pattern already used by
 * DisplaySettingsPanel / MarketingPreferenceToggle / BugReportDrawer, all of
 * which are rendered as children here rather than duplicated.
 */
export function SettingsSheet() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open settings"
          className="rounded-full p-2 text-app-ink hover:bg-app-ink/5"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="text-app-ink">Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          <DisplaySettingsPanel />
          <MarketingPreferenceToggle />

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="block w-full rounded-md border border-app-ink/20 px-4 py-3 text-center text-sm font-medium text-app-ink"
          >
            {exporting ? "Preparing…" : "Download my data"}
          </button>

          <BugReportDrawer
            trigger={
              <Button variant="outline" className="w-full">
                Report a bug
              </Button>
            }
          />

          <AboutPanel />

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
      </SheetContent>

      <Dialog open={exportJson !== null} onOpenChange={(next) => !next && setExportJson(null)}>
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
    </Sheet>
  );
}
