/**
 * Auth business logic — pure helpers that orchestrate `api.ts`.
 */
import { getCurrentSession } from "./api";

/** True if there is currently an authenticated session. */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return session !== null;
}
