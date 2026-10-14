import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import theme from '../../styles/theme';

export default function ValidatedInput({
  etiqueta,
  label,
  valor,
  value,
  onChangeText,
  tipo = 'numero',
  placeholder,
  unidad,
  unit,
  error,
  editable = true,
}) {
  const inputValue = valor ?? value ?? '';
  const validation = error
    ? { state: 'error', message: error }
    : validateValue(tipo, inputValue);

  return (
    <View style={styles.wrapper}>
      {etiqueta || label ? (
        <Text style={styles.label}>{etiqueta || label}</Text>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          validation.state === 'error' && styles.inputError,
          validation.state === 'warning' && styles.inputWarning,
          !editable && styles.inputDisabled,
        ]}
      >
        <TextInput
          value={String(inputValue)}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="decimal-pad"
          editable={editable}
          style={styles.input}
        />
        {unidad || unit ? <Text style={styles.unit}>{unidad || unit}</Text> : null}
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

export function validateValue(tipo, rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return { state: 'empty', message: '' };
  }

  const value = Number(String(rawValue).replace(',', '.'));

  if (!Number.isFinite(value)) {
    return { state: 'error', message: 'Ingrese un valor numerico valido.' };
  }

  if (tipo === 'ph') {
    if (value < 0 || value > 14) {
      return { state: 'error', message: 'El pH debe estar entre 0.0 y 14.0.' };
    }

    if (value <= theme.laboratoryLimits.phCutoff) {
      return { state: 'warning', message: 'pH de corte 4.50 alcanzado.' };
    }
  }

  if (tipo === 'temperatura' || tipo === 'temperature') {
    const { temperatureMin, temperatureMax } = theme.laboratoryLimits;

    if (value < temperatureMin || value > temperatureMax) {
      return {
        state: 'warning',
        message: 'Fuera del rango optimo de 41.0 °C a 43.0 °C.',
      };
    }
  }

  if (tipo === 'refraction') {
    if (value < 0 || value > 25) {
      return {
        state: 'error',
        message: 'El índice de refracción debe estar entre 0.0 y 25.0 °Brix.',
      };
    }
  }

  if (tipo === 'inoculo' || tipo === 'viscosidad' || tipo === 'numero') {
    if (value < 0) {
      return { state: 'error', message: 'El valor no puede ser negativo.' };
    }
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
    borderRadius: theme.radius.md,
    borderWidth: theme.borders.thin,
    paddingHorizontal: theme.spacing.md,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    paddingVertical: theme.spacing.md,
  },
  inputError: {
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.danger,
  },
  inputWarning: {
    backgroundColor: theme.colors.warningSoft,
    borderColor: theme.colors.warning,
  },
  inputDisabled: {
    backgroundColor: theme.colors.surfaceMuted,
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
