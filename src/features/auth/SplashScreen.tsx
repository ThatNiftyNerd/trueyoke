/**
 * Full-viewport splash shown while the persisted Supabase session is being
 * rehydrated. Purely presentational.
 */
export function SplashScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-5 bg-app-canvas px-6"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <span className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-app-primary/70 animate-[pulse_1.4s_cubic-bezier(0.4,0,0.6,1)_infinite]"
            style={{ animationDelay: `${i * 180}ms` }}
          />
        ))}
      </span>
      <p className="font-serif text-xl tracking-wide text-app-ink animate-[pulse_1.8s_cubic-bezier(0.4,0,0.6,1)_infinite]">
        Yoking...
      </p>
    </div>
  );
}
