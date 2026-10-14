import theme from './theme';

export const ALERT_TYPES = {
  OPTIMO: 'OPTIMO',
  ALERTA_TERMICA: 'ALERTA_TERMICA',
  CORTE_PH: 'CORTE_PH',
};

export const ALERT_COLORS = {
  OPTIMO: '#27AE60',
  ALERTA_TERMICA: '#DD6B20',
  CORTE_PH: '#C53030',
};

export const ALERT_STYLES = {
  OPTIMO: {
    color: ALERT_COLORS.OPTIMO,
    backgroundColor: theme.colors.successSoft,
    borderColor: ALERT_COLORS.OPTIMO,
  },
  ALERTA_TERMICA: {
    color: ALERT_COLORS.ALERTA_TERMICA,
    backgroundColor: theme.colors.warningSoft,
    borderColor: ALERT_COLORS.ALERTA_TERMICA,
  },
  CORTE_PH: {
    color: ALERT_COLORS.CORTE_PH,
    backgroundColor: theme.colors.dangerSoft,
    borderColor: ALERT_COLORS.CORTE_PH,
  },
};

export function getTemperatureAlertType(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const { temperatureMin, temperatureMax } = theme.laboratoryLimits;
  return value < temperatureMin || value > temperatureMax
    ? ALERT_TYPES.ALERTA_TERMICA
    : ALERT_TYPES.OPTIMO;
}

export function getPhAlertType(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value <= theme.laboratoryLimits.phCutoff
    ? ALERT_TYPES.CORTE_PH
    : ALERT_TYPES.OPTIMO;
}
