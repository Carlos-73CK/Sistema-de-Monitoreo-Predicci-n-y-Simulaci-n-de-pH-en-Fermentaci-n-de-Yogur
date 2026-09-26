const colors = {
  background: '#F6F8F7',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF4F1',
  border: '#DCE7E2',
  text: '#1B2B26',
  textMuted: '#667A72',
  primary: '#157F63',
  primarySoft: '#DDF4EC',
  info: '#2563EB',
  warning: '#D97706',
  warningSoft: '#FFF3D7',
  danger: '#DC2626',
  dangerSoft: '#FDE2E2',
  success: '#16875E',
  successSoft: '#DFF6EA',
  optimalPh: '#16875E',
  thermalLow: '#2563EB',
  thermalHigh: '#DC2626',
};

const typography = {
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  metric: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const radii = {
  sm: 6,
  md: 8,
  lg: 12,
};

const shadows = {
  card: {
    shadowColor: '#0F241D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
};

const thermalStatus = {
  min: 41,
  max: 43,
  optimal: 42,
};

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  thermalStatus,
};

export function getTemperatureColor(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return colors.text;
  }

  if (value < thermalStatus.min) {
    return colors.thermalLow;
  }

  if (value > thermalStatus.max) {
    return colors.thermalHigh;
  }

  return colors.success;
}

export default theme;
