/**
 * AstroVue Design System
 * Premium Indian Vedic Astrology — Cosmic meets Clean
 */

export const colors = {
  // Cosmic backgrounds
  cosmicDeep:    '#080416',
  cosmicMid:     '#120A2E',
  cosmicLight:   '#1E1050',

  // Gold & Saffron — Indian premium
  gold:          '#F4B942',
  goldLight:     '#FCD878',
  goldDeep:      '#D4880A',
  saffron:       '#F97316',
  saffronLight:  '#FED7AA',

  // Spiritual purple
  violet:        '#7C3AED',
  violetLight:   '#A78BFA',
  violetMuted:   '#EDE9FE',

  // Surfaces
  white:         '#FFFFFF',
  cream:         '#FFFBF3',
  surface:       '#FEFDF8',
  card:          '#FFFFFF',

  // Text
  textPrimary:   '#1C1917',
  textSecondary: '#57534E',
  textMuted:     '#A8A29E',
  textInverse:   '#FFFFFF',

  // Semantic
  success:       '#059669',
  successLight:  '#D1FAE5',
  error:         '#DC2626',
  errorLight:    '#FEE2E2',
  warning:       '#D97706',
  warningLight:  '#FEF3C7',
  info:          '#2563EB',

  // Borders
  border:        '#F0EBE1',
  borderLight:   '#FAF6EF',

  // Zodiac sign colors
  zodiac: {
    fire:  '#EF4444',
    earth: '#78716C',
    air:   '#3B82F6',
    water: '#6366F1',
  },

  // Planet colors
  planets: {
    Sun:     '#F59E0B',
    Moon:    '#94A3B8',
    Mars:    '#EF4444',
    Mercury: '#10B981',
    Jupiter: '#F97316',
    Venus:   '#EC4899',
    Saturn:  '#6366F1',
    Rahu:    '#7C3AED',
    Ketu:    '#78716C',
  },
}

export const gradients = {
  cosmic:    ['#080416', '#1E0A4F', '#2D0F7A'],
  cosmicCard:['#1A0640', '#0F0328'],
  gold:      ['#F4B942', '#D4880A'],
  goldSoft:  ['#FEF3C7', '#FDE68A'],
  saffron:   ['#F97316', '#DC2626'],
  violet:    ['#7C3AED', '#4F46E5'],
  dawn:      ['#FFF7ED', '#FEF3C7', '#FDE68A'],
  dusk:      ['#1E1B4B', '#312E81', '#4338CA'],
  success:   ['#059669', '#047857'],
}

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
  huge:48,
}

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  full: 9999,
}

export const typography = {
  hero:    { fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  h1:      { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  h2:      { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  h3:      { fontSize: 20, fontWeight: '700' },
  h4:      { fontSize: 17, fontWeight: '700' },
  body:    { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyBold:{ fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  micro:   { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  label:   { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
}

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  gold: {
    shadowColor: '#F4B942',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 8,
  },
  violet: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
}
