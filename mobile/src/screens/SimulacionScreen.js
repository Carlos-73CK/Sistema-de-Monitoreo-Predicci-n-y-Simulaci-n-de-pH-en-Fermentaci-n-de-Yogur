import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import simulationService from '../services/simulationService';
import theme from '../styles/theme';

export default function SimulacionScreen() {
  const [sustrato, setSustrato] = useState('vaca');
  const [masaInoculo, setMasaInoculo] = useState('18.75');
  const [temperatura, setTemperatura] = useState('42');
  const [errorValidacion, setErrorValidacion] = useState(null);

  const [resultado, setResultado] = useState(() =>
    simulationService.simularAcidificacion({
      tipoSustrato: 'vaca',
      masaInoculoG: 18.75,
      temperaturaC: 42,
      volumenMl: 250,
    })
  );

  const handleSimular = (nuevaMasa = masaInoculo, nuevaTemp = temperatura) => {
    const masa = parseFloat(nuevaMasa);
    const temp = parseFloat(nuevaTemp);

    if (isNaN(masa) || masa < 0.5 || masa > 50) {
      setErrorValidacion('Masa de inóculo inválida. Debe estar entre 0.5 g y 50 g (para 250 mL).');
      return;
    }
    if (isNaN(temp) || temp < 20 || temp > 52) {
      setErrorValidacion('Temperatura fuera de rango biológico. Debe estar entre 20 °C y 52 °C.');
      return;
    }

    setErrorValidacion(null);
    const res = simulationService.simularAcidificacion({
      tipoSustrato: sustrato,
      masaInoculoG: masa,
      temperaturaC: temp,
      volumenMl: 250,
    });
    setResultado(res);
  };

  const aplicarPresets = (masaPreset, tempPreset) => {
    setErrorValidacion(null);
    setMasaInoculo(String(masaPreset));
    setTemperatura(String(tempPreset));
    handleSimular(masaPreset, tempPreset);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Laboratorio de Alimentos - ULEAM</Text>
        <Text style={styles.title}>Simulador Cinético ("What-If")</Text>
        <Text style={styles.subtitle}>
          Calibrado con datos experimentales reales del Dr. Stalin Santacruz (250 g de leche de vaca con inóculo Chivería).
        </Text>
      </View>

      {/* Tarjeta de Configuración de Escenario */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Selección de Sustrato / Matriz</Text>
        <View style={styles.sustratoRow}>
          {['vaca', 'chocho', 'coco'].map((tipo) => (
            <Pressable
              key={tipo}
              style={[
                styles.btnPill,
                sustrato === tipo && styles.btnPillActive,
              ]}
              onPress={() => setSustrato(tipo)}
            >
              <Text
                style={[
                  styles.btnPillText,
                  sustrato === tipo && styles.btnPillTextActive,
                ]}
              >
                {tipo.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Atajos de Ensayos Experimentales Reales */}
        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.md }]}>
          2. Escenarios Experimentales del Cliente
        </Text>
        <View style={styles.presetsGrid}>
          <Pressable
            style={[styles.presetBtn, masaInoculo === '18.75' && temperatura === '42' && styles.presetBtnActive]}
            onPress={() => aplicarPresets(18.75, 42)}
          >
            <Text style={styles.presetTitle}>⭐ 42 °C / 7.5% Inóculo</Text>
            <Text style={styles.presetSub}>Óptimo laboratorio (2639 mPa·s)</Text>
          </Pressable>

          <Pressable
            style={[styles.presetBtn, masaInoculo === '6.25' && temperatura === '42' && styles.presetBtnActive]}
            onPress={() => aplicarPresets(6.25, 42)}
          >
            <Text style={styles.presetTitle}>🧪 42 °C / 2.5% Inóculo</Text>
            <Text style={styles.presetSub}>Lenta acidificación (1454 mPa·s)</Text>
          </Pressable>

          <Pressable
            style={[styles.presetBtn, masaInoculo === '18.75' && temperatura === '40' && styles.presetBtnActive]}
            onPress={() => aplicarPresets(18.75, 40)}
          >
            <Text style={styles.presetTitle}>⚠️ 40 °C / 7.5% Inóculo</Text>
            <Text style={styles.presetSub}>Baja temperatura (786 mPa·s)</Text>
          </Pressable>

          <Pressable
            style={[styles.presetBtn, masaInoculo === '18.75' && temperatura === '44' && styles.presetBtnActive]}
            onPress={() => aplicarPresets(18.75, 44)}
          >
            <Text style={styles.presetTitle}>🔥 44 °C / 7.5% Inóculo</Text>
            <Text style={styles.presetSub}>Estrés térmico (796 mPa·s)</Text>
          </Pressable>
        </View>

        {/* Inputs numéricos manuales */}
        <View style={styles.inputsRow}>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>Inóculo Chivería (g)</Text>
            <TextInput
              style={styles.input}
              value={masaInoculo}
              onChangeText={setMasaInoculo}
              keyboardType="numeric"
              placeholder="18.75"
            />
            <Text style={styles.inputHint}>250g leche: 7.5%=18.75g, 2.5%=6.25g</Text>
          </View>

          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>Temperatura (°C)</Text>
            <TextInput
              style={styles.input}
              value={temperatura}
              onChangeText={setTemperatura}
              keyboardType="numeric"
              placeholder="42"
            />
            <Text style={styles.inputHint}>Ventana óptima: 41 - 43 °C</Text>
          </View>
        </View>
        {errorValidacion && (
          <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#EF4444' }}>
            <Text style={{ color: '#991B1B', fontSize: 13, fontWeight: '600' }}>⚠️ {errorValidacion}</Text>
          </View>
        )}

        <Pressable style={styles.btnSimular} onPress={() => handleSimular()}>
          <Text style={styles.btnSimularText}>⚡ Ejecutar Simulación Cinética</Text>
        </Pressable>
      </View>

      {/* Alerta de Desviación Térmica */}
      {resultado.fueraDeRangoTermico && (
        <View style={styles.alertaCard}>
          <Text style={styles.alertaTitulo}>⚠️ ALERTA: DESVIACIÓN TÉRMICA DETECTADA</Text>
          <Text style={styles.alertaTexto}>{resultado.alertaTermica}</Text>
        </View>
      )}

      {/* Tarjeta de Predicción Reológica y Cinética */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Predicciones de Laboratorio Estimadas</Text>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Tiempo hasta pH 4.5</Text>
            <Text style={styles.kpiValor}>{resultado.tiempoEstimadoHoras} h</Text>
            <Text style={styles.kpiSub}>~{resultado.tiempoEstimadoCorteMinutos} minutos</Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Viscosidad Final</Text>
            <Text
              style={[
                styles.kpiValor,
                resultado.viscosidadEstimadaMpaS >= 2000
                  ? { color: theme.colors.success }
                  : resultado.viscosidadEstimadaMpaS < 1000
                  ? { color: theme.colors.danger }
                  : { color: theme.colors.info },
              ]}
            >
              {resultado.viscosidadEstimadaMpaS}
            </Text>
            <Text style={styles.kpiSub}>mPa·s (rotor 4, 60 rpm)</Text>
          </View>
        </View>

        <View style={styles.diagnosticoBox}>
          <Text style={styles.diagnosticoTexto}>{resultado.diagnosticoReologico}</Text>
        </View>
      </View>

      {/* Proyección Temporal de pH y Brix */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Curva Cinética Paso a Paso</Text>
        <View style={styles.tablaHeader}>
          <Text style={styles.th}>Tiempo</Text>
          <Text style={styles.th}>pH Est.</Text>
          <Text style={styles.th}>°Brix Est.</Text>
          <Text style={styles.th}>Estado</Text>
        </View>

        {resultado.puntos.map((pt, idx) => (
          <View key={idx} style={styles.tablaFila}>
            <Text style={styles.td}>{pt.horas} h ({pt.minutos}m)</Text>
            <Text style={[styles.td, pt.ph <= 4.6 && { color: theme.colors.danger, fontWeight: '700' }]}>
              {pt.ph.toFixed(2)}
            </Text>
            <Text style={styles.td}>{pt.brix}°</Text>
            <Text style={[styles.td, { fontSize: 11 }]}>
              {pt.estado}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  eyebrow: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  sectionTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  sustratoRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  btnPill: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  btnPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  btnPillText: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  btnPillTextActive: {
    color: theme.colors.surface,
  },
  presetsGrid: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  presetBtn: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  presetBtnActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  presetTitle: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.text,
  },
  presetSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  inputHint: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  btnSimular: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  btnSimularText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  alertaCard: {
    backgroundColor: theme.colors.warningSoft,
    borderColor: theme.colors.warning,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  alertaTitulo: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    fontWeight: '700',
    marginBottom: 2,
  },
  alertaTexto: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  kpiLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  kpiValor: {
    ...theme.typography.metric,
    color: theme.colors.primary,
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  diagnosticoBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  diagnosticoTexto: {
    ...theme.typography.caption,
    color: theme.colors.text,
    lineHeight: 18,
  },
  tablaHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  th: {
    flex: 1,
    textAlign: 'center',
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  tablaFila: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceMuted,
    paddingVertical: theme.spacing.xs,
  },
  td: {
    flex: 1,
    textAlign: 'center',
    ...theme.typography.caption,
    color: theme.colors.text,
  },
});
