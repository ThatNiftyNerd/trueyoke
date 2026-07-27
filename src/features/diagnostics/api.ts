/**
 * Diagnostics data access.
 *
 * The ONLY place diagnostics talks to the network. Components never call
 * `supabase.from(...)` directly.
 */
import { supabase } from "@/lib/supabase";
import {
  formatDuration,
  isSameOrigin,
  isValidProjectUrl,
  maskUrl,
  maskValue,
  type DiagnosticCheck,
} from "./logic";

const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

function checkUrlConfigured(): DiagnosticCheck {
  const present = SUPABASE_URL.length > 0;
  const valid = present && isValidProjectUrl(SUPABASE_URL);
  return {
    id: "env-url",
    label: "Backend URL configured",
    status: valid ? "pass" : "fail",
    detail: !present
      ? "VITE_SUPABASE_URL is missing from this build. Set it in your host's environment variables and rebuild."
      : valid
        ? maskUrl(SUPABASE_URL)
        : "VITE_SUPABASE_URL is set but is not a valid https URL.",
  };
}

function checkKeyConfigured(): DiagnosticCheck {
  const present = SUPABASE_PUBLISHABLE_KEY.length > 0;
  return {
    id: "env-key",
    label: "Publishable key configured",
    status: present ? "pass" : "fail",
    detail: present
      ? maskValue(SUPABASE_PUBLISHABLE_KEY)
      : "VITE_SUPABASE_PUBLISHABLE_KEY is missing from this build. Set it in your host's environment variables and rebuild.",
  };
}

/**
 * Lightweight auth-service reachability probe. `getSession()` is local, so we
 * hit the auth settings endpoint to prove the network path actually works.
 */
async function checkAuthReachable(): Promise<DiagnosticCheck> {
  const started = performance.now();
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
    });
    const elapsed = formatDuration(performance.now() - started);
    return {
      id: "auth-reachable",
      label: "Auth service reachable",
      status: response.ok ? "pass" : "fail",
      detail: response.ok ? `HTTP ${response.status} in ${elapsed}` : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      id: "auth-reachable",
      label: "Auth service reachable",
      status: "fail",
      detail: error instanceof Error ? error.message : "Network request failed.",
    };
  }
}

/**
 * Proves which origin the app *actually* sends requests to at runtime, read
 * back off a real response rather than off the env var. On a host like Vercel
 * this is the check that catches a stale or wrong inlined value.
 */
async function checkRuntimeTarget(): Promise<DiagnosticCheck> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
    });
    const effective = new URL(response.url).origin;
    const matches = isSameOrigin(effective, SUPABASE_URL);
    return {
      id: "runtime-target",
      label: "Runtime request target",
      status: matches ? "pass" : "fail",
      detail: matches
        ? `Requests go to ${maskUrl(effective)} — matches the inlined build value.`
        : `Requests go to ${maskUrl(effective)}, but the build inlined ${maskUrl(SUPABASE_URL)}. Update the host's env vars and rebuild.`,
    };
  } catch (error) {
    return {
      id: "runtime-target",
      label: "Runtime request target",
      status: "fail",
      detail:
        error instanceof Error ? error.message : "Could not resolve a runtime request target.",
    };
  }
}

/**
 * Lightweight Data API probe: a HEAD-style count against `profiles`, which
 * returns no rows and is cheap. Proves the key is accepted by PostgREST.
 */
async function checkDataApi(): Promise<DiagnosticCheck> {
  const started = performance.now();
  const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
  const elapsed = formatDuration(performance.now() - started);
  return {
    id: "data-api",
    label: "Database API responding",
    status: error ? "fail" : "pass",
    detail: error ? `${error.code ?? "error"}: ${error.message}` : `Query answered in ${elapsed}`,
  };
}

/** Reports whether a user session is currently restored on this device. */
async function checkSession(): Promise<DiagnosticCheck> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return {
      id: "session",
      label: "Signed-in session",
      status: "fail",
      detail: error.message,
    };
  }
  return {
    id: "session",
    label: "Signed-in session",
    // Informational only: being signed out is a valid state, so this never
    // fails the overall connectivity verdict.
    status: "pass",
    detail: data.session
      ? "Session restored on this device."
      : "No active session (not required for this check).",
  };
}

/** Runs every diagnostic check in parallel and returns them in display order. */
export async function runDiagnostics(): Promise<DiagnosticCheck[]> {
  const envChecks = [checkUrlConfigured(), checkKeyConfigured()];
  const envOk = envChecks.every((c) => c.status === "pass");

  if (!envOk) {
    return [
      ...envChecks,
      {
        id: "auth-reachable",
        label: "Auth service reachable",
        status: "fail",
        detail: "Skipped — backend URL or key is missing from this build.",
      },
      {
        id: "runtime-target",
        label: "Runtime request target",
        status: "fail",
        detail: "Skipped — backend URL or key is missing from this build.",
      },
      {
        id: "data-api",
        label: "Database API responding",
        status: "fail",
        detail: "Skipped — backend URL or key is missing from this build.",
      },
      {
        id: "session",
        label: "Signed-in session",
        status: "fail",
        detail: "Skipped — backend URL or key is missing from this build.",
      },
    ];
  }

  const [auth, target, data, session] = await Promise.all([
    checkAuthReachable(),
    checkRuntimeTarget(),
    checkDataApi(),
    checkSession(),
  ]);
  return [...envChecks, auth, target, data, session];
}

/** Build-time metadata shown alongside the checks. */
export function getBuildInfo(): { mode: string; dev: boolean } {
  return { mode: import.meta.env.MODE, dev: import.meta.env.DEV };
}
