/**
 * Safety modal shells — Report and Block confirmation dialogs.
 *
 * Presentational only. All actions are TODOs wired to `safety/api.ts` later.
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedName?: string;
}

export function ReportModal({ open, onOpenChange, reportedName }: ReportModalProps) {
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
        {/* TODO: reason picker + optional details textarea */}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90"
            onClick={() => {
              // TODO: call safety/api.ts reportProfile
              onOpenChange(false);
            }}
          >
            Submit report
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
}

export function BlockModal({ open, onOpenChange, blockedName }: BlockModalProps) {
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90"
            onClick={() => {
              // TODO: call safety/api.ts blockProfile
              onOpenChange(false);
            }}
          >
            Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
