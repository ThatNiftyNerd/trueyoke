# Extend premium motion into the signed-in app

## Scope
- Add a sticky glass top bar to the `/app` shell while preserving safe-area spacing and notification behavior.
- Add subtle entrance and scroll-reveal motion to the signed-in content area using the same easing and reduced-motion behavior as the landing page.
- Add restrained hover/focus lift to match rows and the Discover candidate card, without changing any data, navigation, or matching behavior.
- Keep the bottom navigation stable and touch-friendly.

## Technical details
- Reuse Framer Motion and the existing shared motion variants where practical.
- Wrap signed-in content in `MotionConfig reducedMotion="user"` so motion follows system accessibility settings.
- Animate route content by pathname and stagger the Active/Expired match sections and rows.
- Preserve existing semantic color tokens, dark mode, account-type guards, safe areas, and mobile layouts.
- Verify build health and render the signed-in views at desktop and mobile sizes when authentication permits.
