// Supabase Edge Function — a Match invites someone not yet on TrueYoke to
// join as a Mentor and pick up their endorsement request.
//
// Two clients are used deliberately:
//  - `anon` (forwarding the caller's own JWT) does the profile read and the
//    `vouchers` insert, so RLS (`vouchers_owner`) and the existing
//    `enforce_voucher_request_cap()` trigger apply exactly as they do for a
//    direct mentor request — an invite is just a vouchers row with
//    mentor_id = NULL, so it counts toward the same 7-request cap for free.
//  - `service` (service-role key) is only used for enqueue_email /
//    email_send_log, which are intentionally restricted to service_role
//    (see 20260802185905_email_infra.sql).
//
// WhatsApp is scaffolded (invite_channel column, invitee_phone column) but
// gated off here until Meta Business verification + template approval are
// done and META_WHATSAPP_TOKEN / META_WHATSAPP_PHONE_NUMBER_ID secrets exist.
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { MentorInviteEmail } from "../_shared/email-templates/mentor-invite.tsx";

const SITE_NAME = "trueyoke";
const FROM_DOMAIN = "trueyoke.app";
const SENDER_DOMAIN = "notify.trueyoke.app";
const ROOT_DOMAIN = "trueyoke.app";
const NOTE_MAX = 250;
const EMAIL_MAX = 254;
// Feature-flagged server-side too: even if a future client build starts
// sending channel: "whatsapp", this stays inert until flipped here AND the
// Meta secrets are configured.
const WHATSAPP_INVITES_ENABLED = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const anon = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await anon.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const userId = String(claimsData.claims.sub);

  let payload: { email?: unknown; note?: unknown; channel?: unknown; phone?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const channel = payload.channel === "whatsapp" ? "whatsapp" : "email";
  if (channel === "whatsapp" && !WHATSAPP_INVITES_ENABLED) {
    return json({ error: "WhatsApp invites aren't available yet — try email." }, 403);
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const note = typeof payload.note === "string" ? payload.note.trim() : "";
  if (!email || email.length > EMAIL_MAX || !EMAIL_RE.test(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }
  if (note.length > NOTE_MAX) {
    return json({ error: `Note must be ${NOTE_MAX} characters or fewer.` }, 400);
  }

  const { data: profile, error: profileErr } = await anon
    .from("profiles")
    .select("account_type, display_name")
    .eq("id", userId)
    .maybeSingle();
  if (profileErr) return json({ error: "Could not verify your account" }, 500);
  if (!profile || profile.account_type !== "match") {
    return json({ error: "Only Match accounts can invite mentors" }, 403);
  }
  const inviterName = (profile.display_name ?? "").trim() || "A TrueYoke member";

  const inviteToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertErr } = await anon.from("vouchers").insert({
    match_user_id: userId,
    invitee_email: email,
    invitee_phone: channel === "whatsapp" ? (typeof payload.phone === "string" ? payload.phone : null) : null,
    invite_channel: channel,
    invite_token: inviteToken,
    invite_expires_at: expiresAt,
    request_note: note || null,
  });

  if (insertErr) {
    const msg = `${insertErr.message} ${insertErr.hint ?? ""}`;
    if (/maximum of 7 mentor requests/i.test(msg)) {
      return json(
        {
          error:
            "You've reached the maximum of 7 mentor requests. Wait for a decision on an existing request before inviting more.",
        },
        409,
      );
    }
    if (insertErr.code === "23505" || /duplicate key/i.test(msg)) {
      return json({ error: "You already have a pending invite to this email." }, 409);
    }
    console.error("invite-mentor: vouchers insert failed", insertErr);
    return json({ error: "Could not create the invite" }, 500);
  }

  const inviteUrl = `https://${ROOT_DOMAIN}/invite/mentor?token=${inviteToken}`;
  const html = await renderAsync(
    React.createElement(MentorInviteEmail, {
      siteName: SITE_NAME,
      inviterName,
      note: note || null,
      inviteUrl,
    }),
  );
  const text = await renderAsync(
    React.createElement(MentorInviteEmail, {
      siteName: SITE_NAME,
      inviterName,
      note: note || null,
      inviteUrl,
    }),
    { plainText: true },
  );

  const service = createClient(supabaseUrl, serviceKey);
  const messageId = crypto.randomUUID();

  await service.from("email_send_log").insert({
    message_id: messageId,
    template_name: "mentor_invite",
    recipient_email: email,
    status: "pending",
  });

  const { error: enqueueError } = await service.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      // No run_id: that field ties an email to a specific Lovable AI run
      // (e.g. the auth-hook webhook event that triggered it) and is
      // rejected with "run_not_found" if set to anything else -- it's
      // optional in EmailSendRequest and correctly absent for a
      // plain app-triggered transactional send like this one. The API
      // does require ONE of run_id / idempotency_key though, so a plain
      // app-triggered send must supply idempotency_key alongside
      // purpose: "transactional" instead (confirmed via the live 400
      // error: "App emails can omit run_id by providing idempotency_key
      // with purpose=transactional").
      message_id: messageId,
      idempotency_key: messageId,
      to: email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: `${inviterName} invited you to be their TrueYoke mentor`,
      html,
      text,
      purpose: "transactional",
      label: "mentor_invite",
      queued_at: new Date().toISOString(),
    },
  });

  if (enqueueError) {
    console.error("invite-mentor: enqueue failed", enqueueError);
    await service.from("email_send_log").insert({
      message_id: messageId,
      template_name: "mentor_invite",
      recipient_email: email,
      status: "failed",
      error_message: "Failed to enqueue email",
    });
    // The vouchers row (and its cap slot) stays in place — the invite exists
    // and its link is valid even though the notification email didn't go
    // out; surfacing this as an error tells the sender to try again rather
    // than silently believing an email was sent.
    return json({ error: "Invite saved, but the email could not be sent. Please try again." }, 502);
  }

  return json({ ok: true });
});
