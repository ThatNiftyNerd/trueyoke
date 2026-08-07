/**
 * Bug report data access. The client only ever talks to our own Edge Function —
 * no third-party issue-tracker SDK or endpoint is reachable from the browser.
 */
import { supabase } from "@/lib/supabase";
import type { ReportDraft } from "@/features/bug-report/logic";

export async function submitBugReport({
  title,
  description,
  severity,
}: ReportDraft): Promise<void> {
  const { error } = await supabase.functions.invoke("submit-bug-report", {
    body: {
      title: title.trim(),
      description: description.trim(),
      severity,
    },
  });
  if (error) throw new Error("We couldn't send your report. Please try again.");
}
