/**
 * Post-signup control letting a member turn the optional marketing emails on
 * or off. Writes the same `marketing_consents` row with source 'settings'.
 */
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { getCurrentSession } from "@/features/auth/api";
import { getOwnMarketingConsent, upsertMarketingConsent } from "./api";

export function MarketingPreferenceToggle() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const session = await getCurrentSession();
        if (!session || !alive) return;
        setProfileId(session.user.id);
        setEmail(session.user.email ?? "");
        setConsented(await getOwnMarketingConsent(session.user.id));
      } catch {
        // Non-critical: leave the toggle in its default off state.
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleChange(next: boolean) {
    if (!profileId) return;
    setError(null);
    setSaving(true);
    const previous = consented;
    setConsented(next);
    try {
      await upsertMarketingConsent({
        profileId,
        email,
        consented: next,
        source: "settings",
      });
    } catch (err) {
      setConsented(previous);
      setError(err instanceof Error ? err.message : "Could not save your preference.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-app-ink/20 px-4 py-3 text-left">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="marketing-preference" className="text-sm font-medium text-app-ink">
          Email updates
          <span className="mt-0.5 block text-xs font-normal text-app-ink/60">
            Occasional TrueYoke updates by email. Optional.
          </span>
        </label>
        <Switch
          id="marketing-preference"
          checked={consented}
          disabled={loading || saving || !profileId}
          onCheckedChange={(value) => void handleChange(value)}
        />
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-app-warn">
          {error}
        </p>
      ) : null}
    </div>
  );
}
