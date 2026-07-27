import { type DiagnosticCheck } from "./logic";

const STATUS_STYLES: Record<DiagnosticCheck["status"], string> = {
  pass: "bg-brand-sage/20 text-brand-burgundy border-brand-sage",
  fail: "bg-brand-terracotta/15 text-brand-burgundy border-brand-terracotta",
  pending: "bg-brand-burgundy/5 text-brand-burgundy/60 border-brand-burgundy/20",
};

const STATUS_LABEL: Record<DiagnosticCheck["status"], string> = {
  pass: "OK",
  fail: "Failed",
  pending: "Checking",
};

export function CheckRow({ check }: { check: DiagnosticCheck }) {
  return (
    <li className="rounded-md border border-brand-burgundy/15 bg-card/60 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-brand-burgundy">{check.label}</span>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[check.status]}`}
        >
          {STATUS_LABEL[check.status]}
        </span>
      </div>
      <p className="mt-1 break-words font-mono text-xs text-brand-burgundy/70">{check.detail}</p>
    </li>
  );
}
