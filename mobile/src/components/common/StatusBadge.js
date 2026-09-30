import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '../../styles/theme';

const STATUS_CONFIG = {
  enProceso: {
    aliases: ['enProceso', 'inProgress', 'proceso'],
    label: 'En Proceso',
    color: theme.colors.secondary,
    backgroundColor: theme.colors.secondarySoft,
  },
  finalizado: {
    aliases: ['finalizado', 'finished', 'done'],
    label: 'Finalizado',
    color: theme.colors.neutral,
    backgroundColor: theme.colors.neutralSoft,
  },
  alertaTermica: {
    aliases: ['alertaTermica', 'thermalAlert', 'alerta_termica'],
    label: 'Alerta Termica',
    color: theme.colors.warning,
    backgroundColor: theme.colors.warningSoft,
  },
  cortePh: {
    aliases: ['cortePh', 'optimalPh', 'corte_ph'],
    label: 'Corte pH 4.5',
    color: theme.colors.danger,
    backgroundColor: theme.colors.dangerSoft,
  },
};

export default function StatusBadge({ estado = 'enProceso', status, label }) {
  const config = getStatusConfig(status || estado);

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>
        {label || config.label}
      </Text>
    </View>
  );
}

function getStatusConfig(status) {
  return (
    Object.values(STATUS_CONFIG).find((config) =>
      config.aliases.includes(status),
    ) || STATUS_CONFIG.enProceso
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  text: {
    ...theme.typography.caption,
    fontWeight: '700',
  },
});
