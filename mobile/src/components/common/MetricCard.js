import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme, { getPhColor, getTemperatureColor } from '../../styles/theme';

export default function MetricCard({
  titulo,
  valor,
  unidad,
  subtitulo,
  tipo,
  estado,
  accentColor,
  style,
  label,
  value,
  unit,
  helperText,
  status,
}) {
  const resolvedTitle = titulo || label;
  const resolvedValue = valor ?? value;
  const resolvedUnit = unidad || unit;
  const resolvedSubtitle = subtitulo || helperText;
  const resolvedAccent =
    accentColor || getMetricAccent(tipo, estado || status, resolvedValue);

  return (
    <View style={[styles.card, { borderLeftColor: resolvedAccent }, style]}>
      {resolvedTitle ? <Text style={styles.title}>{resolvedTitle}</Text> : null}
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: resolvedAccent }]}>
          {resolvedValue ?? '--'}
        </Text>
        {resolvedUnit ? <Text style={styles.unit}>{resolvedUnit}</Text> : null}
      </View>
      {resolvedSubtitle ? (
        <Text style={styles.subtitle}>{resolvedSubtitle}</Text>
      ) : null}
    </View>
  );
}

function getMetricAccent(tipo, estado, rawValue) {
  const numericValue = Number(String(rawValue).replace(',', '.'));

  if (tipo === 'ph') {
    return getPhColor(numericValue);
  }

  if (tipo === 'temperatura' || tipo === 'temperature') {
    return getTemperatureColor(numericValue);
  }

  const statusColors = {
    normal: theme.colors.primary,
    optimo: theme.colors.success,
    success: theme.colors.success,
    alerta: theme.colors.warning,
    warning: theme.colors.warning,
    corte: theme.colors.danger,
    danger: theme.colors.danger,
    info: theme.colors.primary,
  };

  return statusColors[estado] || theme.colors.primary;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 148,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderLeftWidth: 5,
    borderRadius: theme.radius.md,
    borderWidth: theme.borders.thin,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
  },
  title: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  value: {
    ...theme.typography.metric,
  },
  unit: {
    ...theme.typography.subtitle,
    color: theme.colors.textMuted,
    marginBottom: 3,
    marginLeft: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
});
