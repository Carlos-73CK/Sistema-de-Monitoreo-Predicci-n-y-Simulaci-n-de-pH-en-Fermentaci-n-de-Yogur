export const colors = {
  primary: '#2563EB',
  primaryDark: '#1E3A8A',
  primarySoft: '#DBEAFE',
  secondary: '#0F766E',
  secondarySoft: '#CCFBF1',
  info: '#2563EB',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#CBD5E1',
  borderSoft: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  success: '#27AE60',
  successSoft: '#E8F7EF',
  warning: '#DD6B20',
  warningSoft: '#FFF4E5',
  danger: '#C53030',
  dangerSoft: '#FDECEC',
  neutral: '#334155',
  neutralSoft: '#E2E8F0',
};

export const typography = {
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
  },
  h1: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
  },
  h2: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  metric: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
};

export const borders = {
  thin: 1,
  focus: 2,
};

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
};

export const laboratoryLimits = {
  temperatureMin: 41,
  temperatureMax: 43,
  temperatureSetPoint: 42,
  phCutoff: 4.5,
};

const theme = {
  colors,
  typography,
  spacing,
  radius,
  radii: radius,
  borders,
  shadows,
  laboratoryLimits,
  thermalStatus: {
    min: laboratoryLimits.temperatureMin,
    max: laboratoryLimits.temperatureMax,
    optimal: laboratoryLimits.temperatureSetPoint,
  },
};

export function getTemperatureColor(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return colors.textMuted;
  }

  if (
    value < laboratoryLimits.temperatureMin ||
    value > laboratoryLimits.temperatureMax
  ) {
    return colors.warning;
  }

  return colors.success;
}

export function getPhColor(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return colors.textMuted;
  }

  return value <= laboratoryLimits.phCutoff ? colors.danger : colors.primary;
}

export default theme;
