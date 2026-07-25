import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  submitLabel?: string;
  submitting?: boolean;
  disableSubmit?: boolean;
  submitType?: "submit" | "button";
  onSubmitClick?: () => void;
  onBack: () => void;
  canGoBack: boolean;
  error?: string | null;
}

/**
 * Shared footer + error strip for every wizard step. Steps compose this
 * inside their own <form> so the submit stays wired to react-hook-form.
 */
export function StepShell({
  children,
  submitLabel = "Continue",
  submitting = false,
  disableSubmit = false,
  submitType = "submit",
  onSubmitClick,
  onBack,
  canGoBack,
  error,
}: Props) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-4 rounded-lg border border-brand-burgundy/10 bg-white/50 p-4">
        {children}
      </div>
      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-brand-terracotta/40 bg-brand-terracotta/10 px-3 py-2 text-sm text-brand-terracotta"
        >
          {error}
        </p>
      ) : null}
      <footer className="mt-6 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-brand-burgundy/30 text-brand-burgundy"
          disabled={!canGoBack || submitting}
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type={submitType}
          onClick={onSubmitClick}
          disabled={submitting || disableSubmit}
          className="bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90"
        >
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </footer>
    </div>
  );
}
