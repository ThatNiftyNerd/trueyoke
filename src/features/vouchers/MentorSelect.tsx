import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  inviteMentorByEmail,
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
  const isInvite = request.invitedEmail !== null;
  return (
    <li className="space-y-2 rounded-md border border-app-ink/15 px-3 py-3">
      <div className="flex items-center gap-3">
        <MentorAvatar name={request.mentorName} photoUrl={request.mentorPhotoSignedUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-app-ink">{request.mentorName}</p>
          {isInvite ? (
            <p className="truncate text-xs text-app-ink/60">
              Invite sent &mdash; not on TrueYoke yet
            </p>
          ) : request.mentorChurchAffiliation ? (
            <p className="truncate text-xs text-app-ink/60">{request.mentorChurchAffiliation}</p>
          ) : null}
        </div>
        <span className={`shrink-0 text-xs font-medium ${statusTone(request.status)}`}>
          {isInvite ? "Invited" : statusLabel(request.status)}
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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);

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

  const inviteEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim());
  const canInvite = inviteEmailValid && canSubmitRequest(inviteNote) && !inviting && !atCap;

  async function handleInvite() {
    setInviteError(null);
    setInviteSent(false);
    setInviting(true);
    try {
      await inviteMentorByEmail(inviteEmail, inviteNote);
      setRequests(await listOwnMentorRequests());
      setInviteEmail("");
      setInviteNote("");
      setInviteSent(true);
      setInviteOpen(false);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Could not send the invite.");
    } finally {
      setInviting(false);
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
        <p className="mt-2 text-sm text-app-ink/60">Yoking…</p>
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

          {!atCap ? (
            <div className="mt-3 border-t border-app-ink/10 pt-3">
              {inviteOpen ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="mentorInviteEmail" className="text-xs text-app-ink/70">
                      Mentor&apos;s email address
                    </Label>
                    <Input
                      id="mentorInviteEmail"
                      type="email"
                      inputMode="email"
                      placeholder="mentor@example.com"
                      value={inviteEmail}
                      disabled={inviting}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Textarea
                      aria-label="Note to include with your invite"
                      placeholder="Introduce yourself and why you're asking…"
                      maxLength={VOUCHER_TEXT_MAX}
                      rows={4}
                      value={inviteNote}
                      disabled={inviting}
                      onChange={(e) => setInviteNote(e.target.value)}
                    />
                    <p className="mt-1 text-right text-xs font-mono tabular-nums text-app-ink/50">
                      {counterLabel(inviteNote)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={inviting}
                      onClick={() => {
                        setInviteOpen(false);
                        setInviteError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={!canInvite}
                      onClick={handleInvite}
                      className="flex-1 bg-app-primary text-app-on-primary hover:bg-app-primary/90"
                    >
                      {inviting ? "Sending…" : "Send invite"}
                    </Button>
                  </div>
                  {inviteError ? (
                    <p role="alert" className="text-sm text-app-warn">
                      {inviteError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  className="text-sm text-app-primary underline underline-offset-2"
                  onClick={() => {
                    setInviteSent(false);
                    setInviteOpen(true);
                  }}
                >
                  Can&apos;t find your mentor? Invite them by email
                </button>
              )}
              {inviteSent && !inviteOpen ? (
                <p className="mt-2 text-sm text-app-ink/70">
                  Invite sent — it&apos;ll show up in your list once they join.
                </p>
              ) : null}
            </div>
          ) : null}
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
