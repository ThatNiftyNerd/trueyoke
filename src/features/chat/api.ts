/**
 * Chat data access — message history, send, and Realtime subscription for a
 * single match_id. RLS enforces read (match participants) and write (only when
 * the match is 'active') — client-side checks here are UX only.
 */
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/features/auth/api";
import type { Tables } from "@/integrations/supabase/types";
import { MESSAGE_MAX_LENGTH } from "./logic";

export type MessageRow = Tables<"messages">;

export async function listMessages(matchId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type SendResult =
  | { kind: "sent"; message: MessageRow }
  | { kind: "not_active" }
  | { kind: "too_long" }
  | { kind: "empty" };

export async function sendMessage(matchId: string, rawBody: string): Promise<SendResult> {
  const body = rawBody.trim();
  if (!body) return { kind: "empty" };
  if (body.length > MESSAGE_MAX_LENGTH) return { kind: "too_long" };

  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("messages")
    .insert({ match_id: matchId, sender_id: userId, body })
    .select("*")
    .single();

  if (error) {
    // messages_send RLS: insert only allowed on 'active' matches. A denial
    // surfaces as an RLS violation — treat all send errors as "not active"
    // for the UX (composer will already have been disabled by then).
    const msg = `${error.message} ${error.hint ?? ""}`;
    if (/row-level security|violates|not_active/i.test(msg) || error.code === "42501") {
      return { kind: "not_active" };
    }
    throw new Error(error.message);
  }
  return { kind: "sent", message: data };
}

/**
 * INSERT subscription on messages, filtered to this match_id only. Caller
 * receives the freshly-inserted row.
 */
export function subscribeToMessages(
  matchId: string,
  onInsert: (row: MessageRow) => void,
): () => void {
  const channel = supabase
    .channel(`messages:${matchId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
      (payload) => onInsert(payload.new as MessageRow),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
