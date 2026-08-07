/**
 * UPDATE-AWARENESS ONLY.
 *
 * This banner fetches signed release METADATA and renders a link. It does NOT
 * download, install, evaluate, or swap in any application code, and it must
 * never be "improved" into a live updater: executing code that was not part of
 * the signed, reviewed APK is a remote-code-execution surface through
 * Capacitor's native bridge and breaks build-signing integrity. No `eval`, no
 * `new Function`, no dynamic `import()` of remote content — ever.
 */
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { X } from "lucide-react";
import { getLatestRelease } from "./api";
import { isNewer, verifySignature, type BundleRelease, type RunningVersion } from "./logic";
import { RELEASE_DOWNLOAD_URL, RELEASE_SIGNING_PUBLIC_KEY_PEM } from "./keys";

async function readRunningVersion(): Promise<RunningVersion | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const info = await App.getInfo();
  const code = Number.parseInt(info.build, 10);
  if (!Number.isFinite(code)) return null;
  return { version_code: code, version_name: info.version };
}

export function UpdateBanner() {
  const [release, setRelease] = useState<BundleRelease | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const current = await readRunningVersion();
        if (!current) return;

        const latest = await getLatestRelease("android");
        if (!latest || !isNewer(current, latest)) return;

        const trusted = await verifySignature(latest, RELEASE_SIGNING_PUBLIC_KEY_PEM);
        if (!trusted) {
          console.warn("[updates] Release manifest signature failed verification; ignoring.");
          return;
        }
        if (!cancelled) setRelease(latest);
      } catch (err) {
        console.warn("[updates] Could not check for a newer release.", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!release || dismissed) return null;

  return (
    <div
      role="status"
      className="app-glass mx-auto mb-2 flex max-w-md items-center gap-3 rounded-xl px-3 py-2 text-sm text-app-ink"
    >
      <span className="flex-1">
        A newer version is available{" "}
        <span className="text-app-muted">(v{release.version_name})</span>
      </span>
      <a
        href={RELEASE_DOWNLOAD_URL}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-app-primary underline underline-offset-2"
      >
        Get it
      </a>
      <button
        type="button"
        aria-label="Dismiss update notice"
        onClick={() => setDismissed(true)}
        className="rounded-full p-1 text-app-muted hover:bg-app-primary/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
