import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ensayosService from '../services/ensayosService';
import theme from '../styles/theme';

export default function MonitoreoScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);

  // Datos iniciales de ensayo por parámetros o predeterminado
  const paramEnsayo = route?.params?.ensayo || {};
  const loteIdInicial = paramEnsayo.codigo || paramEnsayo.loteId || paramEnsayo.lote_id || 'LOTE-CHV-001';

  const [loteId, setLoteId] = useState(loteIdInicial);
  const [ensayoInfo, setEnsayoInfo] = useState({
    lote_id: loteIdInicial,
    investigador: paramEnsayo.investigador || user?.nombre || 'Carlos Delgado',
    tipo_sustrato: paramEnsayo.tipoSustrato || 'vaca',
    tipo_azucar: paramEnsayo.tipoAzucar || 'lactosa',
    temperatura_c: paramEnsayo.temperaturaObjetivo || 42.0,
    masa_inoculo_g: paramEnsayo.masaInoculoG || 18.75,
    volumen_ml: paramEnsayo.volumenMl || 250,
  });

  const [lecturas, setLecturas] = useState([
    { tiempo_minutos: 0, ph: 6.68, temperatura: 42.0, indice_refraccion: 10.5 },
    { tiempo_minutos: 60, ph: 6.20, temperatura: 42.1, indice_refraccion: 9.8 },
    { tiempo_minutos: 120, ph: 5.45, temperatura: 41.8, indice_refraccion: 8.6 },
    { tiempo_minutos: 180, ph: 4.85, temperatura: 42.0, indice_refraccion: 7.2 },
  ]);

  const [cargandoLote, setCargandoLote] = useState(false);
  const [guardandoLectura, setGuardandoLectura] = useState(false);

  // Inputs para nueva lectura periódica
  const [minutosInput, setMinutosInput] = useState('240');
  const [phInput, setPhInput] = useState('4.58');
  const [tempInput, setTempInput] = useState('42.0');
  const [brixInput, setBrixInput] = useState('6.0');

  // Input para viscosidad final
  const [viscosidadFinalInput, setViscosidadFinalInput] = useState('2639');
  const [ensayoFinalizado, setEnsayoFinalizado] = useState(false);

  // Recalibración IA en vuelo
  const [estimacion, setEstimacion] = useState({
    tiempoCorteHoras: 4.25,
    tiempoCorteMinutos: 255,
    diferenciaMinutos: 0,
    ritmo: 1.0,
    confianza: 'Alta (± 10 min)',
    diagnostico: 'Acidificación a ritmo nominal estándar de laboratorio.',
  });

  // Carga reactiva del lote desde SQLite
  const cargarDatosLote = useCallback(async () => {
    try {
      setCargandoLote(true);
      const data = await ensayosService.getEnsayoPorLoteId(loteId);
      if (data) {
        setEnsayoInfo({
          lote_id: data.lote_id || loteId,
          investigador: data.investigador || ensayoInfo.investigador,
          tipo_sustrato: data.tipo_sustrato || ensayoInfo.tipo_sustrato,
          tipo_azucar: data.tipo_azucar || ensayoInfo.tipo_azucar,
          temperatura_c: Number(data.temperatura_c || 42.0),
          masa_inoculo_g: Number(data.masa_inoculo_g || 18.75),
          volumen_ml: Number(data.volumen_ml || 250),
        });

        if (Array.isArray(data.lecturas) && data.lecturas.length > 0) {
          setLecturas(data.lecturas);
          sugerirProximaLectura(data.lecturas);
        }
      }
    } catch (err) {
      console.warn('[Monitoreo] Usando datos locales de ensayo:', err.message);
    } finally {
      setCargandoLote(false);
    }
  }, [loteId]);

  useEffect(() => {
    cargarDatosLote();
  }, [cargarDatosLote]);

  // Recalibración dinámica en vuelo basada en las lecturas
  useEffect(() => {
    recalcularCineticas(lecturas);
  }, [lecturas]);

  const sugerirProximaLectura = (lista) => {
    if (!lista || lista.length === 0) return;
    const ult = lista[lista.length - 1];
    const ultMin = ult.tiempo_minutos ?? ult.minutos ?? 0;
    const proxMin = Math.min(600, ultMin + (ultMin < 180 ? 60 : 30));
    setMinutosInput(String(proxMin));
    const ultPh = ult.ph ?? 6.5;
    const phSugerido = Math.max(4.0, Number((ultPh - 0.28).toFixed(2)));
    setPhInput(String(phSugerido));
  };

  const recalcularCineticas = (lista) => {
    if (!lista || lista.length < 2) {
      setEstimacion({
        tiempoCorteHoras: 4.25,
        tiempoCorteMinutos: 255,
        diferenciaMinutos: 0,
        ritmo: 1.0,
        confianza: 'Estimación Teórica (± 30 min)',
        diagnostico: 'A la espera de lecturas a 60 y 120 min para calibrar en vuelo.',
      });
      return;
    }

    const t0 = lista[0];
    const tk = lista[lista.length - 1];
    const t0Min = t0.tiempo_minutos ?? t0.minutos ?? 0;
    const tkMin = tk.tiempo_minutos ?? tk.minutos ?? 0;

    if (tk.ph <= 4.50) {
      setEstimacion({
        tiempoCorteHoras: parseFloat((tkMin / 60).toFixed(2)),
        tiempoCorteMinutos: tkMin,
        diferenciaMinutos: tkMin - 255,
        ritmo: 1.0,
        confianza: 'Corte Alcanzado (100%)',
        diagnostico: '🛑 ¡Punto de corte crítico pH 4.50 alcanzado! Suspender incubación y medir viscosidad.',
      });
      return;
    }

    const deltaT = tkMin - t0Min;
    const deltaPh = t0.ph - tk.ph;
    const tasa = deltaT > 0 && deltaPh > 0 ? deltaPh / deltaT : 0.0068;
    const phRestante = Math.max(0, tk.ph - 4.50);
    const minRestantes = Math.max(1, Math.round(phRestante / (tasa || 0.0068)));
    const corteEstimado = tkMin + minRestantes;
    const dif = corteEstimado - 255;
    const ritmo = parseFloat(((deltaPh / (deltaT || 1)) / 0.0068).toFixed(2));

    let confianza = 'Baja (± 25 min)';
    if (lista.length >= 4 || tkMin >= 180) confianza = 'Muy Alta (± 5 min)';
    else if (lista.length >= 3 || tkMin >= 120) confianza = 'Alta (± 10 min)';
    else if (lista.length >= 2) confianza = 'Media (± 18 min)';

    let diagnostico = 'Acidificación a ritmo estándar nominal de laboratorio.';
    if (dif < -5) diagnostico = `⚡ Acidificación acelerada (${Math.abs(dif)} min antes). Vigilar baño maría.`;
    else if (dif > 5) diagnostico = `❄️ Acidificación ralentizada (+${dif} min de retraso). Verificar temperatura.`;

    setEstimacion({
      tiempoCorteHoras: parseFloat((corteEstimado / 60).toFixed(2)),
      tiempoCorteMinutos: corteEstimado,
      diferenciaMinutos: dif,
      ritmo: ritmo > 0 ? ritmo : 1.0,
      confianza,
      diagnostico,
    });
  };

  const handleAgregarLectura = async () => {
    const min = parseFloat(minutosInput);
    const ph = parseFloat(phInput);
    const temp = parseFloat(tempInput) || ensayoInfo.temperatura_c;
    const brix = brixInput ? parseFloat(brixInput) : null;

    if (isNaN(min) || min < 0) {
      Alert.alert('Minutos inválidos', 'Por favor ingrese un tiempo en minutos válido (>= 0).');
      return;
    }
    if (isNaN(ph) || ph < 3.8 || ph > 7.2) {
      Alert.alert('pH fuera de rango', 'El pH medido debe encontrarse dentro del rango biológico [3.80 – 7.20].');
      return;
    }

    try {
      setGuardandoLectura(true);
      const nuevaLectura = {
        minutos: min,
        tiempo_minutos: min,
        ph,
        temperatura: temp,
        indice_refraccion: brix,
      };

      // Intentar persistir en SQLite
      try {
        await ensayosService.agregarLectura(loteId, nuevaLectura);
      } catch (e) {
        console.warn('[Monitoreo] Guardado local de lectura:', e.message);
      }

      const copia = [...lecturas];
      const idxExist = copia.findIndex((l) => (l.tiempo_minutos ?? l.minutos) === min);
      if (idxExist >= 0) {
        copia[idxExist] = nuevaLectura;
      } else {
        copia.push(nuevaLectura);
      }
      copia.sort((a, b) => (a.tiempo_minutos ?? a.minutos) - (b.tiempo_minutos ?? b.minutos));
      setLecturas(copia);
      sugerirProximaLectura(copia);

      if (ph <= 4.50) {
        Alert.alert(
          '🛑 ¡pH DE CORTE 4.50 ALCANZADO!',
          'Se ha cumplido el punto crítico fijado por el Dr. Stalin Santacruz. Suspenda la incubación y registre la viscosidad final obligatoria.'
        );
      }
    } catch (err) {
      console.error('Error al agregar lectura:', err);
    } finally {
      setGuardandoLectura(false);
    }
  };

  const handleEliminarLectura = async (minuto) => {
    try {
      try {
        await ensayosService.eliminarLectura(loteId, minuto);
      } catch (_) {}

      const filtradas = lecturas.filter((l) => (l.tiempo_minutos ?? l.minutos) !== minuto);
      setLecturas(filtradas);
    } catch (err) {
      console.error('Error al eliminar lectura:', err);
    }
  };

  const handleFinalizarEnsayo = () => {
    const visc = parseFloat(viscosidadFinalInput);
    if (isNaN(visc) || visc <= 0) {
      Alert.alert('Viscosidad requerida', 'El registro de viscosidad final es obligatorio según el protocolo del Dr. Stalin Santacruz.');
      return;
    }

    setEnsayoFinalizado(true);
    Alert.alert(
      '✅ Ensayo Concluido',
      `Fermentación culminada exitosamente. Viscosidad final registrada: ${visc} mPa·s (rotor 4, 60 rpm).`,
      [
        {
          text: 'Ver en Ensayos Archivados',
          onPress: () => navigation.navigate('EnsayosArchivados'),
        },
      ]
    );
  };

  const handleExportar = async (formato) => {
    try {
      const data = await ensayosService.exportarEnsayo(loteId, formato);
      if (Platform.OS === 'web') {
        const mime = formato === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json';
        const content = formato === 'csv' ? data : JSON.stringify(data, null, 2);
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${loteId}_${formato}.${formato}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        Alert.alert(`Exportación ${formato.toUpperCase()}`, `Datos de ${loteId} preparados exitosamente.`);
      }
    } catch (err) {
      Alert.alert('Error de exportación', 'No se pudo exportar el ensayo.');
    }
  };

  // Última lectura
  const ult = lecturas.length > 0 ? lecturas[lecturas.length - 1] : null;
  const phActual = ult ? ult.ph : 6.5;
  const tempActual = ult ? ult.temperatura : ensayoInfo.temperatura_c;
  const phCorteAlcanzado = phActual <= 4.5;
  const fueraDeRangoTermico = tempActual < 41.0 || tempActual > 43.0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Encabezado del Ensayo Activo */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderTop}>
          <View>
            <Text style={styles.eyebrow}>Monitoreo Cinético en Vivo</Text>
            <Text style={styles.loteTitle}>{ensayoInfo.lote_id}</Text>
          </View>
          <View style={styles.exportBadges}>
            <Pressable style={styles.exportPill} onPress={() => handleExportar('csv')}>
              <Text style={styles.exportPillText}>📥 CSV</Text>
            </Pressable>
            <Pressable style={styles.exportPill} onPress={() => handleExportar('json')}>
              <Text style={styles.exportPillText}>📄 JSON</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.subMeta}>
          👤 Responsable: {ensayoInfo.investigador} • Matriz: {String(ensayoInfo.tipo_sustrato).toUpperCase()} ({String(ensayoInfo.tipo_azucar).toUpperCase()})
          • Temp: {ensayoInfo.temperatura_c} °C • Inóculo: {ensayoInfo.masa_inoculo_g} g
        </Text>
      </View>

      {/* Alertas Biológicas */}
      {fueraDeRangoTermico && (
        <View style={styles.alertaTermica}>
          <Text style={styles.alertaTermicaTitulo}>⚠️ ALERTA DE CONTROL TÉRMICO</Text>
          <Text style={styles.alertaTermicaTexto}>
            La temperatura medida ({tempActual} °C) está fuera del rango óptimo de fermentación (41.0 °C – 43.0 °C). Ajuste el baño termostático.
          </Text>
        </View>
      )}

      {phCorteAlcanzado && (
        <View style={styles.alertaCorte}>
          <Text style={styles.alertaCorteTitulo}>🛑 ¡pH DE CORTE (4.50) ALCANZADO!</Text>
          <Text style={styles.alertaCorteTexto}>
            La acidificación láctea ha concluido. Suspenda la incubación en caliente y registre la viscosidad final obligatoria.
          </Text>
        </View>
      )}

      {/* KPIs Actuales */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>pH Actual</Text>
          <Text style={[styles.kpiVal, phCorteAlcanzado && { color: '#DC2626' }]}>
            {phActual.toFixed(2)}
          </Text>
          <Text style={styles.kpiSub}>Corte crítico: pH 4.50</Text>
        </View>

        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>Temperatura</Text>
          <Text
            style={[
              styles.kpiVal,
              fueraDeRangoTermico ? { color: '#D97706' } : { color: '#16A34A' },
            ]}
          >
            {tempActual.toFixed(1)} °C
          </Text>
          <Text style={styles.kpiSub}>Óptimo ULEAM: 42.0 °C</Text>
        </View>
      </View>

      {/* Tarjeta de Recalibración IA en Vuelo */}
      <View style={styles.recalibCard}>
        <View style={styles.recalibHeader}>
          <Text style={styles.recalibTitle}>🎯 Recalibración IA en Vuelo (Hill)</Text>
          <View style={styles.recalibBadge}>
            <Text style={styles.recalibBadgeText}>{estimacion.confianza}</Text>
          </View>
        </View>

        <View style={styles.recalibGrid}>
          <View style={styles.recalibItem}>
            <Text style={styles.recalibItemLabel}>Corte pH 4.50 Proyectado</Text>
            <Text style={styles.recalibItemVal}>{estimacion.tiempoCorteHoras} h</Text>
            <Text style={styles.recalibItemSub}>~{estimacion.tiempoCorteMinutos} minutos</Text>
          </View>

          <View style={styles.recalibItem}>
            <Text style={styles.recalibItemLabel}>Desviación vs Nominal</Text>
            <Text
              style={[
                styles.recalibItemVal,
                estimacion.diferenciaMinutos < -3
                  ? { color: '#059669' }
                  : estimacion.diferenciaMinutos > 3
                  ? { color: '#D97706' }
                  : { color: '#0284C7' },
              ]}
            >
              {estimacion.diferenciaMinutos > 0 ? `+${estimacion.diferenciaMinutos}` : estimacion.diferenciaMinutos} min
            </Text>
            <Text style={styles.recalibItemSub}>Ritmo: {estimacion.ritmo}x</Text>
          </View>
        </View>

        <Text style={styles.recalibDiagText}>{estimacion.diagnostico}</Text>
      </View>

      {/* Formulario de Nueva Lectura Periódica */}
      {!ensayoFinalizado && (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Registrar Nueva Lectura en SQLite</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>Minutos</Text>
              <TextInput
                style={styles.textInput}
                value={minutosInput}
                onChangeText={setMinutosInput}
                keyboardType="numeric"
                placeholder="240"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>pH medido</Text>
              <TextInput
                style={styles.textInput}
                value={phInput}
                onChangeText={setPhInput}
                keyboardType="numeric"
                placeholder="4.60"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>Temp (°C)</Text>
              <TextInput
                style={styles.textInput}
                value={tempInput}
                onChangeText={setTempInput}
                keyboardType="numeric"
                placeholder="42.0"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>°Brix</Text>
              <TextInput
                style={styles.textInput}
                value={brixInput}
                onChangeText={setBrixInput}
                keyboardType="numeric"
                placeholder="6.0"
              />
            </View>
          </View>

          <Pressable
            style={[styles.btnGuardarLectura, guardandoLectura && styles.btnDisabled]}
            onPress={handleAgregarLectura}
            disabled={guardandoLectura}
          >
            {guardandoLectura ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnGuardarLecturaText}>➕ Guardar Lectura en SQLite</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* Cierre y Viscosidad Final Obligatoria */}
      {!ensayoFinalizado && (
        <View style={styles.cierreCard}>
          <Text style={styles.sectionTitle}>Corte & Viscosidad Final (Dr. Stalin Santacruz)</Text>
          <Text style={styles.cierreDesc}>
            Al alcanzar el corte en pH 4.50, registre obligatoriamente la viscosidad final (Brookfield rotor 4, 60 rpm):
          </Text>

          <View style={styles.cierreRow}>
            <TextInput
              style={[styles.textInput, { flex: 1, marginRight: 8 }]}
              value={viscosidadFinalInput}
              onChangeText={setViscosidadFinalInput}
              keyboardType="numeric"
              placeholder="Viscosidad (mPa·s / cP)"
            />
            <Pressable style={styles.btnFinalizar} onPress={handleFinalizarEnsayo}>
              <Text style={styles.btnFinalizarText}>🏁 Concluir Ensayo</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Historial de Lecturas Cinéticas */}
      <View style={styles.historialCard}>
        <Text style={styles.sectionTitle}>
          Historial de Lecturas Registradas ({lecturas.length})
        </Text>

        <View style={styles.tablaHeader}>
          <Text style={styles.th}>Tiempo</Text>
          <Text style={styles.th}>pH</Text>
          <Text style={styles.th}>Temp</Text>
          <Text style={styles.th}>°Brix</Text>
          <Text style={[styles.th, { flex: 0.6 }]}>Acción</Text>
        </View>

        {lecturas.map((item, idx) => {
          const m = item.tiempo_minutos ?? item.minutos;
          const ph = item.ph;
          const t = item.temperatura ?? 42.0;
          const bx = item.indice_refraccion;

          return (
            <View key={idx} style={styles.tablaFila}>
              <Text style={styles.td}>{m} min ({(m / 60).toFixed(1)} h)</Text>
              <Text
                style={[
                  styles.td,
                  { fontWeight: '700', color: ph <= 4.50 ? '#DC2626' : '#0284C7' },
                ]}
              >
                {ph.toFixed(2)}
              </Text>
              <Text style={styles.td}>{t.toFixed(1)} °C</Text>
              <Text style={styles.td}>{bx !== null && bx !== undefined ? `${bx}°Bx` : '--'}</Text>
              <View style={[styles.td, { flex: 0.6, alignItems: 'center' }]}>
                {idx > 0 ? (
                  <Pressable
                    style={styles.delBtn}
                    onPress={() => handleEliminarLectura(m)}
                  >
                    <Text style={styles.delBtnText}>✕</Text>
                  </Pressable>
                ) : (
                  <Text style={{ fontSize: 10, color: '#94A3B8' }}>T0</Text>
                )}
              </View>
            </View>
          );
        })}
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
  cardHeader: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    textTransform: 'uppercase',
  },
  loteTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  exportBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  exportPill: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exportPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  subMeta: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 2,
  },
  alertaTermica: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  alertaTermicaTitulo: {
    color: '#B45309',
    fontWeight: '800',
    fontSize: 12.5,
    marginBottom: 2,
  },
  alertaTermicaTexto: {
    color: '#92400E',
    fontSize: 12,
    lineHeight: 16,
  },
  alertaCorte: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1.5,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  alertaCorteTitulo: {
    color: '#B91C1C',
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 2,
  },
  alertaCorteTexto: {
    color: '#7F1D1D',
    fontSize: 12,
    lineHeight: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  kpiVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0284C7',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  recalibCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1.5,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  recalibHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recalibTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  recalibBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },
  recalibBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369A1',
  },
  recalibGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  recalibItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.sm,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recalibItemLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '700',
    textAlign: 'center',
  },
  recalibItemVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0284C7',
    marginVertical: 2,
  },
  recalibItemSub: {
    fontSize: 10,
    color: '#64748B',
  },
  recalibDiagText: {
    fontSize: 11.5,
    color: '#0C4A6E',
    backgroundColor: '#E0F2FE',
    padding: 8,
    borderRadius: 6,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 3,
  },
  textInput: {
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 10,
    fontSize: 13,
    color: theme.colors.text,
    backgroundColor: '#FAFAFA',
  },
  btnGuardarLectura: {
    backgroundColor: '#0284C7',
    borderRadius: theme.radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  btnGuardarLecturaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  cierreCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cierreDesc: {
    fontSize: 11.5,
    color: '#92400E',
    marginBottom: 8,
    lineHeight: 16,
  },
  cierreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnFinalizar: {
    backgroundColor: '#D97706',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radii.md,
  },
  btnFinalizarText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  historialCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  tablaHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
    marginBottom: 4,
  },
  tablaFila: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingVertical: 6,
    alignItems: 'center',
  },
  th: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  td: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    textAlign: 'center',
  },
  delBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  delBtnText: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '700',
  },
});
