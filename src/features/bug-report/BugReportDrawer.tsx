import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitBugReport } from "@/features/bug-report/api";
import { SEVERITIES, SEVERITY_LABELS, validateReport } from "@/features/bug-report/logic";

/** Tester-facing bug report form. Submits to our own Edge Function only. */
export function BugReportDrawer({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<string>("medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const result = validateReport({ title, description, severity });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitBugReport({ title, description, severity });
      setTitle("");
      setDescription("");
      setSeverity("medium");
      setOpen(false);
      toast.success("Thanks — your report was sent to the team.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="w-full">
            Report a bug
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-app-ink">Report a bug</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-2">
          <div className="space-y-1.5">
            <Label htmlFor="bug-title" className="text-app-ink">
              Title
            </Label>
            <Input
              id="bug-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary"
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bug-description" className="text-app-ink">
              What happened?
            </Label>
            <Textarea
              id="bug-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps to reproduce, what you expected, what you saw."
              rows={5}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bug-severity" className="text-app-ink">
              Severity
            </Label>
            <Select value={severity} onValueChange={setSeverity} disabled={submitting}>
              <SelectTrigger id="bug-severity">
                <SelectValue placeholder="Choose severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SEVERITY_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Sending…" : "Send report"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
