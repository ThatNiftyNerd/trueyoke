# Legacy: Expo/React Native v1 prototype (superseded)

This folder holds the original 72-hour build plan and Expo/React Native + Supabase scaffold
(`expo-rn-v1/`). It targeted a native EAS-built `.apk` on Android 15+.

**Superseded 2026-07-24** by the plan in [`../docs/YOKED_Build_Directives_v2.md`](../docs/YOKED_Build_Directives_v2.md):
the app is now authored in **Lovable** (React + Vite + Supabase) and wrapped with **Capacitor** to produce
the Android `.apk`, targeting **Android 11+ (API 30)**, with **GitHub Actions** as the CI/CD pipeline.

Kept for reference only — not the active build path. The Supabase backend (`../supabase/`) is unchanged
and still canonical; this folder's nested copy of it is frozen/historical, not a second source of truth.
