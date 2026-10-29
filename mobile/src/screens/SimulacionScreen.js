import React, { useState, useContext, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import HeaderBar from '../components/common/HeaderBar';
import FooterBar from '../components/common/FooterBar';
import ScreenHeader from '../components/common/ScreenHeader';
import RheologyMeter from '../components/common/RheologyMeter';
import KineticCurveChart from '../components/common/KineticCurveChart';
import ScientificIcon from '../components/common/ScientificIcons';
import simulationService from '../services/simulationService';
import ensayosService from '../services/ensayosService';
import theme from '../styles/theme';

export default function SimulacionScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  // Parámetros de Simulación What-If
  const [loteNombre, setLoteNombre] = useState('LOTE-SIM-' + Math.floor(100 + Math.random() * 900));
  const [sustrato, setSustrato] = useState('vaca');
  const [tipoAzucar, setTipoAzucar] = useState('lactosa');
  const [masaInoculo, setMasaInoculo] = useState('18.75');
  const [temperatura, setTemperatura] = useState('42');
  const [volumen, setVolumen] = useState('250');
  const [superponerOptimo, setSuperponerOptimo] = useState(true);

  const [cargandoSim, setCargandoSim] = useState(false);
  const [guardandoLote, setGuardandoLote] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState(null);

  const [resultado, setResultado] = useState(() =>
    simulationService.simularAcidificacion({
      tipoSustrato: 'vaca',
      tipoAzucar: 'lactosa',
      masaInoculoG: 18.75,
      temperaturaC: 42,
      volumenMl: 250,
    })
  );

  const handleSimular = (
    nuevaMasa = masaInoculo,
    nuevaTemp = temperatura,
    nuevoSustrato = sustrato,
    nuevoAzucar = tipoAzucar,
    nuevoVol = volumen
  ) => {
    const masa = parseFloat(nuevaMasa);
    const temp = parseFloat(nuevaTemp);
    const vol = parseFloat(nuevoVol);

    if (isNaN(masa) || masa < 0.5 || masa > 50) {
      setErrorValidacion('Masa de inóculo inválida. Debe estar entre 0.5 g y 50 g.');
      return;
    }
    if (isNaN(temp) || temp < 20 || temp > 52) {
      setErrorValidacion('Temperatura fuera de rango biológico (20 °C – 52 °C).');
      return;
    }
    if (isNaN(vol) || vol < 50 || vol > 2000) {
      setErrorValidacion('El volumen debe estar entre 50 mL y 2000 mL.');
      return;
    }

    setErrorValidacion(null);

    const res = simulationService.simularAcidificacion({
      tipoSustrato: nuevoSustrato,
      tipoAzucar: nuevoAzucar,
      masaInoculoG: masa,
      temperaturaC: temp,
      volumenMl: vol,
    });
    setResultado(res);
  };

  const cambiarSustrato = (tipo) => {
    setSustrato(tipo);
    const azucarSugerido = tipo === 'vaca' ? 'lactosa' : 'sacarosa';
    setTipoAzucar(azucarSugerido);
    handleSimular(masaInoculo, temperatura, tipo, azucarSugerido, volumen);
  };

  const cambiarAzucar = (azucar) => {
    setTipoAzucar(azucar);
    handleSimular(masaInoculo, temperatura, sustrato, azucar, volumen);
  };

  const aplicarPresets = (masaPreset, tempPreset) => {
    setErrorValidacion(null);
    setMasaInoculo(String(masaPreset));
    setTemperatura(String(tempPreset));
    handleSimular(masaPreset, tempPreset, sustrato, tipoAzucar, volumen);
  };

  const ajustarMasa = (delta) => {
    const actual = parseFloat(masaInoculo) || 18.75;
    const nuevo = Math.max(0.5, Math.min(37.5, Math.round((actual + delta) * 100) / 100));
    setMasaInoculo(String(nuevo));
    handleSimular(nuevo, temperatura, sustrato, tipoAzucar, volumen);
  };

  const ajustarTemp = (delta) => {
    const actual = parseFloat(temperatura) || 42;
    const nuevo = Math.max(20, Math.min(52, Math.round((actual + delta) * 10) / 10));
    setTemperatura(String(nuevo));
    handleSimular(masaInoculo, nuevo, sustrato, tipoAzucar, volumen);
  };

  const handleCrearEnsayoDesdeSimulacion = async () => {
    if (!loteNombre.trim()) {
      Alert.alert('Código requerido', 'Por favor ingrese un código o nombre para el ensayo.');
      return;
    }

    try {
      setGuardandoLote(true);
      const masaNum = parseFloat(masaInoculo);
      const tempNum = parseFloat(temperatura);
      const volNum = parseFloat(volumen);

      const nuevoEnsayo = await ensayosService.crearEnsayo({
        lote_id: loteNombre.trim(),
        investigador: user?.nombre || 'Investigador ULEAM',
        usuario_email: user?.email,
        usuario_id: user?.id,
        tipo_sustrato: sustrato,
        tipo_azucar: tipoAzucar,
        temperatura_c: tempNum,
        masa_inoculo_g: masaNum,
        volumen_ml: volNum,
      });

      Alert.alert(
        '¡Ensayo Creado en SQLite!',
        `El lote "${loteNombre}" se guardó exitosamente. Pasando a la vista de monitoreo en vivo...`,
        [
          {
            text: 'Ir a Monitoreo',
            onPress: () =>
              navigation.navigate('Monitoreo', {
                ensayo: {
                  id: nuevoEnsayo.id,
                  codigo: loteNombre.trim(),
                  loteId: loteNombre.trim(),
                  tipoSustrato: sustrato,
                  masaInoculoG: masaNum,
                  temperaturaObjetivo: tempNum,
                },
              }),
          },
        ]
      );
    } catch (err) {
      console.error('Error al guardar ensayo:', err);
      Alert.alert('Error', 'No fue posible guardar el ensayo en la base de datos local SQLite.');
    } finally {
      setGuardandoLote(false);
    }
  };

  const pctInoculo = ((parseFloat(masaInoculo) || 0) / (parseFloat(volumen) || 250) * 100).toFixed(2);

  return (
    <View style={styles.screen}>
      <HeaderBar navigation={navigation} activeTab="Simulacion" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.desktopContainer}>
          {/* Encabezado Institucional con Navegación y Retorno */}
          <ScreenHeader
            title="Simulador Cinético Hill ('What-If')"
            subtitle="Ajusta variables en tiempo real y calcula la acidificación y viscosidad calibradas con datos del Dr. Stalin Santacruz."
            icon="⚡"
            navigation={navigation}
          />

          <View style={styles.mainLayout}>
        {/* COLUMNA 1: FORMULARIO Y CONTROLES */}
        <View style={styles.controlsCol}>
          {/* Tarjeta de Código de Lote para Persistencia */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>1. Código del Lote Experimental</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.textInput}
                value={loteNombre}
                onChangeText={setLoteNombre}
                placeholder="Ej. LOTE-CHV-2026-001"
              />
              <Text style={styles.inputHelper}>
                Guarda este escenario en SQLite para monitoreo periódico y exportación.
              </Text>
            </View>
          </View>

          {/* Tarjeta de Sustrato y Carbohidrato */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>2. Matriz Láctea & Carbohidrato</Text>
            <Text style={styles.paramSubLabel}>Tipo de leche:</Text>
            <View style={styles.pillsRow}>
              {['vaca', 'chocho', 'coco'].map((tipo) => (
                <Pressable
                  key={tipo}
                  style={[styles.pill, sustrato === tipo && styles.pillActive]}
                  onPress={() => cambiarSustrato(tipo)}
                >
                  <Text style={[styles.pillText, sustrato === tipo && styles.pillTextActive]}>
                    {tipo.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.paramSubLabel, { marginTop: 10 }]}>Fuente de azúcar añadida:</Text>
            <View style={styles.pillsRow}>
              {['lactosa', 'sacarosa', 'glucosa'].map((az) => {
                const deshabilitado = sustrato !== 'vaca' && az === 'lactosa';
                return (
                  <Pressable
                    key={az}
                    disabled={deshabilitado}
                    style={[
                      styles.pill,
                      tipoAzucar === az && styles.pillActive,
                      deshabilitado && { opacity: 0.35, backgroundColor: '#E2E8F0' },
                    ]}
                    onPress={() => cambiarAzucar(az)}
                  >
                    <Text style={[styles.pillText, tipoAzucar === az && styles.pillTextActive]}>
                      {az.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Escenarios Experimentales Preconfigurados */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>3. Escenarios del Laboratorio ULEAM</Text>
            <View style={styles.presetsCol}>
              <Pressable
                style={[
                  styles.presetBtn,
                  masaInoculo === '18.75' && temperatura === '42' && styles.presetBtnActive,
                ]}
                onPress={() => aplicarPresets(18.75, 42)}
              >
                <View style={styles.presetTitleRow}>
                  <ScientificIcon name="check" size={14} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={styles.presetTitle}>42 °C / 7.5% Inóculo (Óptimo ULEAM)</Text>
                </View>
                <Text style={styles.presetSub}>Corte 4.25 h • Viscosidad alta 2639 mPa·s</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.presetBtn,
                  masaInoculo === '6.25' && temperatura === '42' && styles.presetBtnActive,
                ]}
                onPress={() => aplicarPresets(6.25, 42)}
              >
                <View style={styles.presetTitleRow}>
                  <ScientificIcon name="flask" size={14} color="#0284C7" style={{ marginRight: 6 }} />
                  <Text style={styles.presetTitle}>42 °C / 2.5% Inóculo (Acidificación Lenta)</Text>
                </View>
                <Text style={styles.presetSub}>Corte 6.75 h • Viscosidad 1454 mPa·s</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.presetBtn,
                  masaInoculo === '18.75' && temperatura === '40' && styles.presetBtnActive,
                ]}
                onPress={() => aplicarPresets(18.75, 40)}
              >
                <View style={styles.presetTitleRow}>
                  <ScientificIcon name="alert" size={14} color="#D97706" style={{ marginRight: 6 }} />
                  <Text style={styles.presetTitle}>40 °C / 7.5% Inóculo (Subóptimo)</Text>
                </View>
                <Text style={styles.presetSub}>Baja temperatura • Viscosidad 786.6 mPa·s</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.presetBtn,
                  masaInoculo === '18.75' && temperatura === '44' && styles.presetBtnActive,
                ]}
                onPress={() => aplicarPresets(18.75, 44)}
              >
                <View style={styles.presetTitleRow}>
                  <ScientificIcon name="thermometer" size={14} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.presetTitle}>44 °C / 7.5% Inóculo (Estrés Térmico)</Text>
                </View>
                <Text style={styles.presetSub}>Corte tardío 6.50 h • Desnaturalización</Text>
              </Pressable>
            </View>
          </View>

          {/* Steppers Interactivos (+/- 1) */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>4. Ajuste Milimétrico de Parámetros</Text>

            <View style={styles.inputsGrid}>
              {/* Inóculo */}
              <View style={styles.inputCol}>
                <View style={styles.stepperHeader}>
                  <View style={styles.labelWithIcon}>
                    <ScientificIcon name="flask" size={13} color="#0284C7" style={{ marginRight: 4 }} />
                    <Text style={styles.stepperLabel}>Inóculo (g)</Text>
                  </View>
                  <Text style={styles.stepperBadge}>{pctInoculo}%</Text>
                </View>
                <View style={styles.stepperBox}>
                  <Pressable style={styles.stepperBtn} onPress={() => ajustarMasa(-1)}>
                    <Text style={styles.stepperBtnText}>−</Text>
                  </Pressable>
                  <TextInput
                    style={styles.stepperInput}
                    value={masaInoculo}
                    onChangeText={(t) => {
                      setMasaInoculo(t);
                      handleSimular(t, temperatura);
                    }}
                    keyboardType="numeric"
                  />
                  <Pressable style={styles.stepperBtn} onPress={() => ajustarMasa(1)}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </Pressable>
                </View>
                <Text style={styles.stepperHint}>Rango: 0.5g – 37.5g (±1g)</Text>
              </View>

              {/* Temperatura */}
              <View style={styles.inputCol}>
                <View style={styles.stepperHeader}>
                  <View style={styles.labelWithIcon}>
                    <ScientificIcon name="thermometer" size={13} color="#D97706" style={{ marginRight: 4 }} />
                    <Text style={styles.stepperLabel}>Temperatura (°C)</Text>
                  </View>
                  <Text
                    style={[
                      styles.stepperBadge,
                      parseFloat(temperatura) >= 41 && parseFloat(temperatura) <= 43
                        ? { backgroundColor: '#DCFCE7', color: '#15803D' }
                        : { backgroundColor: '#FEE2E2', color: '#991B1B' },
                    ]}
                  >
                    {parseFloat(temperatura) >= 41 && parseFloat(temperatura) <= 43 ? 'Óptima' : 'Alerta'}
                  </Text>
                </View>
                <View style={styles.stepperBox}>
                  <Pressable style={styles.stepperBtn} onPress={() => ajustarTemp(-1)}>
                    <Text style={styles.stepperBtnText}>−</Text>
                  </Pressable>
                  <TextInput
                    style={styles.stepperInput}
                    value={temperatura}
                    onChangeText={(t) => {
                      setTemperatura(t);
                      handleSimular(masaInoculo, t);
                    }}
                    keyboardType="numeric"
                  />
                  <Pressable style={styles.stepperBtn} onPress={() => ajustarTemp(1)}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </Pressable>
                </View>
                <Text style={styles.stepperHint}>Óptimo: 41.0 °C – 43.0 °C (±1°C)</Text>
              </View>
            </View>

            {errorValidacion && (
              <View style={styles.errorBanner}>
                <ScientificIcon name="alert" size={14} color="#991B1B" style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{errorValidacion}</Text>
              </View>
            )}

            {/* Botón Guardar Ensayo en SQLite */}
            <Pressable
              style={[styles.btnGuardarEnsayo, guardandoLote && styles.btnDisabled]}
              onPress={handleCrearEnsayoDesdeSimulacion}
              disabled={guardandoLote}
            >
              {guardandoLote ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnRowFlex}>
                  <ScientificIcon name="flask" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.btnGuardarEnsayoText}>
                    Iniciar Lote y Guardar en SQLite
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* COLUMNA 2: RESULTADOS DE PREDICCIÓN CINÉTICA Y GRÁFICO */}
        <View style={styles.resultsCol}>
          {/* Alerta de Desviación Térmica */}
          {resultado.fueraDeRangoTermico && (
            <View style={styles.alertaCard}>
              <Text style={styles.alertaTitulo}>⚠️ ALERTA: DESVIACIÓN TÉRMICA DETECTADA</Text>
              <Text style={styles.alertaTexto}>{resultado.alertaTermica}</Text>
            </View>
          )}

          {/* Tarjetas KPI de Resultados */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Tiempo hasta pH 4.50</Text>
              <Text style={styles.kpiVal}>{resultado.tiempoEstimadoHoras} h</Text>
              <Text style={styles.kpiSub}>~{resultado.tiempoEstimadoCorteMinutos} minutos</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Viscosidad Final Estimada</Text>
              <Text
                style={[
                  styles.kpiVal,
                  resultado.viscosidadEstimadaMpaS >= 2000
                    ? { color: '#16A34A' }
                    : resultado.viscosidadEstimadaMpaS < 1000
                    ? { color: '#DC2626' }
                    : { color: '#0284C7' },
                ]}
              >
                {resultado.viscosidadEstimadaMpaS}
              </Text>
              <Text style={styles.kpiSub}>mPa·s (Rotor 4, 60 rpm)</Text>
            </View>
          </View>

          {/* Escala Reológica Estimada Visual (Firmeza del Gel) */}
          <RheologyMeter
            viscosidadMpaS={resultado.viscosidadEstimadaMpaS}
            targetMpaS={2639}
          />

          {/* Gráfico Cinético Continuo de Acidificación (Modelo Hill) */}
          <KineticCurveChart
            puntos={resultado.puntos}
            tiempoCorteMinutos={resultado.tiempoCorteMinutos}
            titulo="Curva Cinética de Acidificación (Hill ULEAM)"
            subtitulo={`Caída continua de pH vs tiempo hasta corte en pH 4.50 (~${resultado.tiempoCorteHoras} h)`}
            defaultSuperponer={superponerOptimo}
          />

          {/* Tabla de Hitos Cinéticos Paso a Paso */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Hitos Cinéticos Paso a Paso</Text>
            <View style={styles.thRow}>
              <Text style={styles.th}>Tiempo</Text>
              <Text style={styles.th}>pH Est.</Text>
              <Text style={styles.th}>°Brix</Text>
              <Text style={styles.th}>Estado</Text>
            </View>
            {resultado.puntos.map((pt, idx) => (
              <View key={idx} style={styles.trRow}>
                <Text style={styles.td}>{pt.horas} h ({pt.minutos} min)</Text>
                <Text
                  style={[
                    styles.td,
                    styles.tdPh,
                    pt.ph <= 4.52 && { color: '#DC2626', fontWeight: '800' },
                  ]}
                >
                  {pt.ph.toFixed(2)}
                </Text>
                <Text style={styles.td}>{pt.brix}°Bx</Text>
                <Text
                  style={[
                    styles.td,
                    { fontSize: 11 },
                    pt.ph <= 4.52 ? { color: '#16A34A', fontWeight: '700' } : { color: '#64748B' },
                  ]}
                >
                  {pt.estado}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>

    {/* Footer estirado de izquierda a derecha al 100% */}
    <FooterBar />
  </ScrollView>
</View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  desktopContainer: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
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
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  mainLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    alignItems: 'flex-start',
  },
  controlsCol: {
    flex: 1,
    minWidth: 340,
    gap: theme.spacing.md,
  },
  resultsCol: {
    flex: 1.3,
    minWidth: 420,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  paramSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  inputGroup: {
    marginTop: 2,
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    fontSize: 13,
    color: theme.colors.text,
    backgroundColor: '#FAFAFA',
  },
  inputHelper: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  pillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  presetsCol: {
    gap: 6,
  },
  presetBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: theme.radii.sm,
    padding: 8,
  },
  presetBtnActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  presetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  presetSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
    paddingLeft: 20,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnRowFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  inputCol: {
    flex: 1,
  },
  stepperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  stepperBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    height: 40,
  },
  stepperBtn: {
    width: 36,
    height: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  stepperInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepperHint: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: 8,
    marginTop: 10,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: 11.5,
    fontWeight: '600',
  },
  btnGuardarEnsayo: {
    backgroundColor: '#0284C7',
    borderRadius: theme.radii.md,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 14,
    ...theme.shadows.card,
  },
  btnGuardarEnsayoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  alertaCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  alertaTitulo: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 2,
  },
  alertaTexto: {
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
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
    color: theme.colors.textMuted,
    fontWeight: '700',
    textAlign: 'center',
  },
  kpiVal: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0284C7',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 10.5,
    color: '#64748B',
  },
  diagnosticoCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  diagnosticoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 2,
  },
  diagnosticoText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 17,
  },
  reglaText: {
    fontSize: 10.5,
    color: '#3B82F6',
    marginTop: 6,
    fontStyle: 'italic',
  },
  chartVisualizerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  chartSubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  superponerToggle: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  superponerToggleActive: {
    backgroundColor: '#E0F2FE',
  },
  superponerToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  superponerToggleTextActive: {
    color: '#0284C7',
  },
  kineticBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  kineticBarCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barPhText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barNormal: {
    backgroundColor: '#0284C7',
  },
  barCorte: {
    backgroundColor: '#DC2626',
  },
  barTimeText: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10.5,
    color: '#64748B',
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
    fontSize: 11.5,
    color: '#334155',
    textAlign: 'center',
  },
  tdPh: {
    fontWeight: '700',
    color: '#0284C7',
  },
});
