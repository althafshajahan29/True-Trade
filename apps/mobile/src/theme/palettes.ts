export interface Palette {
  bg: string;
  bgElevated: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentMuted: string;
  onAccent: string;
  positive: string;
  positiveMuted: string;
  negative: string;
  negativeMuted: string;
  warning: string;
  warningMuted: string;
  purple: string;
  divider: string;
  overlay: string;
  tabBarBg: string;
  inputBg: string;
}

export const darkPalette: Palette = {
  bg: '#0A0E14',
  bgElevated: '#10151D',
  card: '#161C27',
  cardBorder: '#242C3A',
  textPrimary: '#F3F6FA',
  textSecondary: '#98A2B3',
  textTertiary: '#5D6779',
  accent: '#5B8DEF',
  accentMuted: 'rgba(91,141,239,0.16)',
  onAccent: '#FFFFFF',
  positive: '#22C55E',
  positiveMuted: 'rgba(34,197,94,0.16)',
  negative: '#F0546A',
  negativeMuted: 'rgba(240,84,106,0.16)',
  warning: '#F5A623',
  warningMuted: 'rgba(245,166,35,0.16)',
  purple: '#A855F7',
  divider: '#1D242F',
  overlay: 'rgba(3,6,10,0.72)',
  tabBarBg: '#0D1218',
  inputBg: '#131922',
};

export const lightPalette: Palette = {
  bg: '#F5F7FA',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E4E8EF',
  textPrimary: '#151A21',
  textSecondary: '#5B6472',
  textTertiary: '#8A93A3',
  accent: '#3B6FE0',
  accentMuted: 'rgba(59,111,224,0.10)',
  onAccent: '#FFFFFF',
  positive: '#159654',
  positiveMuted: 'rgba(21,150,84,0.10)',
  negative: '#D93A50',
  negativeMuted: 'rgba(217,58,80,0.10)',
  warning: '#B4740E',
  warningMuted: 'rgba(180,116,14,0.10)',
  purple: '#8B3FE0',
  divider: '#E9ECF1',
  overlay: 'rgba(20,24,30,0.5)',
  tabBarBg: '#FFFFFF',
  inputBg: '#F0F2F6',
};
