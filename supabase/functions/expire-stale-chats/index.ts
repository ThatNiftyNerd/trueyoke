// Supabase Edge Function — Intentionality Circuit Breaker (72h expiry).
// Deploy:   supabase functions deploy expire-stale-chats
// Schedule: in the Supabase dashboard (Edge Functions → Schedules) every 6 hours,
//           or via pg_cron calling this function's URL.
//
// Flips any 'active' match with no message activity in 72h to 'expired',
// matching PRD §3.3 "Expiry Rule".
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // service role: bypasses RLS for the sweep
  );

  const { data, error } = await supabase
    .from('matches')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('last_activity_at', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
    .select('id');

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true, expired: data?.length ?? 0 }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
