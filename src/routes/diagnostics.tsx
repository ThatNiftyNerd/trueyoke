import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckRow } from "@/features/diagnostics/CheckRow";
import { getBuildInfo, runDiagnostics } from "@/features/diagnostics/api";
import { overallStatus, type DiagnosticCheck } from "@/features/diagnostics/logic";

export const Route = createFileRoute("/diagnostics")({
  head: () => ({
    meta: [
      { title: "Connection diagnostics — Yoked" },
      { name: "description", content: "Check that Yoked can reach its backend services." },
      { property: "og:title", content: "Connection diagnostics — Yoked" },
      {
        property: "og:description",
        content: "Check that Yoked can reach its backend services.",
      },
    ],
  }),
  component: DiagnosticsScreen,
});

const PENDING: DiagnosticCheck[] = [
  { id: "env-url", label: "Backend URL configured", status: "pending", detail: "Checking…" },
  { id: "env-key", label: "Publishable key configured", status: "pending", detail: "Checking…" },
  { id: "auth-reachable", label: "Auth service reachable", status: "pending", detail: "Checking…" },
  { id: "data-api", label: "Database API responding", status: "pending", detail: "Checking…" },
  { id: "session", label: "Signed-in session", status: "pending", detail: "Checking…" },
];

function DiagnosticsScreen() {
  const [checks, setChecks] = useState<DiagnosticCheck[]>(PENDING);
  const [running, setRunning] = useState(false);
  const [ranAt, setRanAt] = useState<string | null>(null);
  const build = getBuildInfo();

  const run = useCallback(async () => {
    setRunning(true);
    setChecks(PENDING);
    const results = await runDiagnostics();
    setChecks(results);
    setRanAt(new Date().toLocaleTimeString());
    setRunning(false);
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  const status = overallStatus(checks);

  return (
    <section className="flex flex-col px-4 pt-6">
      <header className="mb-5">
        <h1 className="font-serif text-2xl text-brand-burgundy">Connection diagnostics</h1>
        <p className="mt-1 text-sm text-brand-burgundy/70">
          Confirms this build has its backend settings and can reach the service.
        </p>
      </header>

      <div
        className={`mb-4 rounded-md border px-4 py-3 text-sm font-medium ${
          status === "pass"
            ? "border-brand-sage bg-brand-sage/15 text-brand-burgundy"
            : status === "fail"
              ? "border-brand-terracotta bg-brand-terracotta/15 text-brand-burgundy"
              : "border-brand-burgundy/20 bg-white/60 text-brand-burgundy/70"
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
          className="w-full bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90"
        >
          {running ? "Running…" : "Run checks again"}
        </Button>
        <p className="text-center text-xs text-brand-burgundy/60">
          Build mode: {build.mode}
          {ranAt ? ` · Last run ${ranAt}` : ""}
        </p>
      </div>
    </section>
  );
}
