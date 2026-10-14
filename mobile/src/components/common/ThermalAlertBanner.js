import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '../../styles/theme';

export default function ThermalAlertBanner({ temperatura, temperature }) {
  const value = Number(String(temperatura ?? temperature).replace(',', '.'));

  if (!Number.isFinite(value)) {
    return null;
  }

  const { temperatureMin, temperatureMax, temperatureSetPoint } =
    theme.laboratoryLimits;
  const isLow = value < temperatureMin;
  const isHigh = value > temperatureMax;

  if (!isLow && !isHigh) {
    return null;
  }

  const directionText = isLow
    ? `Temperatura baja respecto a ${temperatureSetPoint} °C`
    : `Temperatura alta respecto a ${temperatureSetPoint} °C`;

  return (
    <View style={styles.banner}>
      <View style={styles.marker} />
      <View style={styles.copy}>
        <Text style={styles.title}>Alerta Termica</Text>
        <Text style={styles.message}>
          {directionText}. Lectura actual: {value.toFixed(1)} °C. Rango optimo:{' '}
          {temperatureMin.toFixed(1)} °C - {temperatureMax.toFixed(1)} °C.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.warningSoft,
    borderColor: theme.colors.warning,
    borderRadius: theme.radius.md,
    borderWidth: theme.borders.thin,
    padding: theme.spacing.lg,
  },
  marker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.warning,
    marginRight: theme.spacing.md,
    marginTop: 4,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...theme.typography.subtitle,
    color: theme.colors.warning,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
});
