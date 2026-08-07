import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getOwnMentorRequest,
  listOnboardedMentors,
  requestMentorVoucher,
  type MentorOption,
  type VoucherRow,
} from "@/features/vouchers/api";
import { VOUCHER_TEXT_MAX, canSubmitRequest, counterLabel } from "@/features/vouchers/logic";

function MentorAvatar({ mentor }: { mentor: MentorOption }) {
  const initial = (mentor.display_name ?? "?").trim().charAt(0).toUpperCase() || "?";
  return mentor.photoSignedUrl ? (
    <img
      src={mentor.photoSignedUrl}
      alt=""
      className="h-6 w-6 shrink-0 rounded-full object-cover"
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-accent/30 text-[11px] font-medium text-app-ink"
    >
      {initial}
    </span>
  );
}

/**
 * Lets a fully-onboarded "match" member request an endorsement from an
 * onboarded mentor. Only name, photo, and church affiliation are ever shown.
 */
export function MentorSelect() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [request, setRequest] = useState<VoucherRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mentorId, setMentorId] = useState<string>("");
  const [note, setNote] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const existing = await getOwnMentorRequest();
        if (!alive) return;
        setRequest(existing);
        if (!existing) {
          const list = await listOnboardedMentors();
          if (!alive) return;
          setMentors(list);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "Could not load mentors.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleSend() {
    setError(null);
    setSubmitting(true);
    try {
      await requestMentorVoucher(mentorId, note.trim());
      setRequest(await getOwnMentorRequest());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your request.");
    } finally {
      setSubmitting(false);
    }
  }

  const requestedMentor = request ? mentors.find((m) => m.id === request.mentor_id) : undefined;
  const canSend = mentorId !== "" && canSubmitRequest(note) && !submitting;

  return (
    <div className="rounded-md border border-app-ink/20 px-4 py-3 text-left">
      <h2 className="text-sm font-medium text-app-ink">Mentor endorsement</h2>

      {loading ? (
        <p className="mt-2 text-sm text-app-ink/60">Loading mentors…</p>
      ) : request ? (
        <p className="mt-2 text-sm text-app-ink/70">
          {request.status === "pending" ? "Request pending" : `Request ${request.status}`}
          {requestedMentor?.display_name ? ` with ${requestedMentor.display_name}` : ""}.
        </p>
      ) : mentors.length === 0 && !error ? (
        <p className="mt-2 text-sm text-app-ink/60">No mentors are available yet.</p>
      ) : mentors.length > 0 ? (
        <div className="mt-2 space-y-3">
          <Select disabled={submitting} value={mentorId} onValueChange={setMentorId}>
            <SelectTrigger aria-label="Choose a mentor">
              <SelectValue placeholder="Choose a mentor" />
            </SelectTrigger>
            <SelectContent>
              {mentors.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="flex items-center gap-2">
                    <MentorAvatar mentor={m} />
                    <span className="text-sm text-app-ink">{m.display_name}</span>
                    {m.church_affiliation ? (
                      <span className="text-xs text-app-ink/60">{m.church_affiliation}</span>
                    ) : null}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>
            <Textarea
              aria-label="Intro note to your mentor"
              placeholder="Introduce yourself and why you're asking…"
              maxLength={VOUCHER_TEXT_MAX}
              rows={4}
              value={note}
              disabled={submitting}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="mt-1 text-right text-xs font-mono tabular-nums text-app-ink/50">
              {counterLabel(note)}
            </p>
          </div>

          <Button
            type="button"
            disabled={!canSend}
            onClick={handleSend}
            className="w-full bg-app-primary text-app-on-primary hover:bg-app-primary/90"
          >
            {submitting ? "Sending…" : "Send request"}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-2 rounded-md border border-app-warn/40 bg-app-warn/10 px-3 py-2 text-sm text-app-warn"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
