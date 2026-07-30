/**
 * Minimalist copyright line shown at the bottom of the welcome splash view
 * and the in-app settings panels.
 */
export function CopyrightNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-[11px] text-app-ink/50 ${className}`.trim()}>
      © 2026 TrueYoke. All rights reserved.
    </p>
  );
}
