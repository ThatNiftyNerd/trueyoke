import { useEffect, useMemo, useState } from "react";
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
  MAX_ACTIVE_MENTOR_REQUESTS,
  listOnboardedMentors,
  listOwnMentorRequests,
  requestMentorVoucher,
  type MentorOption,
  type OwnMentorRequest,
} from "@/features/vouchers/api";
import { VOUCHER_TEXT_MAX, canSubmitRequest, counterLabel } from "@/features/vouchers/logic";
import { initialsOf } from "@/features/matches/logic";

function MentorAvatar({
  name,
  photoUrl,
  className = "h-9 w-9",
}: {
  name: string | null;
  photoUrl: string | null;
  className?: string;
}) {
  return (
    <div className={`shrink-0 overflow-hidden rounded-full bg-app-accent/20 ${className}`}>
      {photoUrl ? (
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-serif text-xs text-app-ink/70">
          {initialsOf(name)}
        </div>
      )}
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Endorsed";
    case "declined":
      return "Declined";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function statusTone(status: string): string {
  switch (status) {
    case "approved":
      return "text-app-primary";
    case "declined":
      return "text-app-ink/50";
    default:
      return "text-app-warn";
  }
}

function RequestRow({ request }: { request: OwnMentorRequest }) {
  return (
    <li className="space-y-2 rounded-md border border-app-ink/15 px-3 py-3">
      <div className="flex items-center gap-3">
        <MentorAvatar name={request.mentorName} photoUrl={request.mentorPhotoSignedUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-app-ink">{request.mentorName}</p>
          {request.mentorChurchAffiliation ? (
            <p className="truncate text-xs text-app-ink/60">{request.mentorChurchAffiliation}</p>
          ) : null}
        </div>
        <span className={`shrink-0 text-xs font-medium ${statusTone(request.status)}`}>
          {statusLabel(request.status)}
        </span>
      </div>

      {request.status === "approved" && request.endorsement ? (
        <blockquote className="rounded-md bg-app-primary/5 px-3 py-2 text-sm text-app-ink/80">
          {request.endorsement}
        </blockquote>
      ) : null}
    </li>
  );
}

/**
 * Lets a fully-onboarded "match" member request endorsements from onboarded
 * mentors — up to `MAX_ACTIVE_MENTOR_REQUESTS` at once — and shows the full
 * ledger of their own requests, mirroring the mentor-side ledger
 * (`MentorLedger`). Declined requests don't count toward the cap, so a match
 * can keep requesting other mentors after a decline; re-requesting the SAME
 * mentor stays permanently blocked by the DB's unique
 * (match_user_id, mentor_id) constraint, which is why a declined mentor is
 * still filtered out of the picker below.
 */
export function MentorSelect() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [requests, setRequests] = useState<OwnMentorRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [mentorId, setMentorId] = useState<string>("");
  const [note, setNote] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ownRequests, list] = await Promise.all([
          listOwnMentorRequests(),
          listOnboardedMentors(),
        ]);
        if (!alive) return;
        setRequests(ownRequests);
        setMentors(list);
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

  const requestedMentorIds = useMemo(() => new Set(requests.map((r) => r.mentorId)), [requests]);
  const availableMentors = useMemo(
    () => mentors.filter((m) => !requestedMentorIds.has(m.id)),
    [mentors, requestedMentorIds],
  );
  const activeCount = useMemo(
    () => requests.filter((r) => r.status === "pending" || r.status === "approved").length,
    [requests],
  );
  const atCap = activeCount >= MAX_ACTIVE_MENTOR_REQUESTS;
  const canSend = mentorId !== "" && canSubmitRequest(note) && !submitting && !atCap;

  async function handleSend() {
    setError(null);
    setSubmitting(true);
    try {
      await requestMentorVoucher(mentorId, note.trim());
      setRequests(await listOwnMentorRequests());
      setMentorId("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-md border border-app-ink/20 px-4 py-3 text-left">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-app-ink">Mentor endorsements</h2>
        <span className="font-mono text-xs tabular-nums text-app-ink/50">
          {activeCount}/{MAX_ACTIVE_MENTOR_REQUESTS}
        </span>
      </div>

      {loading ? (
        <p className="mt-2 text-sm text-app-ink/60">Loading…</p>
      ) : (
        <>
          {requests.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {requests.map((r) => (
                <RequestRow key={r.id} request={r} />
              ))}
            </ul>
          ) : null}

          {atCap ? (
            <p className="mt-3 text-sm text-app-ink/70">
              You&apos;ve reached the maximum of {MAX_ACTIVE_MENTOR_REQUESTS} mentor requests. Wait
              for a decision on an existing request before adding more.
            </p>
          ) : availableMentors.length === 0 && !error ? (
            <p className="mt-3 text-sm text-app-ink/60">
              {requests.length > 0
                ? "You've requested all available mentors."
                : "No mentors are available yet."}
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              <Select disabled={submitting} value={mentorId} onValueChange={setMentorId}>
                <SelectTrigger aria-label="Choose a mentor">
                  <SelectValue placeholder="Choose a mentor" />
                </SelectTrigger>
                <SelectContent>
                  {availableMentors.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <MentorAvatar
                          name={m.display_name}
                          photoUrl={m.photoSignedUrl}
                          className="h-6 w-6"
                        />
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
          )}
        </>
      )}

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
