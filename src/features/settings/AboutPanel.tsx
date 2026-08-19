import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Link } from "@tanstack/react-router";
import { CopyrightNotice } from "@/components/app/CopyrightNotice";

/**
 * Reads the running app's version/build the same way UpdateBanner does —
 * native-only, since a web session has no installed build to report.
 * See src/features/updates/UpdateBanner.tsx for the paired implementation;
 * keep both in sync if the Capacitor App plugin's info shape ever changes.
 */
async function readRunningVersionLabel(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const info = await App.getInfo();
    return `${info.version} (build ${info.build})`;
  } catch {
    return null;
  }
}

/**
 * Self-contained — drop anywhere (currently mounted inside SettingsSheet).
 * App developer details and legal links, per NDPA/App-store expectations
 * for a clearly identified data controller.
 */
export function AboutPanel() {
  const [versionLabel, setVersionLabel] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    readRunningVersionLabel().then((v) => alive && setVersionLabel(v));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold text-card-foreground">About</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        TrueYoke is a product of House603 Digital Solutions.
      </p>
      {versionLabel ? (
        <p className="mt-2 text-xs text-muted-foreground">Version {versionLabel}</p>
      ) : null}
      <Link
        to="/privacy"
        className="mt-2 inline-block text-sm font-medium text-app-primary underline underline-offset-2"
      >
        Privacy Policy
      </Link>
      <CopyrightNotice className="mt-3" />
    </section>
  );
}
