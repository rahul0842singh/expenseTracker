export const colors = {
  bg: '#0B0E14',
  bgElevated: '#12161F',
  card: '#161B26',
  cardAlt: '#1F2634',
  border: '#232B3A',
  borderLight: '#2E3850',
  primary: '#151C2C',
  accent: '#34D399',
  accentDark: '#059669',
  accentSoft: 'rgba(52, 211, 153, 0.14)',
  gold: '#FBBF24',
  goldSoft: 'rgba(251, 191, 36, 0.14)',
  blue: '#60A5FA',
  blueSoft: 'rgba(96, 165, 250, 0.14)',
  purple: '#A78BFA',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.12)',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textFaint: '#5B6478',
  white: '#FFFFFF',
  heroGradient: ['#0E3B2E', '#123528', '#151C2C'] as const,
  saveGradient: ['#34D399', '#059669'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const font = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
};
