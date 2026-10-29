import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme, { getPhColor, getTemperatureColor } from '../../styles/theme';
import ScientificIcon from './ScientificIcons';

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
  const isWarning = (estado || status) === 'warning';

  // Obtener icono correspondiente
  const getCardIcon = () => {
    const t = (resolvedTitle || tipo || '').toLowerCase();
    if (t.includes('ph')) return 'ph';
    if (t.includes('temp') || t.includes('baño')) return 'thermometer';
    if (t.includes('tiempo') || t.includes('corte')) return 'clock';
    if (t.includes('viscos') || t.includes('reolog')) return 'droplet';
    return null;
  };

  const cardIcon = getCardIcon();

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: resolvedAccent },
        isWarning && styles.warningCard,
        style,
      ]}
    >
      <View style={styles.cardHeaderRow}>
        {resolvedTitle ? <Text style={styles.title}>{resolvedTitle}</Text> : null}
        {cardIcon ? (
          <ScientificIcon name={cardIcon} size={15} color={resolvedAccent} />
        ) : null}
      </View>
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

  if (tipo === 'viscosity' || tipo === 'viscosidad') {
    return theme.colors.viscosity;
  }

  if (tipo === 'refraction' || tipo === 'refraccion') {
    return theme.colors.refraction;
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
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderLeftWidth: 5,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  warningCard: {
    backgroundColor: '#FEF2F2',
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
});
