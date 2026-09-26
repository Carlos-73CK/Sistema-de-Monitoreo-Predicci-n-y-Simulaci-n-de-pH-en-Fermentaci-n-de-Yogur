import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '../../styles/theme';

const STATUS_CONFIG = {
  inProgress: {
    label: 'En Proceso',
    color: theme.colors.info,
    backgroundColor: theme.colors.primarySoft,
  },
  optimalPh: {
    label: 'pH Optimo Alcanzado',
    color: theme.colors.success,
    backgroundColor: theme.colors.successSoft,
  },
  thermalAlert: {
    label: 'Alerta Termica',
    color: theme.colors.danger,
    backgroundColor: theme.colors.dangerSoft,
  },
};

export default function StatusBadge({ status = 'inProgress', label }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.inProgress;

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>
        {label || config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.sm,
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
