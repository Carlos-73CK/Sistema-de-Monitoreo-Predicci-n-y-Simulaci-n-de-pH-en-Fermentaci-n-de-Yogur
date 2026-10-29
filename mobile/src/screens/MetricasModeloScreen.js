import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import ensayosService from '../services/ensayosService';
import theme from '../styles/theme';
import HeaderBar from '../components/common/HeaderBar';
import FooterBar from '../components/common/FooterBar';
import ScreenHeader from '../components/common/ScreenHeader';
import KineticCurveChart from '../components/common/KineticCurveChart';
import ScientificIcon from '../components/common/ScientificIcons';

export default function MetricasModeloScreen({ navigation }) {
  const [metricas, setMetricas] = useState({
    r2: 0.9774,
    rmse: 0.0961,
    mae: 0.0773,
    totalMuestras: 37,
    totalLotes: 6,
  });
  const [cargando, setCargando] = useState(false);

  const cargarMetricas = async () => {
    try {
      setCargando(true);
      const res = await ensayosService.getMetricasModelo();
      if (res && res.r2 !== undefined) {
        setMetricas({
          r2: Number(res.r2 || 0.9774),
          rmse: Number(res.rmse || 0.0961),
          mae: Number(res.mae || 0.0773),
          totalMuestras: res.total_muestras || res.totalMuestras || 37,
          totalLotes: res.total_lotes || res.totalLotes || 6,
        });
      }
    } catch (err) {
      console.warn('[MetricasModelo] Usando métricas calibradas por defecto:', err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMetricas();
  }, []);

  const matrizLotes = [
    { id: 'E1', temp: 40, inocPct: 2.5, inocG: 6.25, corteH: 5.83, visc: 2579, brix: 5.9, desc: 'Lenta a baja T' },
    { id: 'E2', temp: 40, inocPct: 7.5, inocG: 18.75, corteH: 5.50, visc: 786.6, brix: 5.5, desc: 'Red débil' },
    { id: 'E3', temp: 42, inocPct: 2.5, inocG: 6.25, corteH: 6.75, visc: 1454, brix: 5.1, desc: 'Nominal baja dosis' },
    { id: 'E4', temp: 42, inocPct: 7.5, inocG: 18.75, corteH: 4.25, visc: 2639, brix: 5.7, desc: '⭐ ÓPTIMO LABORATORIO', optimo: true },
    { id: 'E5', temp: 44, inocPct: 2.5, inocG: 6.25, corteH: 6.50, visc: 1185, brix: 6.1, desc: 'Estrés térmico' },
    { id: 'E6', temp: 44, inocPct: 7.5, inocG: 18.75, corteH: 6.50, visc: 796.5, brix: 7.4, desc: 'Desnaturalización' },
  ];

  return (
    <View style={styles.screen}>
      <HeaderBar navigation={navigation} activeTab="MetricasModelo" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.desktopContainer}>
          {/* Encabezado Institucional con Retorno */}
          <ScreenHeader
            title="Métricas Científicas del Modelo (Hill ULEAM)"
            subtitle="Calibración matemática y bondad de ajuste del modelo de Hill validado en la Facultad de Ciencias de la Vida (R² = 0.9774)."
            icon="metrics"
            navigation={navigation}
          />

      {/* Tarjeta de KPIs de Rendimiento */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiTile}>
          <Text style={styles.kpiHeader}>Bondad de Ajuste R²</Text>
          <Text style={[styles.kpiNumber, { color: '#0284C7' }]}>{metricas.r2.toFixed(4)}</Text>
          <Text style={styles.kpiFooter}>{(metricas.r2 * 100).toFixed(2)}% Precisión</Text>
        </View>

        <View style={styles.kpiTile}>
          <Text style={styles.kpiHeader}>Error RMSE</Text>
          <Text style={[styles.kpiNumber, { color: '#059669' }]}>{metricas.rmse.toFixed(4)}</Text>
          <Text style={styles.kpiFooter}>Unidades de pH</Text>
        </View>

        <View style={styles.kpiTile}>
          <Text style={styles.kpiHeader}>Error Medio MAE</Text>
          <Text style={[styles.kpiNumber, { color: '#7C3AED' }]}>{metricas.mae.toFixed(4)}</Text>
          <Text style={styles.kpiFooter}>Unidades de pH</Text>
        </View>

        <View style={styles.kpiTile}>
          <Text style={styles.kpiHeader}>Muestras Activas</Text>
          <Text style={[styles.kpiNumber, { color: '#0F172A' }]}>{metricas.totalMuestras}</Text>
          <Text style={styles.kpiFooter}>{metricas.totalLotes} lotes base</Text>
        </View>
      </View>

      {/* Ficha Técnica Científica */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleRow}>
            <ScientificIcon name="microscope" size={18} color="#0284C7" style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle}>Ficha Técnica de la Calibración Científica</Text>
          </View>
          <Pressable style={styles.refreshBtn} onPress={cargarMetricas}>
            <ScientificIcon name="spark" size={13} color="#0284C7" style={{ marginRight: 4 }} />
            <Text style={styles.refreshBtnText}>{cargando ? 'Cargando...' : 'Actualizar'}</Text>
          </Pressable>
        </View>

        <View style={styles.specsList}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>• Investigador Titular:</Text>
            <Text style={styles.specValue}>
              Dr. Stalin Gustavo Santacruz Terán (Facultad de Ciencias de la Vida — ULEAM).
            </Text>
          </View>

          <View style={styles.specItem}>
            <Text style={styles.specLabel}>• Ecuación Cinética:</Text>
            <Text style={styles.specValue}>
              Decaimiento Sigmoidal de Hill no lineal con ponderación por distancia inversa (IDW) normalizada en el espacio bidimensional de Temperatura e Inóculo.
            </Text>
          </View>

          <View style={styles.specItem}>
            <Text style={styles.specLabel}>• Punto de Corte Crítico:</Text>
            <Text style={styles.specValue}>
              pH 4.50 exacto. A este valor, la desestabilización electrostática de las micelas de caseína consolida la red tridimensional del gel sin provocar sinéresis.
            </Text>
          </View>

          <View style={styles.specItem}>
            <Text style={styles.specLabel}>• Condición Experimental Óptima:</Text>
            <Text style={styles.specValue}>
              42.0 °C con 7.50% de inóculo Chivería (18.75 g en 250 mL), alcanzando 2639 mPa·s medidos con viscosímetro Brookfield (rotor 4 a 60 rpm).
            </Text>
          </View>
        </View>
      </View>

      {/* Gráfico Cinético de Validación R² = 0.9774 */}
      <KineticCurveChart
        titulo="Cinética de Validación Biofísica (Hill R² = 0.9774)"
        subtitulo="Ajuste no lineal frente a puntos experimentales de laboratorio (RMSE = 0.0961, MAE = 0.0773)"
        tiempoCorteMinutos={255}
        puntos={[
          { minutos: 0, ph: 6.68 },
          { minutos: 60, ph: 6.22 },
          { minutos: 120, ph: 5.48 },
          { minutos: 180, ph: 4.88 },
          { minutos: 240, ph: 4.54 },
          { minutos: 255, ph: 4.50 },
        ]}
        lecturasReales={[
          { minutos: 0, ph: 6.68 },
          { minutos: 60, ph: 6.20 },
          { minutos: 120, ph: 5.45 },
          { minutos: 180, ph: 4.85 },
          { minutos: 255, ph: 4.50 },
        ]}
      />

      {/* Matriz Experimental de los 6 Lotes del Dr. Santacruz */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧪 Matriz Experimental de Referencia (Dr. Stalin Santacruz)</Text>
        <Text style={styles.cardSubtitle}>
          Ensayos empíricos reales utilizados para calibrar la IA con 250 g de leche y fermento lácteo Chivería:
        </Text>

        <View style={styles.thRow}>
          <Text style={[styles.th, { flex: 0.6 }]}>Lote</Text>
          <Text style={styles.th}>Temp</Text>
          <Text style={styles.th}>Inóculo</Text>
          <Text style={styles.th}>Corte (h)</Text>
          <Text style={styles.th}>Viscosidad</Text>
          <Text style={styles.th}>°Brix</Text>
        </View>

        {matrizLotes.map((item) => (
          <View
            key={item.id}
            style={[
              styles.trRow,
              item.optimo && { backgroundColor: '#DCFCE7', borderRadius: 6 },
            ]}
          >
            <Text style={[styles.td, { flex: 0.6, fontWeight: '800' }]}>{item.id}</Text>
            <Text style={styles.td}>{item.temp} °C</Text>
            <Text style={styles.td}>{item.inocG} g ({item.inocPct}%)</Text>
            <Text style={[styles.td, { fontWeight: '700', color: '#0284C7' }]}>{item.corteH} h</Text>
            <Text
              style={[
                styles.td,
                { fontWeight: '800' },
                item.visc >= 2000 ? { color: '#15803D' } : { color: '#B45309' },
              ]}
            >
              {item.visc} mPa·s
            </Text>
            <Text style={styles.td}>{item.brix}°Bx</Text>
          </View>
        ))}
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
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
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  kpiTile: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  kpiHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 3,
  },
  kpiFooter: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 10,
  },
  refreshBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  specsList: {
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specItem: {
    gap: 2,
  },
  specLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  specValue: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  thRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
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
    paddingVertical: 7,
  },
  td: {
    flex: 1,
    fontSize: 11.5,
    color: '#334155',
    textAlign: 'center',
  },
});
