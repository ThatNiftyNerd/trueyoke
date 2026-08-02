/**
 * Native deep-link catcher for the OAuth redirect.
 *
 * Android routes `https://trueyoke.app/auth?code=…` back into the app via the
 * verified App Link intent-filter on MainActivity (the legacy
 * `app.trueyoke.mobile://auth-callback` scheme is still registered and also
 * handled here). Capacitor surfaces either one as an `appUrlOpen` event, which
 * we hand to the PKCE exchange — the handler is scheme-agnostic. On web this
 * is a no-op — supabase-js's own `detectSessionInUrl` handles the return trip.
 */
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { completeOAuthRedirect } from "./api";

export function startOAuthDeepLinkListener(): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};

  const handle = App.addListener("appUrlOpen", ({ url }) => {
    void (async () => {
      try {
        const established = await completeOAuthRedirect(url);
        if (established) await Browser.close().catch(() => {});
      } catch (err) {
        console.error("[auth] OAuth deep link exchange failed", err);
      }
    })();
  });

  return () => {
    void handle.then((listener) => listener.remove());
  };
}
