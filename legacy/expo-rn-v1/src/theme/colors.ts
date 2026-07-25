// "Grounded Growth" palette — PRD §5.3. Single source of truth for all color.
export const colors = {
  burgundy: '#6B1724',   // primary: headers, nav, primary buttons & text
  sage: '#87A987',       // accent: verification badges, Life-Verse frame, highlights
  linen: '#F4F1EA',      // canvas/background
  terracotta: '#C97B5A', // FUNCTIONAL ONLY: chat-cap & 72h-expiry warnings

  // derived neutrals
  ink: '#2B2320',
  muted: '#7A726C',
  border: '#E2DCD0',
  white: '#FFFFFF',
  danger: '#B23A3A'
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;

export type AppColor = keyof typeof colors;
