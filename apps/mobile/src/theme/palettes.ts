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
  bg: '#0A090D',
  bgElevated: '#0F0D12',
  card: '#131117',
  cardBorder: '#242227',
  textPrimary: '#F3F1F5',
  textSecondary: '#9B98A3',
  textTertiary: '#615E68',
  accent: '#FF6A00',
  accentMuted: 'rgba(255,106,0,0.16)',
  onAccent: '#FFFFFF',
  positive: '#2ECA70',
  positiveMuted: 'rgba(46,202,112,0.16)',
  negative: '#FF3B30',
  negativeMuted: 'rgba(255,59,48,0.16)',
  warning: '#FFB020',
  warningMuted: 'rgba(255,176,32,0.16)',
  purple: '#A855F7',
  divider: '#1B191F',
  overlay: 'rgba(3,2,4,0.72)',
  tabBarBg: '#0C0A0F',
  inputBg: '#16141A',
};

export const lightPalette: Palette = {
  bg: '#F5F7FA',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E4E8EF',
  textPrimary: '#151A21',
  textSecondary: '#5B6472',
  textTertiary: '#8A93A3',
  accent: '#E05A00',
  accentMuted: 'rgba(224,90,0,0.10)',
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
