/**
 * Design Tokens — Nature Premium
 * Forest Green #2D5A3D / Cream #FFF8F0
 *
 * Ces tokens sont la source de vérité pour tout l'app.
 * Ils correspondent exactement aux valeurs dans tailwind.config.js.
 * Utiliser les tokens JS ici pour les styles inline si nécessaire.
 */

// ─── Colors ────────────────────────────────────────────────────────────────

export const Colors = {
  // Primary — Forest Green
  forest: {
    50:  '#EEF4F0',
    100: '#D6E8DA',
    200: '#ADD1B5',
    300: '#7BB690',
    400: '#4E9A6B',
    500: '#2D5A3D', // brand primary
    600: '#244A32',
    700: '#1C3A27',
    800: '#132A1C',
    900: '#0B1A11',
  },

  // Background
  cream: '#FFF8F0',
  parchment: {
    50:  '#FFFDF9',
    100: '#FFF8F0',
    200: '#FAECD8',
    300: '#F3DFC0',
    400: '#EAD1A6',
  },

  // Earth tones
  earth: {
    100: '#F2E8DC',
    200: '#E4D0BB',
    300: '#C4A882',
    400: '#A07850',
    500: '#7A5230',
  },
  bark: {
    100: '#EDE0D4',
    200: '#D4B8A0',
    300: '#B8906C',
    400: '#8C6040',
    500: '#5C3820',
  },
  sage: {
    100: '#EDF2EE',
    200: '#C8DACC',
    300: '#A0BEAA',
    400: '#76A080',
    500: '#4E8060',
  },

  // Semantic
  success: '#2D5A3D',
  warning: '#C4A882',
  error:   '#C0392B',
  info:    '#4E8060',

  // Muted text / secondary
  muted:          '#687068',

  // UI component states
  skeleton:       '#E8EDEA',
  fieldBg:        '#F5F1EB',
  notifBg:        '#FFF0E0',
  errorBg:        '#FFF5F5',
  errorBorder:    '#FCA5A5',
  done:           '#9AA49A',

  // Emergency urgency level (diagnostic)
  emergency:       '#7B0000',
  emergencyBg:     '#FFF0F0',
  emergencyBorder: '#F87171',

  // Pure
  white: '#FFFFFF',
  black: '#000000',
} as const;

// ─── Typography ────────────────────────────────────────────────────────────

export const Typography = {
  // Font sizes (px) — base 16px, scale 1.25
  size: {
    xs:   12, // caption
    sm:   14, // small body
    base: 16, // body
    lg:   18, // body large
    xl:   20, // heading 5
    '2xl': 24, // heading 4
    '3xl': 28, // heading 3
    '4xl': 34, // heading 2
    '5xl': 40, // heading 1
  },

  // Line heights (px)
  lineHeight: {
    xs:   16,
    sm:   20,
    base: 24,
    lg:   28,
    xl:   30,
    '2xl': 32,
    '3xl': 36,
    '4xl': 42,
    '5xl': 48,
  },

  // Font weights
  weight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },
} as const;

// ─── Spacing (4px base grid) ───────────────────────────────────────────────

export const Spacing = {
  0:    0,
  0.5:  2,
  1:    4,
  2:    8,
  3:    12,
  4:    16,
  5:    20,
  6:    24,
  7:    28,
  8:    32,
  10:   40,
  12:   48,
  14:   56,
  16:   64,
  20:   80,
  24:   96,
} as const;

// ─── Border Radius ─────────────────────────────────────────────────────────

export const Radius = {
  none: 0,
  sm:   4,
  md:   8,   // DEFAULT — cards, inputs
  lg:   12,
  xl:   16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// ─── Shadows ───────────────────────────────────────────────────────────────

export const Shadows = {
  sm: {
    shadowColor: Colors.forest[500],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.forest[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.forest[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: Colors.forest[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 32,
    elevation: 10,
  },
} as const;

// ─── Touch Targets (WCAG minimum 44x44) ───────────────────────────────────

export const TouchTarget = {
  min: 44,
  comfortable: 48,
  large: 56,
} as const;
