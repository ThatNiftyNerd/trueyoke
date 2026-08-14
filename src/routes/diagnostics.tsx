import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckRow } from "@/features/diagnostics/CheckRow";
import { isCurrentUserAdmin } from "@/features/profile/api";
import { getBuildInfo, runDiagnostics } from "@/features/diagnostics/api";
import { copyText } from "@/features/diagnostics/clipboard";
import { buildReport, overallStatus, type DiagnosticCheck } from "@/features/diagnostics/logic";

export const Route = createFileRoute("/diagnostics")({
  head: () => ({
    meta: [
      { title: "Connection diagnostics — TrueYoke" },
      { name: "description", content: "Check that TrueYoke can reach its backend services." },
      { property: "og:title", content: "Connection diagnostics — TrueYoke" },
      {
        property: "og:description",
        content: "Check that TrueYoke can reach its backend services.",
      },
    ],
  }),
  // UI-level guard. RLS on the underlying tables remains the real data boundary.
  beforeLoad: async () => {
    const admin = await isCurrentUserAdmin();
    if (!admin) throw redirect({ to: "/app/profile" });
  },
  component: DiagnosticsScreen,
});

const PENDING: DiagnosticCheck[] = [
  { id: "env-url", label: "Backend URL configured", status: "pending", detail: "Checking…" },
  { id: "env-key", label: "Publishable key configured", status: "pending", detail: "Checking…" },
  { id: "auth-reachable", label: "Auth service reachable", status: "pending", detail: "Checking…" },
  {
    id: "runtime-target",
    label: "Runtime request target",
    status: "pending",
    detail: "Checking…",
  },
  { id: "data-api", label: "Database API responding", status: "pending", detail: "Checking…" },

  { id: "session", label: "Signed-in session", status: "pending", detail: "Checking…" },
];

function DiagnosticsScreen() {
  const [checks, setChecks] = useState<DiagnosticCheck[]>(PENDING);
  const [running, setRunning] = useState(false);
  const [ranAt, setRanAt] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const build = getBuildInfo();

  const run = useCallback(async () => {
    setRunning(true);
    setChecks(PENDING);
    const results = await runDiagnostics();
    setChecks(results);
    setRanAt(new Date().toLocaleTimeString());
    setRunning(false);
  }, []);

  const copyReport = useCallback(async () => {
    const report = buildReport(checks, {
      mode: build.mode,
      dev: build.dev,
      ranAt,
      userAgent: navigator.userAgent,
    });
    const ok = await copyText(report);
    setCopyState(ok ? "copied" : "error");
    window.setTimeout(() => setCopyState("idle"), 2500);
  }, [checks, build.mode, build.dev, ranAt]);

  useEffect(() => {
    void run();
  }, [run]);

  const status = overallStatus(checks);

  return (
    <main className="min-h-[100dvh] bg-app-canvas">
      <section className="mx-auto flex max-w-md flex-col px-4 pb-16 pt-6">
        <header className="mb-5">
          <h1 className="font-serif text-2xl text-app-ink">Connection diagnostics</h1>
          <p className="mt-1 text-sm text-app-ink/70">
            Confirms this build has its backend settings and can reach the service.
          </p>
        </header>

        <div
          className={`mb-4 rounded-md border px-4 py-3 text-sm font-medium ${
            status === "pass"
              ? "border-app-accent bg-app-accent/15 text-app-ink"
              : status === "fail"
                ? "border-app-warn bg-app-warn/15 text-app-ink"
                : "border-app-ink/20 bg-card/60 text-app-ink/70"
          }`}
          role="status"
          aria-live="polite"
        >
          {status === "pass"
            ? "All checks passed — the app is connected."
            : status === "fail"
              ? "One or more checks failed. See details below."
              : "Running checks…"}
        </div>

        <ul className="space-y-2">
          {checks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </ul>

        <div className="mt-5 space-y-2">
          <Button
            onClick={() => void run()}
            disabled={running}
            className="w-full bg-app-primary text-app-on-primary hover:bg-app-primary/90"
          >
            {running ? "Running…" : "Run checks again"}
          </Button>
          <Button
            variant="outline"
            onClick={() => void copyReport()}
            disabled={running}
            className="w-full border-app-ink/30 bg-transparent text-app-ink"
          >
            {copyState === "copied"
              ? "Copied to clipboard"
              : copyState === "error"
                ? "Copy failed — select the text manually"
                : "Copy report"}
          </Button>
          <p className="sr-only" role="status" aria-live="polite">
            {copyState === "copied" ? "Diagnostics report copied to clipboard." : ""}
          </p>

          <p className="text-center text-xs text-app-ink/60">
            Build mode: {build.mode}
            {ranAt ? ` · Last run ${ranAt}` : ""}
          </p>
        </div>
      </section>
    </main>
  );
}
