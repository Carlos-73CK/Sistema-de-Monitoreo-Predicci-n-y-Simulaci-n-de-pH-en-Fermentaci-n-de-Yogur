import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import theme from '../../styles/theme';

export default function CustomInput({
  label,
  value,
  onChangeText,
  metricType,
  placeholder,
  unit,
}) {
  const validation = getValidation(metricType, value);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          validation.state === 'error' && styles.inputError,
          validation.state === 'warning' && styles.inputWarning,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {validation.message ? (
        <Text
          style={[
            styles.helper,
            validation.state === 'error' && styles.helperError,
            validation.state === 'warning' && styles.helperWarning,
          ]}
        >
          {validation.message}
        </Text>
      ) : null}
    </View>
  );
}

function getValidation(metricType, rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return { state: 'empty', message: '' };
  }

  const value = Number(String(rawValue).replace(',', '.'));

  if (Number.isNaN(value)) {
    return { state: 'error', message: 'Ingrese un valor numerico valido.' };
  }

  if (metricType === 'ph') {
    if (value < 0 || value > 14) {
      return { state: 'error', message: 'El pH debe estar entre 0.0 y 14.0.' };
    }

    return { state: 'valid', message: '' };
  }

  if (metricType === 'temperature') {
    if (value < theme.thermalStatus.min || value > theme.thermalStatus.max) {
      return {
        state: 'warning',
        message: 'Fuera del rango optimo de 41 °C a 43 °C.',
      };
    }

    return { state: 'valid', message: '' };
  }

  return { state: 'valid', message: '' };
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    paddingVertical: theme.spacing.md,
  },
  inputError: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerSoft,
  },
  inputWarning: {
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.warningSoft,
  },
  unit: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.sm,
  },
  helper: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  helperError: {
    color: theme.colors.danger,
  },
  helperWarning: {
    color: theme.colors.warning,
  },
});
