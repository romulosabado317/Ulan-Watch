export const COLORS = {
  ink: '#102A43',
  teal: '#1769AA',
  tealDark: '#0B4F8A',
  lime: '#D9EAF7',
  sky: '#E7F1FA',
  mist: '#F4F7FB',
  paper: '#FFFFFF',
  line: '#D6E0EA',
  muted: '#526579',
  danger: '#C1443C',
  success: '#247A58'
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 18, xl: 24 };
export const RADII = { sm: 8, md: 12, lg: 18, pill: 999 };

export const WATER_LEVELS = [
  { id: 'ankle', label: 'Ankle-deep', sub: 'Passable on foot', color: '#E3A83B' },
  { id: 'knee', label: 'Knee-deep', sub: 'Risky for vehicles', color: '#D97A2E' },
  { id: 'waist', label: 'Waist-deep', sub: 'Dangerous, avoid', color: '#C1443C' },
  { id: 'chest', label: 'Chest-deep+', sub: 'Impassable', color: '#6B1F26' }
];

export function levelInfo(id) {
  return WATER_LEVELS.find((l) => l.id === id) || WATER_LEVELS[0];
}

export const DEFAULT_REGION = {
  latitude: 14.5866,
  longitude: 121.1761,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05
};
