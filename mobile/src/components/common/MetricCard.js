import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '../../styles/theme';

export default function MetricCard({
  label,
  value,
  unit,
  helperText,
  status = 'normal',
  accentColor,
}) {
  const resolvedAccent = accentColor || getAccentColor(status);

  return (
    <View style={[styles.card, { borderLeftColor: resolvedAccent }]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: resolvedAccent }]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

function getAccentColor(status) {
  const statusColors = {
    normal: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    info: theme.colors.info,
  };

  return statusColors[status] || theme.colors.primary;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 144,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderLeftWidth: 5,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
  },
  label: {
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
    marginLeft: theme.spacing.xs,
    marginBottom: 3,
  },
  helper: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
});
