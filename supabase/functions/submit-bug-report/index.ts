// Supabase Edge Function — in-app tester bug reports.
//
// The caller's identity always comes from the verified JWT, never the body.
// Linear is reached through the Lovable connector gateway: the gateway holds
// the workspace's Linear OAuth credentials, and this function only ever sends
// its own server-side gateway keys. The client never sees either.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LINEAR_API = "https://connector-gateway.lovable.dev/linear/graphql";
const TEAM_ID = "309e992d-fba1-4ba3-95e5-4b6cf005ea9d";
const LABEL_NAMES = ["Tester Feedback", "Bug"];
const PRIORITY: Record<string, number> = { critical: 1, medium: 3, low: 4 };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function linear(
  gatewayKey: string,
  connectionKey: string,
  query: string,
  variables: Record<string, unknown>,
) {
  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatewayKey}`,
      "X-Connection-Api-Key": connectionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Linear request failed [${res.status}]: ${body}`);
  const parsed = JSON.parse(body) as { data?: unknown; errors?: unknown };
  if (parsed.errors) throw new Error(`Linear returned errors: ${JSON.stringify(parsed.errors)}`);
  return parsed.data;
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await anon.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const userId = String(claimsData.claims.sub);

  let payload: { title?: unknown; description?: unknown; severity?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const description = typeof payload.description === "string" ? payload.description.trim() : "";
  const severity = typeof payload.severity === "string" ? payload.severity : "";

  if (!title || title.length > 120) return json({ error: "Invalid title" }, 400);
  if (!description || description.length > 2000) return json({ error: "Invalid description" }, 400);
  if (!(severity in PRIORITY)) return json({ error: "Invalid severity" }, 400);

  const gatewayKey = Deno.env.get("LOVABLE_API_KEY");
  const connectionKey = Deno.env.get("LINEAR_API_KEY");
  if (!gatewayKey || !connectionKey) {
    console.error("Linear connector credentials are not configured");
    return json({ error: "Bug reporting is not available right now" }, 503);
  }

  try {
    const labelData = (await linear(
      gatewayKey,
      connectionKey,

      `query Labels($teamId: String!) {
        team(id: $teamId) { labels(first: 100) { nodes { id name } } }
      }`,
      { teamId: TEAM_ID },
    )) as { team?: { labels?: { nodes?: Array<{ id: string; name: string }> } } };

    const nodes = labelData?.team?.labels?.nodes ?? [];
    const labelIds = LABEL_NAMES.map(
      (name) => nodes.find((n) => n.name.toLowerCase() === name.toLowerCase())?.id,
    ).filter((id): id is string => typeof id === "string");

    const body =
      `${description}\n\n---\n` +
      `Submitted from an in-app tester report.\n` +
      `Reporter user id: ${userId}\n` +
      `Severity: ${severity}`;

    const created = (await linear(
      gatewayKey,
      connectionKey,
      `mutation Create($input: IssueCreateInput!) {
        issueCreate(input: $input) { success issue { identifier } }
      }`,
      {
        input: {
          teamId: TEAM_ID,
          title,
          description: body,
          priority: PRIORITY[severity],
          ...(labelIds.length > 0 ? { labelIds } : {}),
        },
      },
    )) as { issueCreate?: { success?: boolean; issue?: { identifier?: string } } };

    if (!created?.issueCreate?.success) throw new Error("issueCreate returned success=false");
    console.log(`Created Linear issue ${created.issueCreate.issue?.identifier} for ${userId}`);
    return json({ ok: true });
  } catch (err) {
    console.error("submit-bug-report failed:", err instanceof Error ? err.message : err);
    return json({ error: "Could not submit report" }, 502);
  }
});
