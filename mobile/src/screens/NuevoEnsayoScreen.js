import React, { useState, useContext } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import FooterBar from '../components/common/FooterBar';
import ensayosService from '../services/ensayosService';
import theme from '../styles/theme';

export default function NuevoEnsayoScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [nombreLote, setNombreLote] = useState('LOTE-CHV-' + Math.floor(100 + Math.random() * 900));
  const [sustrato, setSustrato] = useState('vaca');
  const [tipoAzucar, setTipoAzucar] = useState('lactosa');
  const [masaInoculo, setMasaInoculo] = useState('18.75');
  const [temperaturaObjetivo, setTemperaturaObjetivo] = useState('42.0');
  const [volumenLeche, setVolumenLeche] = useState('250');

  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState(null);

  const aplicarPreset = (masa, temp) => {
    setMasaInoculo(String(masa));
    setTemperaturaObjetivo(String(temp));
    setErrorValidacion(null);
  };

  const ajustarMasa = (delta) => {
    const actual = parseFloat(masaInoculo) || 18.75;
    const nuevo = Math.max(0.5, Math.min(37.5, Math.round((actual + delta) * 100) / 100));
    setMasaInoculo(String(nuevo));
  };

  const ajustarTemp = (delta) => {
    const actual = parseFloat(temperaturaObjetivo) || 42.0;
    const nuevo = Math.max(20, Math.min(52, Math.round((actual + delta) * 10) / 10));
    setTemperaturaObjetivo(String(nuevo));
  };

  const ajustarVol = (delta) => {
    const actual = parseFloat(volumenLeche) || 250;
    const nuevo = Math.max(50, Math.min(1000, actual + delta));
    setVolumenLeche(String(nuevo));
  };

  const handleCrearEnsayo = async () => {
    const masaNum = parseFloat(masaInoculo);
    const tempNum = parseFloat(temperaturaObjetivo);
    const volNum = parseFloat(volumenLeche);

    if (!nombreLote.trim()) {
      setErrorValidacion('Por favor ingrese un nombre o código de lote.');
      return;
    }
    if (isNaN(masaNum) || masaNum < 0.5 || masaNum > 50) {
      setErrorValidacion('La masa de inóculo debe estar entre 0.5 g y 50 g.');
      return;
    }
    if (isNaN(tempNum) || tempNum < 20 || tempNum > 52) {
      setErrorValidacion('La temperatura objetivo debe estar entre 20 °C y 52 °C.');
      return;
    }
    if (isNaN(volNum) || volNum < 50 || volNum > 2000) {
      setErrorValidacion('El volumen debe estar entre 50 mL y 2000 mL.');
      return;
    }

    setErrorValidacion(null);

    try {
      setCargando(true);

      const nuevoEnsayo = await ensayosService.crearEnsayo({
        lote_id: nombreLote.trim(),
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
        '✅ Ensayo Iniciado',
        `Lote "${nombreLote.trim()}" registrado en SQLite bajo el perfil de ${user?.nombre || 'tu cuenta'}. Pasando a monitoreo en vivo...`,
        [
          {
            text: 'Comenzar Monitoreo',
            onPress: () =>
              navigation.navigate('Monitoreo', {
                ensayo: {
                  id: nuevoEnsayo.id,
                  codigo: nombreLote.trim(),
                  loteId: nombreLote.trim(),
                  tipoSustrato: sustrato,
                  tipoAzucar: tipoAzucar,
                  masaInoculoG: masaNum,
                  temperaturaObjetivo: tempNum,
                  volumenMl: volNum,
                  investigador: user?.nombre || 'Investigador ULEAM',
                },
              }),
          },
        ]
      );
    } catch (err) {
      console.error('Error al crear ensayo:', err);
      Alert.alert('Error', 'No fue posible crear el ensayo en la base de datos local SQLite.');
    } finally {
      setCargando(false);
    }
  };

  const pct = ((parseFloat(masaInoculo) || 0) / (parseFloat(volumenLeche) || 250) * 100).toFixed(1);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Laboratorio de Alimentos - ULEAM</Text>
        <Text style={styles.title}>Nuevo Ensayo de Fermentación</Text>
        <Text style={styles.subtitle}>
          Configuración inicial de lote experimental según las normas de la cátedra del Dr. Stalin Santacruz.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Identificación del Lote & Perfil</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Código / Nombre de Lote</Text>
          <TextInput
            style={styles.input}
            value={nombreLote}
            onChangeText={setNombreLote}
            placeholder="Ej: LOTE-CHV-101"
          />
          <Text style={styles.hint}>
            Asignado a: 👤 {user?.nombre || 'Investigador Titular'} ({user?.email || 'carlos.delgado@uleam.edu.ec'})
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>2. Matriz / Tipo de Leche</Text>
        <View style={styles.pillsRow}>
          {['vaca', 'chocho', 'coco'].map((tipo) => (
            <Pressable
              key={tipo}
              style={[styles.pill, sustrato === tipo && styles.pillActive]}
              onPress={() => {
                setSustrato(tipo);
                if (tipo !== 'vaca' && tipoAzucar === 'lactosa') {
                  setTipoAzucar('sacarosa');
                }
              }}
            >
              <Text style={[styles.pillText, sustrato === tipo && styles.pillTextActive]}>
                {tipo.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>3. Escenarios Preconfigurados</Text>
        <View style={styles.presetsGrid}>
          <Pressable
            style={[styles.presetBtn, masaInoculo === '18.75' && temperaturaObjetivo === '42.0' && styles.presetBtnActive]}
            onPress={() => aplicarPreset(18.75, 42.0)}
          >
            <Text style={styles.presetTitle}>⭐ 42 °C / 7.5% Inóculo</Text>
            <Text style={styles.presetSub}>Óptimo laboratorio (2639 mPa·s)</Text>
          </Pressable>
          <Pressable
            style={[styles.presetBtn, masaInoculo === '6.25' && temperaturaObjetivo === '42.0' && styles.presetBtnActive]}
            onPress={() => aplicarPreset(6.25, 42.0)}
          >
            <Text style={styles.presetTitle}>🧪 42 °C / 2.5% Inóculo</Text>
            <Text style={styles.presetSub}>Cinética lenta</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>4. Parámetros Fisicoquímicos</Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Inóculo Chivería (g)</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284C7' }}>
                {pct}%
              </Text>
            </View>
            <View style={styles.stepperBox}>
              <Pressable style={styles.stepperBtn} onPress={() => ajustarMasa(-1)}>
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <TextInput
                style={styles.stepperInput}
                value={masaInoculo}
                onChangeText={setMasaInoculo}
                keyboardType="numeric"
                placeholder="18.75"
              />
              <Pressable style={styles.stepperBtn} onPress={() => ajustarMasa(1)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>Rango: 0.5g – 37.5g (±1g)</Text>
          </View>

          <View style={styles.col}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Temperatura (°C)</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>
                41-43°C
              </Text>
            </View>
            <View style={styles.stepperBox}>
              <Pressable style={styles.stepperBtn} onPress={() => ajustarTemp(-1)}>
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <TextInput
                style={styles.stepperInput}
                value={temperaturaObjetivo}
                onChangeText={setTemperaturaObjetivo}
                keyboardType="numeric"
                placeholder="42.0"
              />
              <Pressable style={styles.stepperBtn} onPress={() => ajustarTemp(1)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>Rango: 20°C – 52°C (±1°C)</Text>
          </View>
        </View>

        <View style={[styles.row, { marginTop: 12 }]}>
          <View style={styles.col}>
            <Text style={styles.label}>Volumen Muestra (mL)</Text>
            <View style={styles.stepperBox}>
              <Pressable style={styles.stepperBtn} onPress={() => ajustarVol(-10)}>
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <TextInput
                style={styles.stepperInput}
                value={volumenLeche}
                onChangeText={setVolumenLeche}
                keyboardType="numeric"
                placeholder="250"
              />
              <Pressable style={styles.stepperBtn} onPress={() => ajustarVol(10)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>Estándar: 250 mL (±10mL)</Text>
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Tipo de Azúcar</Text>
            <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
              {['lactosa', 'sacarosa', 'glucosa'].map((az) => {
                const deshabilitado = sustrato !== 'vaca' && az === 'lactosa';
                return (
                  <Pressable
                    key={az}
                    disabled={deshabilitado}
                    style={[
                      styles.pill,
                      { paddingVertical: 8, paddingHorizontal: 6, flex: 1, alignItems: 'center' },
                      tipoAzucar === az && styles.pillActive,
                      deshabilitado && { opacity: 0.35, backgroundColor: '#E2E8F0' },
                    ]}
                    onPress={() => setTipoAzucar(az)}
                  >
                    <Text style={[styles.pillText, { fontSize: 10 }, tipoAzucar === az && styles.pillTextActive]}>
                      {az.substring(0, 4).toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>
              {sustrato === 'vaca' ? 'Lactosa nativa' : 'Sacarosa o glucosa'}
            </Text>
          </View>
        </View>

        {errorValidacion && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorValidacion}</Text>
          </View>
        )}

        <Pressable
          style={[styles.btnCrear, cargando && styles.btnDisabled]}
          onPress={handleCrearEnsayo}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.btnCrearText}>🚀 Iniciar Ensayo y Guardar en SQLite</Text>
          )}
        </Pressable>
      </View>
      <FooterBar />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 18, paddingBottom: 40, maxWidth: 680, width: '100%', alignSelf: 'center' },
  header: { marginBottom: 16 },
  eyebrow: { fontSize: 12, fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 18 },
  card: { backgroundColor: '#ffffff', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  formGroup: { marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#0f172a' },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  pillsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  pill: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#cbd5e1', alignItems: 'center', backgroundColor: '#f8fafc' },
  pillActive: { borderColor: '#0284c7', backgroundColor: '#e0f2fe' },
  pillText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  pillTextActive: { color: '#0369a1' },
  presetsGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  presetBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  presetBtnActive: { borderColor: '#0284c7', backgroundColor: '#e0f2fe' },
  presetTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  presetSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  errorBox: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#ef4444', borderRadius: 8, padding: 10, marginTop: 14 },
  errorText: { color: '#991b1b', fontSize: 12, fontWeight: '600' },
  btnCrear: { backgroundColor: '#0284c7', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  btnCrearText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
    height: 42,
  },
  stepperBtn: {
    width: 38,
    height: 42,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  stepperInput: {
    flex: 1,
    height: 42,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 4,
  },
});
