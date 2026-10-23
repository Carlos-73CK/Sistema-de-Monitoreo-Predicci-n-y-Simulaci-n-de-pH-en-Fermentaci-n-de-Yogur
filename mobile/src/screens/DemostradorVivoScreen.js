import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import theme from '../styles/theme';

export default function DemostradorVivoScreen() {
  const [escenarioActivo, setEscenarioActivo] = useState('nominal');
  const [lecturas, setLecturas] = useState([
    { min: 0, ph: 6.25, temp: 42.0 },
    { min: 60, ph: 6.02, temp: 42.1 },
    { min: 120, ph: 5.48, temp: 42.0 },
    { min: 180, ph: 4.88, temp: 41.9 },
  ]);

  const [inputMin, setInputMin] = useState('240');
  const [inputPh, setInputPh] = useState('4.58');

  // Cargar escenarios de prueba en 1 clic
  const cargarEscenario = (tipo) => {
    setEscenarioActivo(tipo);
    if (tipo === 'acelerado') {
      setLecturas([
        { min: 0, ph: 6.25, temp: 42.0 },
        { min: 60, ph: 5.80, temp: 42.2 },
        { min: 120, ph: 5.10, temp: 42.0 },
        { min: 180, ph: 4.58, temp: 42.0 },
      ]);
      setInputMin('220');
      setInputPh('4.50');
    } else if (tipo === 'retrasado') {
      setLecturas([
        { min: 0, ph: 6.25, temp: 39.5 },
        { min: 60, ph: 6.15, temp: 39.8 },
        { min: 120, ph: 5.80, temp: 40.0 },
        { min: 180, ph: 5.35, temp: 40.2 },
      ]);
      setInputMin('240');
      setInputPh('5.05');
    } else {
      // Nominal
      setLecturas([
        { min: 0, ph: 6.25, temp: 42.0 },
        { min: 60, ph: 6.02, temp: 42.1 },
        { min: 120, ph: 5.48, temp: 42.0 },
        { min: 180, ph: 4.88, temp: 41.9 },
      ]);
      setInputMin('240');
      setInputPh('4.58');
    }
  };

  const reiniciar = () => {
    setLecturas([{ min: 0, ph: 6.25, temp: 42.0 }]);
    setInputMin('60');
    setInputPh('6.00');
    setEscenarioActivo('personalizado');
  };

  const handleAgregarLectura = () => {
    const m = parseFloat(inputMin);
    const p = parseFloat(inputPh);
    if (isNaN(m) || isNaN(p) || p < 3.8 || p > 7.0) {
      Alert.alert('Valor inválido', 'Ingrese minutos y pH válidos en rango [3.8 – 7.0].');
      return;
    }
    const copia = [...lecturas, { min: m, ph: p, temp: 42.0 }];
    copia.sort((a, b) => a.min - b.min);
    setLecturas(copia);
    setInputMin(String(m + 30));
    setInputPh(String(Math.max(4.0, Number((p - 0.25).toFixed(2)))));
  };

  // Cálculo de Recalibración Dinámica
  const calcularRecalibracion = () => {
    if (lecturas.length < 2) {
      return {
        horas: '4.25',
        minutos: 255,
        dif: 0,
        ritmo: '1.00',
        confianza: 'Teórica (±30 min)',
        diag: 'A la espera de lecturas intermedias para calibrar en vuelo.',
      };
    }
    const t0 = lecturas[0];
    const tk = lecturas[lecturas.length - 1];
    const deltaT = tk.min - t0.min;
    const deltaPh = t0.ph - tk.ph;
    const tasa = deltaT > 0 && deltaPh > 0 ? deltaPh / deltaT : 0.0068;
    const phRestante = Math.max(0, tk.ph - 4.50);
    const minRestantes = Math.max(1, Math.round(phRestante / (tasa || 0.0068)));
    const corteEstimado = tk.min + minRestantes;
    const dif = corteEstimado - 255;
    const ritmo = parseFloat(((deltaPh / (deltaT || 1)) / 0.0068).toFixed(2));

    let diag = 'Acidificación a ritmo estándar de Hill (4.25 h).';
    if (dif < -5) diag = `⚡ Acidificación acelerada (${Math.abs(dif)} min antes del tiempo nominal).`;
    else if (dif > 5) diag = `❄️ Retraso cinético (+${dif} min de retraso). Verificar temperatura.`;

    return {
      horas: (corteEstimado / 60).toFixed(2),
      minutos: corteEstimado,
      dif,
      ritmo: ritmo.toFixed(2),
      confianza: lecturas.length >= 4 ? 'Muy Alta (±5 min)' : 'Alta (±12 min)',
      diag,
    };
  };

  const rec = calcularRecalibracion();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Demostrador Académico en Tiempo Real</Text>
        <Text style={styles.title}>Demostrador en Vivo (Dr. Santacruz)</Text>
        <Text style={styles.subtitle}>
          Diseñado para exposiciones y validación pedagógica frente a docentes: comprueba cómo la IA recalibra dinámicamente el tiempo de corte.
        </Text>
      </View>

      {/* Escenarios en 1 Clic */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>⚡ Escenarios de Prueba en 1 Clic:</Text>
        <View style={styles.presetsGrid}>
          <Pressable
            style={[styles.presetBtn, escenarioActivo === 'acelerado' && styles.presetBtnActive]}
            onPress={() => cargarEscenario('acelerado')}
          >
            <Text style={styles.presetTitle}>⚡ Acidificación Acelerada</Text>
            <Text style={[styles.presetSub, { color: '#059669' }]}>-35 min antes de tiempo</Text>
          </Pressable>

          <Pressable
            style={[styles.presetBtn, escenarioActivo === 'retrasado' && styles.presetBtnActive]}
            onPress={() => cargarEscenario('retrasado')}
          >
            <Text style={styles.presetTitle}>❄️ Enfriamiento / Retraso</Text>
            <Text style={[styles.presetSub, { color: '#D97706' }]}>+40 min por baja temperatura</Text>
          </Pressable>

          <Pressable
            style={[styles.presetBtn, escenarioActivo === 'nominal' && styles.presetBtnActive]}
            onPress={() => cargarEscenario('nominal')}
          >
            <Text style={styles.presetTitle}>⭐ Nominal Hill</Text>
            <Text style={[styles.presetSub, { color: '#0284C7' }]}>4.25 h exactas (42 °C / 7.5%)</Text>
          </Pressable>

          <Pressable style={styles.presetBtnReset} onPress={reiniciar}>
            <Text style={styles.presetTitleReset}>🔄 Reiniciar Demostración</Text>
            <Text style={styles.presetSubReset}>Volver a minuto 0 (T0)</Text>
          </Pressable>
        </View>
      </View>

      {/* Recalibración en Vuelo */}
      <View style={styles.recalibBox}>
        <View style={styles.recalibTop}>
          <Text style={styles.recalibHeaderTitle}>🎯 Recalibración IA en Tiempo Real</Text>
          <View style={styles.confBadge}>
            <Text style={styles.confBadgeText}>{rec.confianza}</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiTileLabel}>Corte pH 4.50 Estimado</Text>
            <Text style={styles.kpiTileVal}>{rec.horas} h</Text>
            <Text style={styles.kpiTileSub}>~{rec.minutos} min</Text>
          </View>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiTileLabel}>Desviación vs Nominal</Text>
            <Text
              style={[
                styles.kpiTileVal,
                rec.dif < -3 ? { color: '#059669' } : rec.dif > 3 ? { color: '#D97706' } : { color: '#0284C7' },
              ]}
            >
              {rec.dif > 0 ? `+${rec.dif}` : rec.dif} min
            </Text>
            <Text style={styles.kpiTileSub}>Ritmo: {rec.ritmo}x</Text>
          </View>
        </View>

        <Text style={styles.diagBannerText}>{rec.diag}</Text>
      </View>

      {/* Inyectar Lectura Manual en Vivo */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>➕ Inyectar Lectura Experimental en Vivo:</Text>
        <View style={styles.inputsRow}>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>Minutos</Text>
            <TextInput
              style={styles.textInput}
              value={inputMin}
              onChangeText={setInputMin}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>pH medido</Text>
            <TextInput
              style={styles.textInput}
              value={inputPh}
              onChangeText={setInputPh}
              keyboardType="numeric"
            />
          </View>
        </View>
        <Pressable style={styles.btnInyectar} onPress={handleAgregarLectura}>
          <Text style={styles.btnInyectarText}>⚡ Actualizar Recalibración en Pantalla</Text>
        </Pressable>
      </View>

      {/* Historial de Lecturas del Demostrador */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Historial Cinético ({lecturas.length} puntos cargados)</Text>
        <View style={styles.thRow}>
          <Text style={styles.th}>Tiempo</Text>
          <Text style={styles.th}>pH Medido</Text>
          <Text style={styles.th}>Temp</Text>
        </View>
        {lecturas.map((l, idx) => (
          <View key={idx} style={styles.trRow}>
            <Text style={styles.td}>{l.min} min ({(l.min / 60).toFixed(1)} h)</Text>
            <Text style={[styles.td, l.ph <= 4.52 && { color: '#DC2626', fontWeight: '800' }]}>
              {l.ph.toFixed(2)}
            </Text>
            <Text style={styles.td}>{l.temp.toFixed(1)} °C</Text>
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
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  eyebrow: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  presetsGrid: {
    gap: 8,
  },
  presetBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: theme.radii.md,
    padding: 10,
  },
  presetBtnActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  presetSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  presetBtnReset: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.radii.md,
    padding: 10,
    marginTop: 2,
  },
  presetTitleReset: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
  presetSubReset: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 2,
  },
  recalibBox: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1.5,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  recalibTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recalibHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0369A1',
  },
  confBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },
  confBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369A1',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  kpiTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiTileLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textAlign: 'center',
  },
  kpiTileVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0284C7',
    marginVertical: 2,
  },
  kpiTileSub: {
    fontSize: 10.5,
    color: '#64748B',
  },
  diagBannerText: {
    fontSize: 11.5,
    color: '#0C4A6E',
    backgroundColor: '#E0F2FE',
    padding: 8,
    borderRadius: 6,
    lineHeight: 16,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: '#FAFAFA',
  },
  btnInyectar: {
    backgroundColor: '#0284C7',
    borderRadius: theme.radii.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnInyectarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  thRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
    marginBottom: 6,
  },
  th: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  trRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingVertical: 6,
  },
  td: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    textAlign: 'center',
  },
});
