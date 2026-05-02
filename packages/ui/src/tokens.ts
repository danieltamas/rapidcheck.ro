/**
 * Typed mirror of the design tokens defined in `theme.css`.
 *
 * Components and consumers that need token values at runtime (in JS, not CSS)
 * read from these objects. Values are byte-equivalent to the `:host` defaults
 * declared in `theme.css`. Persona overrides are NOT mirrored here because
 * they are applied via the cascade — JS rarely needs a different runtime
 * value, and when it does it should compute from the live computed style.
 *
 * Do not add new tokens here without also adding them to `theme.css`. The two
 * sources MUST stay in sync; the catalog in `docs/design-system.md` is the
 * canonical reference.
 */

export const colors = {
  primary: '#003b73',
  primaryHover: '#1d4f9b',
  primaryActive: '#002a5a',
  primarySoft: '#e8eef6',
  primaryContrast: '#ffffff',
  bg: '#ffffff',
  surface: '#f7f9fc',
  surfaceElevated: '#ffffff',
  surfaceSunken: '#eef2f6',
  text: '#1a1a1a',
  textStrong: '#0b1320',
  muted: '#5b6b7d',
  subtle: '#94a0ae',
  border: '#d0d7de',
  borderStrong: '#c0c8d2',
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayStrong: 'rgba(15, 23, 42, 0.7)',
  link: '#003b73',
  linkHover: '#1d4f9b',
  linkVisited: '#5b3a8a',
  danger: '#b3261e',
  dangerHover: '#8e1e18',
  dangerSoft: '#fbeaea',
  success: '#1f7a3a',
  successHover: '#18602e',
  successSoft: '#e7f4ec',
  warning: '#b06700',
  warningHover: '#875000',
  warningSoft: '#fbf1de',
  info: '#1d4f9b',
  infoHover: '#163e7a',
  infoSoft: '#e8efff',
  neutral50: '#f7f9fc',
  neutral100: '#eef1f4',
  neutral200: '#d9dee5',
  neutral300: '#c0c8d2',
  neutral400: '#94a0ae',
  neutral500: '#6b7888',
  neutral600: '#4f5b6c',
  neutral700: '#38424f',
  neutral800: '#232b35',
  neutral900: '#111720',
} as const;

export const fontFamilies = {
  base: 'Arial, Calibri, Verdana, Tahoma, "Trebuchet MS", Ubuntu, sans-serif',
  display:
    'system-ui, -apple-system, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const;

export const fontSizes = {
  xs: '12px',
  sm: '14px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '56px',
} as const;

export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeights = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.55,
  relaxed: 1.7,
  loose: 1.9,
} as const;

export const letterSpacings = {
  tight: '-0.02em',
  snug: '-0.01em',
  normal: '0',
  wide: '0.02em',
  wider: '0.06em',
} as const;

export const spacing = {
  '0': '0',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '7': '32px',
  '8': '40px',
  '9': '48px',
  '10': '56px',
  '11': '64px',
  '12': '72px',
  '14': '80px',
  '16': '96px',
  '20': '128px',
} as const;

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
  md: '0 2px 6px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
  lg: '0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06)',
  xl: '0 24px 56px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15, 23, 42, 0.08)',
  inner: 'inset 0 1px 2px rgba(15, 23, 42, 0.08)',
} as const;

export const motion = {
  durations: {
    '75': '75ms',
    '100': '100ms',
    fast: '120ms',
    '150': '150ms',
    base: '200ms',
    '300': '300ms',
    slow: '320ms',
    '500': '500ms',
  },
  easings: {
    standard: 'cubic-bezier(0.2, 0, 0.2, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 900,
  modal: 1000,
  popover: 1100,
  tooltip: 1200,
  toast: 1300,
  max: 9999,
} as const;

export const focus = {
  ringColor: '#1d4f9b',
  ringWidth: '2px',
  offset: '2px',
} as const;

export const targetSize = '44px' as const;

/** All tokens grouped under one namespace. Useful for codegen / docs tooling. */
export const tokens = {
  colors,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  spacing,
  radius,
  shadows,
  motion,
  breakpoints,
  zIndex,
  focus,
  targetSize,
} as const;

export type DesignTokens = typeof tokens;
