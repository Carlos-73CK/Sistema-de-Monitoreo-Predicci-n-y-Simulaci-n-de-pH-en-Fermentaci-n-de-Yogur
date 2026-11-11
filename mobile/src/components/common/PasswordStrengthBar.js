import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScientificIcon from './ScientificIcons';

// Contraseñas comunes / comprometidas que deben ser rechazadas
const PASSWORDS_COMUNES = new Set([
  '123456789012',
  '1234567890123',
  'password12345',
  'contrasenia12',
  'contrasena123',
  'qwertyuiop12',
  'admin12345678',
  'prediyogur123',
  'prediyogur2026',
  'uleam20261234',
  'cambiame12345',
  'bienvenido123',
  'secret123456',
  'universidad12',
]);

/**
 * Evalúa la robustez de una contraseña
 * @param {string} password
 */
export function evaluatePasswordStrength(password = '') {
  const pass = String(password || '');
  if (!pass) {
    return {
      score: 0,
      label: 'Sin contraseña',
      color: '#CBD5E1',
      isAcceptable: false,
      checks: {
        length: false,
        upperLower: false,
        numbers: false,
        symbols: false,
        notCommon: true,
      },
    };
  }

  const isCommon = PASSWORDS_COMUNES.has(pass.toLowerCase().trim());
  const isRepetitive = /^(.)\1{5,}$/.test(pass);

  const checks = {
    length: pass.length >= 6,
    upperLower: /[a-z]/.test(pass) && /[A-Z]/.test(pass),
    numbers: /[0-9]/.test(pass),
    symbols: /[^a-zA-Z0-9]/.test(pass),
    notCommon: !isCommon && !isRepetitive,
  };

  if (isCommon || isRepetitive) {
    return {
      score: 1,
      label: 'Contraseña común o insegura',
      color: '#EF4444',
      isAcceptable: false,
      checks,
    };
  }

  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 8) score += 1;
  if (checks.upperLower) score += 1;
  if (checks.numbers || checks.symbols) score += 1;

  // Para ser aceptable, DEBE tener al menos 6 caracteres y no ser común
  const isAcceptable = checks.length && checks.notCommon;

  let label = 'Muy débil';
  let color = '#EF4444';

  if (pass.length < 6) {
    label = 'Muy corta (mínimo 6 caracteres)';
    color = '#EF4444';
  } else {
    if (score <= 1) {
      label = 'Aceptable (6 caracteres básicos)';
      color = '#EAB308';
    } else if (score === 2) {
      label = 'Buena (8+ caracteres)';
      color = '#10B981';
    } else {
      label = 'Robusta y Segura (óptima)';
      color = '#059669';
    }
  }

  return {
    score,
    label,
    color,
    isAcceptable,
    checks,
  };
}

export default function PasswordStrengthBar({ password = '' }) {
  if (!password) {
    return (
      <View style={styles.hintContainer}>
        <Text style={styles.hintInitialText}>
          🔒 La contraseña debe contener al menos 6 caracteres para poder registrar tu cuenta.
        </Text>
      </View>
    );
  }

  const { score, label, color, isAcceptable, checks } = evaluatePasswordStrength(password);

  // 4 barras de progreso
  const segment1 = score >= 1;
  const segment2 = score >= 2;
  const segment3 = score >= 3;
  const segment4 = score >= 4;

  return (
    <View style={styles.container}>
      {/* Barra de progreso de 4 segmentos */}
      <View style={styles.meterRow}>
        <View style={[styles.segment, segment1 ? { backgroundColor: color } : styles.segmentEmpty]} />
        <View style={[styles.segment, segment2 ? { backgroundColor: color } : styles.segmentEmpty]} />
        <View style={[styles.segment, segment3 ? { backgroundColor: color } : styles.segmentEmpty]} />
        <View style={[styles.segment, segment4 ? { backgroundColor: color } : styles.segmentEmpty]} />
      </View>

      {/* Etiqueta de nivel */}
      <View style={styles.labelRow}>
        <Text style={styles.levelTitle}>Nivel de seguridad:</Text>
        <Text style={[styles.levelLabel, { color }]}>{label}</Text>
      </View>

      {/* Indicador de aceptación */}
      {isAcceptable ? (
        <View style={styles.acceptableBadge}>
          <ScientificIcon name="check" size={13} color="#059669" style={{ marginRight: 6 }} />
          <Text style={styles.acceptableText}>Contraseña aceptada para el registro</Text>
        </View>
      ) : (
        <View style={styles.pendingBadge}>
          <ScientificIcon name="alert" size={13} color="#B45309" style={{ marginRight: 6 }} />
          <Text style={styles.pendingText}>
            {password.length < 6
              ? `Faltan ${6 - password.length} caracter(es) para alcanzar el mínimo de 6`
              : 'Se requiere una contraseña no repetitiva'}
          </Text>
        </View>
      )}

      {/* Checklist detallado de validación */}
      <View style={styles.checklist}>
        <View style={styles.checkItem}>
          <Text style={[styles.checkIcon, checks.length ? styles.checkIconValid : styles.checkIconPending]}>
            {checks.length ? '✓' : '○'}
          </Text>
          <Text style={[styles.checkText, checks.length && styles.checkTextValid]}>
            Mínimo 6 caracteres ({password.length}/6)
          </Text>
        </View>

        <View style={styles.checkItem}>
          <Text style={[styles.checkIcon, checks.upperLower ? styles.checkIconValid : styles.checkIconPending]}>
            {checks.upperLower ? '✓' : '○'}
          </Text>
          <Text style={[styles.checkText, checks.upperLower && styles.checkTextValid]}>
            Mayúsculas y minúsculas (Aa)
          </Text>
        </View>

        <View style={styles.checkItem}>
          <Text style={[styles.checkIcon, checks.numbers ? styles.checkIconValid : styles.checkIconPending]}>
            {checks.numbers ? '✓' : '○'}
          </Text>
          <Text style={[styles.checkText, checks.numbers && styles.checkTextValid]}>
            Al menos un número (0-9)
          </Text>
        </View>

        <View style={styles.checkItem}>
          <Text style={[styles.checkIcon, checks.symbols ? styles.checkIconValid : styles.checkIconPending]}>
            {checks.symbols ? '✓' : '○'}
          </Text>
          <Text style={[styles.checkText, checks.symbols && styles.checkTextValid]}>
            Símbolo especial (@, #, $, %, etc.)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hintContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  hintInitialText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  meterRow: {
    flexDirection: 'row',
    height: 5,
    gap: 4,
    marginBottom: 6,
  },
  segment: {
    flex: 1,
    borderRadius: 3,
  },
  segmentEmpty: {
    backgroundColor: '#E2E8F0',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  levelTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  acceptableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  acceptableText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '700',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  pendingText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  checklist: {
    gap: 3,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 12,
    marginRight: 6,
    fontWeight: '700',
  },
  checkIconValid: {
    color: '#059669',
  },
  checkIconPending: {
    color: '#94A3B8',
  },
  checkText: {
    fontSize: 11,
    color: '#64748B',
  },
  checkTextValid: {
    color: '#1E293B',
    fontWeight: '600',
  },
});
