import React, { useContext, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import HeaderBar from '../components/common/HeaderBar';
import FooterBar from '../components/common/FooterBar';
import CustomInput from '../components/common/CustomInput';
import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
import theme, { getTemperatureColor } from '../styles/theme';

const activeBatch = {
  code: 'LOTE-CHV-001',
  medium: 'Leche de vaca + yogur Chiveria',
  sugar: 'Lactosa',
  inoculum: '18 g',
  startedAt: '08:10',
  elapsedTime: '02:35',
  currentPh: 5.18,
  currentTemperature: 42.4,
  targetPh: 4.5,
};

export default function DashboardScreen({ navigation }) {
  const { user, logout, openAuthModal } = useContext(AuthContext);
  const [phValue, setPhValue] = useState(String(activeBatch.currentPh));
  const [temperatureValue, setTemperatureValue] = useState(
    String(activeBatch.currentTemperature),
  );

  const temperature = Number(temperatureValue.replace(',', '.'));
  const ph = Number(phValue.replace(',', '.'));

  const batchStatus = useMemo(() => {
    if (!Number.isNaN(temperature) && (temperature < 41 || temperature > 43)) {
      return 'thermalAlert';
    }

    if (!Number.isNaN(ph) && ph <= activeBatch.targetPh) {
      return 'optimalPh';
    }

    return 'inProgress';
  }, [ph, temperature]);

  const getRolLabel = (rol) => {
    switch (rol) {
      case 'docente':
        return 'Docente Investigador';
      case 'estudiante':
        return 'Estudiante Tesista';
      case 'investigador':
      default:
        return 'Investigador de Laboratorio';
    }
  };

  return (
    <View style={styles.screen}>
      {/* Barra Superior Universal con Métricas y Perfil */}
      <HeaderBar />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de Perfil y Muestras del Usuario */}
        <View style={styles.profileBanner}>
          <View style={styles.profileBannerContent}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {user?.rol === 'estudiante' ? '🎓' : user?.rol === 'docente' ? '📚' : '🔬'}
              </Text>
            </View>
            <View style={styles.profileInfoBlock}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>{user?.nombre || 'Investigador ULEAM'}</Text>
                <View style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>
                    {getRolLabel(user?.rol)}
                  </Text>
                </View>
              </View>
              <Text style={styles.profileEmail}>
                ✉️ {user?.email || 'carlos.delgado@uleam.edu.ec'}
              </Text>
              <Text style={styles.profileHint}>
                📁 Tus ensayos, lecturas y cinéticas se aíslan y guardan bajo tu perfil en SQLite.
              </Text>
            </View>
          </View>
          <View style={styles.profileActions}>
            <Pressable
              style={styles.profileArchiveBtn}
              onPress={() => navigation.navigate('EnsayosArchivados')}
            >
              <Text style={styles.profileArchiveBtnText}>📁 Mis Muestras</Text>
            </Pressable>
            <Pressable
              style={styles.profileSwitchBtn}
              onPress={() => openAuthModal('login')}
            >
              <Text style={styles.profileSwitchBtnText}>🔄 Cambiar</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Monitoreo Cinético</Text>
              <Text style={styles.title}>Dashboard de Fermentación</Text>
              <Text style={styles.subtitle}>
                Control cinético en tiempo real con inóculo Chivería
              </Text>
            </View>
            <StatusBadge status={batchStatus} />
          </View>

          <View style={styles.batchPanel}>
            <View>
              <Text style={styles.batchLabel}>Lote activo</Text>
              <Text style={styles.batchCode}>{activeBatch.code}</Text>
            </View>
            <View style={styles.batchMetaGrid}>
              <InfoPill label="Medio" value={activeBatch.medium} />
              <InfoPill label="Azucar" value={activeBatch.sugar} />
              <InfoPill label="Inoculo" value={activeBatch.inoculum} />
              <InfoPill label="Inicio" value={activeBatch.startedAt} />
            </View>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            label="pH actual"
            value={Number.isNaN(ph) ? '--' : ph.toFixed(2)}
            helperText={`Corte objetivo: pH ${activeBatch.targetPh}`}
            status={ph <= activeBatch.targetPh ? 'success' : 'normal'}
          />
          <MetricCard
            label="Temperatura"
            value={Number.isNaN(temperature) ? '--' : temperature.toFixed(1)}
            unit="°C"
            helperText="Rango optimo: 41 °C - 43 °C"
            accentColor={getTemperatureColor(temperature)}
          />
          <MetricCard
            label="Tiempo"
            value={activeBatch.elapsedTime}
            helperText="Tiempo transcurrido"
            status="info"
          />
        </View>

        <View style={styles.inputPanel}>
          <Text style={styles.sectionTitle}>Lecturas manuales de referencia</Text>
          <View style={styles.inputGrid}>
            <CustomInput
              label="pH medido"
              metricType="ph"
              value={phValue}
              onChangeText={setPhValue}
              placeholder="0.0"
            />
            <CustomInput
              label="Temperatura del bano"
              metricType="temperature"
              value={temperatureValue}
              onChangeText={setTemperatureValue}
              placeholder="42.0"
              unit="°C"
            />
          </View>
        </View>

        <View style={styles.chartPanel}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleBlock}>
              <Text style={styles.sectionTitle}>Curvas cineticas</Text>
              <Text style={styles.sectionSubtitle}>
                Aqui se superpondran pH, temperatura y simulaciones What-If.
              </Text>
            </View>
            <Text style={styles.chartTag}>Placeholder</Text>
          </View>

          <View style={styles.chartCanvas}>
            <View style={styles.yAxis}>
              <Text style={styles.axisText}>pH 7.0</Text>
              <Text style={styles.axisText}>pH 4.5</Text>
            </View>
            <View style={styles.chartArea}>
              <View style={[styles.gridLine, styles.gridLineTop]} />
              <View style={[styles.gridLine, styles.gridLineMiddle]} />
              <View style={[styles.gridLine, styles.gridLineBottom]} />
              <View style={styles.curveSegmentOne} />
              <View style={styles.curveSegmentTwo} />
              <View style={styles.targetLine} />
            </View>
          </View>
        </View>

        {/* MÓDULOS CIENTÍFICOS Y PEDAGÓGICOS ULEAM */}
        <View style={styles.pedagogicalPanel}>
          <Text style={styles.sectionTitle}>📚 Cátedra & Módulos Científicos (Dr. Stalin Santacruz)</Text>
          <Text style={styles.sectionSubtitle}>
            Herramientas formativas, bioquímica del gel, aprendizaje continuo y certificación bioestadística:
          </Text>

          <View style={styles.pedagogicalGrid}>
            <Pressable
              style={styles.pedagogicalCard}
              onPress={() => navigation.navigate('Bioquimica')}
            >
              <Text style={styles.pedCardIcon}>🧬</Text>
              <Text style={styles.pedCardTitle}>Bioquímica & Escala pH</Text>
              <Text style={styles.pedCardSub}>3 etapas, micelas de caseína y escala interactiva de pH</Text>
            </Pressable>

            <Pressable
              style={styles.pedagogicalCard}
              onPress={() => navigation.navigate('DemostradorVivo')}
            >
              <Text style={styles.pedCardIcon}>⏱️</Text>
              <Text style={styles.pedCardTitle}>Demostrador en Vivo</Text>
              <Text style={styles.pedCardSub}>Exposiciones y simulación pedagógica para evaluación</Text>
            </Pressable>

            <Pressable
              style={styles.pedagogicalCard}
              onPress={() => navigation.navigate('FeedbackLoop')}
            >
              <Text style={styles.pedCardIcon}>🧠</Text>
              <Text style={styles.pedCardTitle}>Feedback Loop</Text>
              <Text style={styles.pedCardSub}>Aprendizaje continuo con nuevos lotes concluidos</Text>
            </Pressable>

            <Pressable
              style={styles.pedagogicalCard}
              onPress={() => navigation.navigate('MetricasModelo')}
            >
              <Text style={styles.pedCardIcon}>📊</Text>
              <Text style={styles.pedCardTitle}>Métricas Científicas</Text>
              <Text style={styles.pedCardSub}>Validación R² = 0.9774 y matriz de los 6 lotes</Text>
            </Pressable>
          </View>
        </View>

        {/* ACCIONES Y NAVEGACIÓN PRINCIPAL */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('NuevoEnsayo')}
          >
            <Text style={styles.primaryButtonText}>➕ Nuevo Ensayo de Fermentación</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.archiveMainButton]}
            onPress={() => navigation.navigate('EnsayosArchivados')}
          >
            <Text style={styles.archiveMainButtonText}>📁 Ensayos & Lotes Archivados ("Mis Muestras")</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.infoButton]}
            onPress={() => navigation.navigate('Monitoreo')}
          >
            <Text style={styles.infoButtonText}>⏱️ Monitoreo en Vivo (Ensayo Activo)</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.simulateButton]}
            onPress={() => navigation.navigate('Simulacion')}
          >
            <Text style={styles.simulateButtonText}>⚡ Simulador Cinético ("What-If")</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.secondaryButton]} onPress={logout}>
            <Text style={styles.secondaryButtonText}>🚪 Cerrar Sesión</Text>
          </Pressable>
        </View>

        <FooterBar />
      </ScrollView>
    </View>
  );
}

function InfoPill({ label, value }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
  },
  profileBanner: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  profileBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
    minWidth: 260,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 22,
  },
  profileInfoBlock: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  profileBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3730A3',
    textTransform: 'uppercase',
  },
  profileEmail: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  profileHint: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileArchiveBtn: {
    backgroundColor: '#059669',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radii.sm,
  },
  profileArchiveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  profileSwitchBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radii.sm,
  },
  profileSwitchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    textTransform: 'uppercase',
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
  batchPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
  },
  batchLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  batchCode: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  batchMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  infoPill: {
    minWidth: '45%',
    flexGrow: 1,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.md,
  },
  infoLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  inputPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  inputGrid: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    fontWeight: '700',
  },
  sectionSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  chartPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.card,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  chartTitleBlock: {
    flex: 1,
  },
  chartTag: {
    ...theme.typography.caption,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radii.sm,
    color: theme.colors.primary,
    fontWeight: '700',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chartCanvas: {
    minHeight: 220,
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  yAxis: {
    width: 58,
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  axisText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  gridLineTop: {
    top: '22%',
  },
  gridLineMiddle: {
    top: '50%',
  },
  gridLineBottom: {
    top: '76%',
  },
  curveSegmentOne: {
    position: 'absolute',
    left: '8%',
    top: '28%',
    width: '46%',
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    transform: [{ rotate: '12deg' }],
  },
  curveSegmentTwo: {
    position: 'absolute',
    left: '48%',
    top: '48%',
    width: '40%',
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    transform: [{ rotate: '18deg' }],
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '22%',
    height: 2,
    backgroundColor: theme.colors.warning,
  },
  pedagogicalPanel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.card,
  },
  pedagogicalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: theme.spacing.md,
  },
  pedagogicalCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  pedCardIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  pedCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  pedCardSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  actions: {
    gap: theme.spacing.md,
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  archiveMainButton: {
    backgroundColor: '#059669',
  },
  archiveMainButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.danger,
    borderWidth: 1,
  },
  secondaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.danger,
    fontWeight: '700',
  },
  infoButton: {
    backgroundColor: theme.colors.info,
  },
  infoButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  simulateButton: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
  },
  simulateButtonText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
