/**
 * TrueYoke "Grounded Growth" email brand tokens.
 * Mirrors src/theme/colors.ts — keep in sync.
 */
export const brand = {
  burgundy: '#6B1724',
  burgundyInk: '#4A0F18',
  sage: '#87A987',
  fern: '#3A5744',
  linen: '#F4F1EA',
  sand: '#E3DACB',
  ink: '#241012',
  warmGray: '#8C8478',
  terracotta: '#C97B5A',
  white: '#ffffff',
} as const

export const LOGO_URL =
  'https://trueyoke.app/__l5e/assets-v1/28075c9b-ffdc-46e1-ade1-c75fc43ea126/trueyoke-logo.jpeg'

export const TAGLINE = 'Faith. Purpose. Together.'

const serif = 'Georgia, "Times New Roman", serif'
const sans = 'Helvetica, Arial, sans-serif'

export const main = { backgroundColor: '#ffffff', fontFamily: sans, margin: '0', padding: '0' }

export const container = {
  maxWidth: '520px',
  margin: '0 auto',
  padding: '32px 24px 40px',
}

export const card = {
  backgroundColor: brand.linen,
  borderRadius: '14px',
  border: `1px solid ${brand.sand}`,
  padding: '32px 28px',
}

export const logo = { display: 'block', margin: '0 auto 12px', borderRadius: '12px' }

export const tagline = {
  fontFamily: serif,
  fontSize: '13px',
  letterSpacing: '0.06em',
  color: brand.warmGray,
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

export const h1 = {
  fontFamily: serif,
  fontSize: '24px',
  fontWeight: 600 as const,
  color: brand.burgundy,
  margin: '0 0 18px',
}

export const text = {
  fontFamily: sans,
  fontSize: '15px',
  color: brand.ink,
  lineHeight: '1.6',
  margin: '0 0 20px',
}

export const link = { color: brand.burgundy, textDecoration: 'underline' }

export const button = {
  display: 'inline-block',
  backgroundColor: brand.burgundy,
  color: brand.linen,
  fontFamily: sans,
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '10px',
  padding: '14px 26px',
  textDecoration: 'none',
}

export const verse = {
  fontFamily: serif,
  fontSize: '14px',
  fontStyle: 'italic' as const,
  color: brand.fern,
  borderLeft: `3px solid ${brand.sage}`,
  padding: '4px 0 4px 14px',
  margin: '28px 0 0',
  lineHeight: '1.6',
}

export const code = {
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: '28px',
  letterSpacing: '0.18em',
  fontWeight: 700 as const,
  color: brand.burgundy,
  backgroundColor: brand.white,
  border: `1px solid ${brand.sand}`,
  borderRadius: '10px',
  padding: '14px 18px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

export const hr = { borderColor: brand.sand, margin: '28px 0 16px' }

export const footer = {
  fontFamily: sans,
  fontSize: '12px',
  color: brand.warmGray,
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
}
