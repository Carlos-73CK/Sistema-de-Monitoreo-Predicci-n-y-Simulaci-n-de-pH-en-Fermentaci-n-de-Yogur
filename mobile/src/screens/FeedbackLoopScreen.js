import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ensayosService from '../services/ensayosService';
import theme from '../styles/theme';
import FooterBar from '../components/common/FooterBar';

export default function FeedbackLoopScreen() {
  const [loteId, setLoteId] = useState('LOTE-EXP-2026-001');
  const [viscosidadFinal, setViscosidadFinal] = useState('2615');
  const [tempReal, setTempReal] = useState('42.0');
  const [masaInoculo, setMasaInoculo] = useState('18.75');

  const [mostrarPegado, setMostrarPegado] = useState(false);
  const [textoPegado, setTextoPegado] = useState('');

  const [filas, setFilas] = useState([
    { min: '0', ph: '6.25', temp: '42.0', brix: '10.5' },
    { min: '60', ph: '6.02', temp: '42.1', brix: '8.6' },
    { min: '180', ph: '4.82', temp: '42.0', brix: '6.6' },
    { min: '255', ph: '4.50', temp: '42.0', brix: '5.7' },
  ]);

  const [enviando, setEnviando] = useState(false);
  const [resultadoEntrenamiento, setResultadoEntrenamiento] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const cargarLoteEjemplo = () => {
    setLoteId('LOTE-EXP-CHV-' + Math.floor(100 + Math.random() * 900));
    setViscosidadFinal('2630');
    setTempReal('42.0');
    setMasaInoculo('18.75');
    setFilas([
      { min: '0', ph: '6.30', temp: '42.0', brix: '10.5' },
      { min: '60', ph: '6.05', temp: '42.0', brix: '8.8' },
      { min: '120', ph: '5.50', temp: '42.1', brix: '7.8' },
      { min: '180', ph: '4.85', temp: '42.0', brix: '6.7' },
      { min: '255', ph: '4.50', temp: '42.0', brix: '5.7' },
    ]);
    setErrorMsg('');
    setResultadoEntrenamiento(null);
  };

  const procesarTextoPegado = () => {
    const raw = textoPegado.trim();
    if (!raw) {
      Alert.alert('Texto vacío', 'Pegue los datos separados por coma o tabulación.');
      return;
    }

    const lineas = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const nuevasFilas = [];

    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      if (l.toLowerCase().includes('minuto') || l.toLowerCase().includes('ph')) continue;
      const partes = l.split(/[,;\t]+/).map((p) => p.trim());
      if (partes.length >= 2) {
        const m = partes[0];
        const p = partes[1];
        const t = partes.length >= 3 ? partes[2] : '42.0';
        const bx = partes.length >= 4 ? partes[3] : '';
        nuevasFilas.push({ min: m, ph: p, temp: t, brix: bx });
      }
    }

    if (nuevasFilas.length < 2) {
      Alert.alert('Datos insuficientes', 'Se requieren al menos 2 lecturas numéricas válidas.');
      return;
    }

    setFilas(nuevasFilas);
    setMostrarPegado(false);
    setTextoPegado('');
  };

  const agregarFila = () => {
    const ult = filas.length > 0 ? parseFloat(filas[filas.length - 1].min) || 0 : 0;
    setFilas([...filas, { min: String(ult + 30), ph: '4.55', temp: tempReal, brix: '' }]);
  };

  const eliminarFila = (idx) => {
    if (filas.length <= 2) {
      Alert.alert('Mínimo de lecturas', 'Se necesitan al menos 2 lecturas cronológicas para entrenar.');
      return;
    }
    setFilas(filas.filter((_, i) => i !== idx));
  };

  const actualizarFila = (idx, campo, valor) => {
    const copia = [...filas];
    copia[idx][campo] = valor;
    setFilas(copia);
  };

  const handleEnviarFeedback = async () => {
    setErrorMsg('');
    setResultadoEntrenamiento(null);

    const loteClean = loteId.trim();
    const visc = parseFloat(viscosidadFinal);
    const temp = parseFloat(tempReal);
    const masa = parseFloat(masaInoculo);

    if (!loteClean) {
      setErrorMsg('⚠️ Ingrese un código o identificador para el lote.');
      return;
    }
    if (isNaN(visc) || visc < 150 || visc > 5500) {
      setErrorMsg('⚠️ Ingrese una viscosidad final válida (protocolo Dr. Santacruz: [150 – 5500 mPa·s]).');
      return;
    }
    if (isNaN(temp) || temp < 20 || temp > 52) {
      setErrorMsg('⚠️ Temperatura fuera de rango biológico [20 – 52 °C].');
      return;
    }
    if (isNaN(masa) || masa < 0.5 || masa > 37.5) {
      setErrorMsg('⚠️ Masa de inóculo fuera de rango [0.5 – 37.5 g].');
      return;
    }

    const lecturasMapeadas = [];
    for (let i = 0; i < filas.length; i++) {
      const f = filas[i];
      const m = parseFloat(f.min);
      const p = parseFloat(f.ph);
      const t = parseFloat(f.temp) || temp;
      const bx = f.brix ? parseFloat(f.brix) : null;

      if (isNaN(m) || isNaN(p) || p < 3.8 || p > 7.2) {
        setErrorMsg(`⚠️ Lectura en fila ${i + 1} inválida: el pH debe estar entre 3.80 y 7.20.`);
        return;
      }

      lecturasMapeadas.push({
        tiempo_minutos: m,
        ph: p,
        temperatura: t,
        indice_refraccion: bx,
      });
    }

    try {
      setEnviando(true);
      const payload = {
        lote_id: loteClean,
        temperatura_c: temp,
        masa_inoculo_g: masa,
        volumen_ml: 250,
        viscosidad_final: visc,
        lecturas: lecturasMapeadas,
      };

      const res = await ensayosService.enviarFeedbackBatch(payload);
      if (res && res.success) {
        setResultadoEntrenamiento({
          lote: res.data?.lote_id || loteClean,
          muestras: res.data?.muestras_agregadas || lecturasMapeadas.length,
          metricas: res.data?.metricas_modelo || null,
        });
      } else {
        setErrorMsg('⚠️ ' + (res?.message || 'Error al incorporar lote en la IA.'));
      }
    } catch (err) {
      console.warn('[FeedbackLoop] Error:', err);
      const msg = err.response?.data?.message || 'No fue posible registrar el lote en el Feedback Loop.';
      setErrorMsg('⚠️ ' + msg);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Aprendizaje Continuo & Reentrenamiento</Text>
        <Text style={styles.title}>Feedback Loop (IA Adaptativa)</Text>
        <Text style={styles.subtitle}>
          Incorpora datos de nuevos lotes concluidos en el laboratorio para que la IA refine continuamente su modelo cinético y su precisión R².
        </Text>
      </View>

      {/* Botones de Acción Rápida */}
      <View style={styles.topActionsRow}>
        <Pressable
          style={styles.actionBtnGreen}
          onPress={() => setMostrarPegado(!mostrarPegado)}
        >
          <Text style={styles.actionBtnGreenText}>
            {mostrarPegado ? '✕ Ocultar Pegado CSV' : '📋 Pegar Tabla CSV / Excel'}
          </Text>
        </Pressable>

        <Pressable style={styles.actionBtnBlue} onPress={cargarLoteEjemplo}>
          <Text style={styles.actionBtnBlueText}>🧪 Cargar Lote de Prueba</Text>
        </Pressable>
      </View>

      {/* Panel Desplegable de Pegado CSV */}
      {mostrarPegado && (
        <View style={styles.pegadoCard}>
          <Text style={styles.pegadoTitle}>📥 Pegar Valores de Excel o CSV:</Text>
          <Text style={styles.pegadoHint}>
            Columnas: <code>minutos, pH, temperatura, °Brix (opcional)</code> separados por coma o tabulación.
          </Text>
          <TextInput
            style={styles.pegadoTextArea}
            multiline
            numberOfLines={4}
            placeholder="0, 6.25, 42.0, 10.5&#10;60, 6.00, 42.0, 8.5&#10;180, 4.85, 42.0, 6.5&#10;255, 4.50, 42.0, 5.7"
            value={textoPegado}
            onChangeText={setTextoPegado}
          />
          <Pressable style={styles.btnParsear} onPress={procesarTextoPegado}>
            <Text style={styles.btnParsearText}>✅ Rellenar Tabla Automáticamente</Text>
          </Pressable>
        </View>
      )}

      {/* Banners de Error o Éxito */}
      {errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {resultadoEntrenamiento ? (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>🎉 ¡Lote Incorporado al Modelo Exitosamente!</Text>
          <Text style={styles.successDesc}>
            Se agregaron {resultadoEntrenamiento.muestras} muestras experimentales del lote "{resultadoEntrenamiento.lote}". El modelo Hill de SQLite ha sido recalibrado en vivo.
          </Text>
        </View>
      ) : null}

      {/* Parámetros del Lote */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Parámetros del Lote Concluido</Text>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Código de Lote</Text>
            <TextInput
              style={styles.input}
              value={loteId}
              onChangeText={setLoteId}
              placeholder="Ej. LOTE-EXP-2026-001"
            />
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Viscosidad Final (mPa·s) *</Text>
            <TextInput
              style={styles.input}
              value={viscosidadFinal}
              onChangeText={setViscosidadFinal}
              keyboardType="numeric"
              placeholder="Ej. 2615"
            />
          </View>
        </View>

        <View style={[styles.row, { marginTop: 10 }]}>
          <View style={styles.col}>
            <Text style={styles.label}>Temperatura Real (°C)</Text>
            <TextInput
              style={styles.input}
              value={tempReal}
              onChangeText={setTempReal}
              keyboardType="numeric"
              placeholder="42.0"
            />
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Inóculo Chivería (g)</Text>
            <TextInput
              style={styles.input}
              value={masaInoculo}
              onChangeText={setMasaInoculo}
              keyboardType="numeric"
              placeholder="18.75"
            />
          </View>
        </View>
      </View>

      {/* Tabla de Lecturas Periódicas */}
      <View style={styles.card}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.sectionTitle}>2. Lecturas Cronológicas del Ensayo</Text>
          <Pressable style={styles.btnAddRow} onPress={agregarFila}>
            <Text style={styles.btnAddRowText}>+ Agregar Fila</Text>
          </Pressable>
        </View>

        <View style={styles.thRow}>
          <Text style={styles.th}>Minuto</Text>
          <Text style={styles.th}>pH Medido</Text>
          <Text style={styles.th}>Temp (°C)</Text>
          <Text style={styles.th}>°Brix</Text>
          <Text style={[styles.th, { flex: 0.5 }]}>✕</Text>
        </View>

        {filas.map((f, idx) => (
          <View key={idx} style={styles.trRow}>
            <TextInput
              style={[styles.tableInput, { flex: 1 }]}
              value={f.min}
              onChangeText={(v) => actualizarFila(idx, 'min', v)}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.tableInput, { flex: 1, color: '#0284C7', fontWeight: '800' }]}
              value={f.ph}
              onChangeText={(v) => actualizarFila(idx, 'ph', v)}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.tableInput, { flex: 1 }]}
              value={f.temp}
              onChangeText={(v) => actualizarFila(idx, 'temp', v)}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.tableInput, { flex: 1 }]}
              value={f.brix}
              onChangeText={(v) => actualizarFila(idx, 'brix', v)}
              keyboardType="numeric"
              placeholder="--"
            />
            <Pressable style={styles.delRowBtn} onPress={() => eliminarFila(idx)}>
              <Text style={styles.delRowBtnText}>✕</Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          style={[styles.btnEnviarFeedback, enviando && styles.btnDisabled]}
          onPress={handleEnviarFeedback}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.btnEnviarFeedbackText}>
              🧠 Incorporar al Feedback Loop y Reentrenar IA
            </Text>
          )}
        </Pressable>
      </View>
      <FooterBar />
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
  topActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  actionBtnGreen: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: theme.radii.sm,
    paddingVertical: 9,
    alignItems: 'center',
  },
  actionBtnGreenText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnBlue: {
    flex: 1,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#7DD3FC',
    borderRadius: theme.radii.sm,
    paddingVertical: 9,
    alignItems: 'center',
  },
  actionBtnBlueText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '700',
  },
  pegadoCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  pegadoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  pegadoHint: {
    fontSize: 11,
    color: '#64748B',
    marginVertical: 4,
  },
  pegadoTextArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#FFFFFF',
    fontFamily: 'monospace',
    fontSize: 12,
    color: theme.colors.text,
  },
  btnParsear: {
    backgroundColor: '#059669',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btnParsearText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#DCFCE7',
    borderColor: '#4ADE80',
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  successTitle: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  successDesc: {
    color: '#15803D',
    fontSize: 12,
    lineHeight: 16,
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: theme.colors.text,
    backgroundColor: '#FAFAFA',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  btnAddRow: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnAddRowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  thRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
    marginBottom: 6,
    gap: 6,
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
    gap: 6,
    marginBottom: 6,
    alignItems: 'center',
  },
  tableInput: {
    height: 38,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 13,
    textAlign: 'center',
    backgroundColor: '#FAFAFA',
  },
  delRowBtn: {
    flex: 0.5,
    height: 38,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  delRowBtnText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '800',
  },
  btnEnviarFeedback: {
    backgroundColor: '#0284C7',
    borderRadius: theme.radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
    ...theme.shadows.card,
  },
  btnEnviarFeedbackText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
