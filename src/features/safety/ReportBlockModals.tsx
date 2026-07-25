/**
 * Report and Block confirmation dialogs.
 *
 * Presentational + local form state only; the actual writes go through
 * `safety/api.ts` via the callbacks provided by the caller.
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_DETAILS_MAX, REPORT_REASONS, type ReportReason } from "./logic";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedName?: string;
  onSubmit: (category: ReportReason, details: string) => Promise<void>;
}

export function ReportModal({ open, onOpenChange, reportedName, onSubmit }: ReportModalProps) {
  const [category, setCategory] = useState<ReportReason>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(category, details);
      setDetails("");
      setCategory(REPORT_REASONS[0]);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-brand-burgundy">Report profile</DialogTitle>
          <DialogDescription>
            Tell us what's wrong with {reportedName ?? "this profile"}. Our team reviews every
            report.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={category}
          onValueChange={(v) => setCategory(v as ReportReason)}
          className="space-y-2"
        >
          {REPORT_REASONS.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <RadioGroupItem id={`report-${r}`} value={r} />
              <Label htmlFor={`report-${r}`} className="text-sm text-brand-burgundy">
                {r}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, REPORT_DETAILS_MAX))}
          maxLength={REPORT_DETAILS_MAX}
          placeholder="Add a short note (optional)"
          className="min-h-[80px]"
        />
        {error ? <p className="text-xs text-brand-terracotta">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            className="bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90"
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy ? "Submitting…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockedName?: string;
  onConfirm: () => Promise<void>;
}

export function BlockModal({ open, onOpenChange, blockedName, onConfirm }: BlockModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not block.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-brand-burgundy">Block profile</DialogTitle>
          <DialogDescription>
            You won't see {blockedName ?? "this person"} again, and they won't see you. This can't
            be undone here.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-xs text-brand-terracotta">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            className="bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90"
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? "Blocking…" : "Block"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
