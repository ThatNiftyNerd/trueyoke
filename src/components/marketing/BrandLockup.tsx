/**
 * The TrueYoke "Primary Lock-up" (submark + wordmark), per the Brand Guide's
 * Logo System section — "Three distinct assets, never mixed, never
 * recreated." The submark path data below is copied verbatim from the
 * guide's own <symbol id="trueyoke-mark"> definition (the "On Linen"
 * colorway: burgundy stroke, sage leaf), just laid out horizontally next to
 * the Fraunces wordmark instead of the guide's stacked print orientation —
 * a slim header bar doesn't have the vertical room a poster does, and the
 * guide itself says to "choose the most complete one the space allows."
 */

const MARK_VIEWBOX = "-8 -12 116 122";
const SAGE = "#87A987";
const SAGE_LIGHT = "#9FBE9C";

function Submark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox={MARK_VIEWBOX} className={className} aria-hidden="true">
      <path d="M52.5 18 C60 14 72 4 73 -8 C64 -6 54 2 52.5 18 Z" fill={SAGE} />
      <path d="M51.5 24 C44 22 36 16 37 8 C44 9 50 15 51.5 24 Z" fill={SAGE_LIGHT} />
      <path
        d="M50 49 C51 40 52 30 52.5 18"
        fill="none"
        stroke={SAGE}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <path
        d="M 90.0 0.2 C 96.5 0.0 98.0 2.2 96.8 4.8 L 93.50 3.00 C 93.58 3.50 94.58 4.67 94.00 6.00 C 93.42 7.33 92.08 9.50 90.00 11.00 C 87.92 12.50 84.38 13.67 81.50 15.00 C 78.62 16.33 75.12 17.33 72.70 19.00 C 70.28 20.67 68.53 23.17 67.00 25.00 C 65.47 26.83 64.58 28.33 63.50 30.00 C 62.42 31.67 61.35 33.33 60.50 35.00 C 59.65 36.67 59.27 38.33 58.40 40.00 C 57.53 41.67 56.70 43.50 55.30 45.00 C 53.90 46.50 50.88 48.33 50.00 49.00"
        fill="none"
        stroke="currentColor"
        strokeWidth={4.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 10.0 0.2 C 3.5 0.0 2.0 2.2 3.2 4.8 L 6.50 3.00 C 6.42 3.50 5.42 4.67 6.00 6.00 C 6.58 7.33 7.92 9.50 10.00 11.00 C 12.08 12.50 15.62 13.67 18.50 15.00 C 21.38 16.33 24.88 17.33 27.30 19.00 C 29.72 20.67 31.47 23.17 33.00 25.00 C 34.53 26.83 35.42 28.33 36.50 30.00 C 37.58 31.67 38.65 33.33 39.50 35.00 C 40.35 36.67 40.73 38.33 41.60 40.00 C 42.47 41.67 43.30 43.50 44.70 45.00 C 46.10 46.50 49.12 48.33 50.00 49.00"
        fill="none"
        stroke="currentColor"
        strokeWidth={4.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 50.00 49.00 C 50.92 51.50 54.28 60.50 55.50 64.00 C 56.72 67.50 56.76 68.17 57.30 70.00 C 57.84 71.83 58.42 73.33 58.75 75.00 C 59.08 76.67 59.19 78.67 59.30 80.00 C 59.41 81.33 59.42 81.83 59.40 83.00 C 59.38 84.17 59.33 85.67 59.15 87.00 C 58.97 88.33 58.68 89.83 58.30 91.00 C 57.92 92.17 57.90 93.00 56.85 94.00 C 55.80 95.00 53.14 96.00 52.00 97.00 C 50.86 98.00 50.33 99.50 50.00 100.00"
        fill="none"
        stroke="currentColor"
        strokeWidth={4.3}
        strokeLinecap="round"
      />
      <path
        d="M 50.00 49.00 C 49.08 51.50 45.72 60.50 44.50 64.00 C 43.28 67.50 43.24 68.17 42.70 70.00 C 42.16 71.83 41.58 73.33 41.25 75.00 C 40.92 76.67 40.81 78.67 40.70 80.00 C 40.59 81.33 40.58 81.83 40.60 83.00 C 40.62 84.17 40.67 85.67 40.85 87.00 C 41.03 88.33 41.32 89.83 41.70 91.00 C 42.08 92.17 42.10 93.00 43.15 94.00 C 44.20 95.00 46.86 96.00 48.00 97.00 C 49.14 98.00 49.67 99.50 50.00 100.00"
        fill="none"
        stroke="currentColor"
        strokeWidth={4.3}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-app-primary ${className}`.trim()}>
      <Submark className="h-8 w-8 shrink-0" />
      <span className="font-serif text-lg font-semibold tracking-[0.14em] text-app-primary">
        TRUEYOKE
      </span>
    </div>
  );
}
