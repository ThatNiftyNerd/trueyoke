import { type DiagnosticCheck } from "./logic";

const STATUS_STYLES: Record<DiagnosticCheck["status"], string> = {
  pass: "bg-app-accent/20 text-app-ink border-app-accent",
  fail: "bg-app-warn/15 text-app-ink border-app-warn",
  pending: "bg-app-primary/5 text-app-ink/60 border-app-ink/20",
};

const STATUS_LABEL: Record<DiagnosticCheck["status"], string> = {
  pass: "OK",
  fail: "Failed",
  pending: "Checking",
};

export function CheckRow({ check }: { check: DiagnosticCheck }) {
  return (
    <li className="rounded-md border border-app-ink/15 bg-card/60 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-app-ink">{check.label}</span>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[check.status]}`}
        >
          {STATUS_LABEL[check.status]}
        </span>
      </div>
      <p className="mt-1 break-words font-mono text-xs text-app-ink/70">{check.detail}</p>
    </li>
  );
}
