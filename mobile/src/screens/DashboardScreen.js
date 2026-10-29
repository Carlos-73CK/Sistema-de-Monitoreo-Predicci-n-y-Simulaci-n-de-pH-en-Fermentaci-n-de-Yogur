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
import KineticCurveChart from '../components/common/KineticCurveChart';
import RheologyMeter from '../components/common/RheologyMeter';
import ScientificIcon from '../components/common/ScientificIcons';
import theme, { getTemperatureColor } from '../styles/theme';

const activeBatch = {
  code: 'LOTE-CHV-001',
  medium: 'Leche de vaca + yogur Chiveria',
  sugar: 'Lactosa',
  inoculum: '18.75 g (7.5%)',
  startedAt: '08:10',
  elapsedTime: '02:35 h',
  currentPh: 5.18,
  currentTemperature: 42.4,
  targetPh: 4.5,
  viscosidadEstimada: 2639,
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
      {/* Barra Superior Científica con Tabs Integradas */}
      <HeaderBar navigation={navigation} activeTab="Dashboard" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contenedor Principal de Escritorio Ancho (1320px) */}
        <View style={styles.desktopContainer}>
          
          {/* Banner de Perfil y Aislamiento de Muestras */}
          <View style={styles.profileBanner}>
            <View style={styles.profileBannerContent}>
              <View style={styles.profileAvatar}>
                <ScientificIcon name="user" size={24} color="#0284C7" />
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
                  {user?.email || 'e1312274663@live.uleam.edu.ec'}
                </Text>
                <Text style={styles.profileHint}>
                  Tus ensayos, lecturas y cinéticas se aíslan y guardan bajo tu perfil en SQLite.
                </Text>
              </View>
            </View>

            <View style={styles.profileActions}>
              <Pressable
                style={styles.profileArchiveBtn}
                onPress={() => navigation.navigate('EnsayosArchivados')}
              >
                <ScientificIcon name="archive" size={13} color="#0369A1" style={{ marginRight: 5 }} />
                <Text style={styles.profileArchiveBtnText}>Mis Muestras</Text>
              </Pressable>
              <Pressable
                style={styles.profileSwitchBtn}
                onPress={() => openAuthModal('login')}
              >
                <ScientificIcon name="user" size={13} color="#475569" style={{ marginRight: 5 }} />
                <Text style={styles.profileSwitchBtnText}>Cambiar</Text>
              </Pressable>
            </View>
          </View>

          {/* HERO BANNER: LOTE EXPERIMENTAL ACTIVO */}
          <View style={styles.batchHeroPanel}>
            <View style={styles.batchHeroHeader}>
              <View>
                <View style={styles.batchEyebrowRow}>
                  <ScientificIcon name="flask" size={15} color="#38BDF8" style={{ marginRight: 6 }} />
                  <Text style={styles.batchHeroEyebrow}>Lote de Fermentación Activo</Text>
                </View>
                <Text style={styles.batchHeroCode}>{activeBatch.code}</Text>
                <Text style={styles.batchHeroSub}>
                  Monitoreo físico-químico continuo en baño termostático calibrado con inóculo Chivería
                </Text>
              </View>
              <StatusBadge status={batchStatus} />
            </View>

            <View style={styles.batchMetaGrid}>
              <InfoPill label="Sustrato / Matriz" value={activeBatch.medium} />
              <InfoPill label="Carbohidrato" value={activeBatch.sugar} />
              <InfoPill label="Inóculo" value={activeBatch.inoculum} />
              <InfoPill label="Hora de Inicio" value={activeBatch.startedAt} />
              <InfoPill label="Tiempo Transcurrido" value={activeBatch.elapsedTime} />
            </View>
          </View>

          {/* LAYOUT DE ESCRITORIO EN 2 COLUMNAS (MÉTRICAS A LA IZQUIERDA + CURVA INTERACTIVA A LA DERECHA) */}
          <View style={styles.dashboardSplitGrid}>
            
            {/* COLUMNA IZQUIERDA: CONTROLES, MÉTRICAS Y VISCOSIDAD */}
            <View style={styles.splitLeftCol}>
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
                  helperText="Rango óptimo: 41 °C - 43 °C"
                  accentColor={getTemperatureColor(temperature)}
                />
                <MetricCard
                  label="Tiempo"
                  value={activeBatch.elapsedTime}
                  helperText="Tiempo transcurrido"
                  status="info"
                />
              </View>

              {/* Panel de Lecturas Manuales */}
              <View style={styles.inputPanel}>
                <Text style={styles.sectionTitle}>Lecturas manuales de referencia</Text>
                <Text style={styles.sectionSubtitle}>
                  Ingresa las lecturas periódicas del pH-metro para verificar contra la predicción IA:
                </Text>
                <View style={styles.inputGrid}>
                  <CustomInput
                    label="pH medido"
                    metricType="ph"
                    value={phValue}
                    onChangeText={setPhValue}
                    placeholder="5.18"
                  />
                  <CustomInput
                    label="Temperatura del baño"
                    metricType="temperature"
                    value={temperatureValue}
                    onChangeText={setTemperatureValue}
                    placeholder="42.0"
                    unit="°C"
                  />
                </View>
              </View>

              {/* Escala Reológica de Firmeza del Gel */}
              <RheologyMeter
                viscosidadMpaS={activeBatch.viscosidadEstimada}
                targetMpaS={2639}
              />
            </View>

            {/* COLUMNA DERECHA: GRÁFICO CINÉTICO DINÁMICO E INTERACTIVO */}
            <View style={styles.splitRightCol}>
              <KineticCurveChart
                titulo="Curva Cinética del Lote Activo (LOTE-CHV-001)"
                subtitulo="Interactiva: Pasa el mouse sobre los puntos para ver el avance exacto hacia el corte pH 4.50"
                tiempoCorteMinutos={255}
                puntos={[
                  { minutos: 0, ph: 6.68, brix: 10.5 },
                  { minutos: 60, ph: 6.20, brix: 9.8 },
                  { minutos: 120, ph: 5.50, brix: 8.6 },
                  { minutos: 155, ph: ph || 5.18, brix: 7.8 },
                  { minutos: 210, ph: 4.75, brix: 6.8 },
                  { minutos: 255, ph: 4.50, brix: 5.7 },
                ]}
                lecturasReales={[
                  { tiempo_minutos: 0, ph: 6.68 },
                  { tiempo_minutos: 60, ph: 6.20 },
                  { tiempo_minutos: 155, ph: ph || 5.18 },
                ]}
              />

              {/* Accesos Rápidos de Laboratorio */}
              <View style={styles.quickActionsCard}>
                <View style={styles.qaHeaderRow}>
                  <ScientificIcon name="spark" size={16} color="#0369A1" style={{ marginRight: 6 }} />
                  <Text style={styles.quickActionsTitle}>Acciones Rápidas del Laboratorio:</Text>
                </View>
                <View style={styles.quickActionsRow}>
                  <Pressable
                    style={[styles.quickActionBtn, styles.qaPrimary]}
                    onPress={() => navigation.navigate('NuevoEnsayo')}
                  >
                    <ScientificIcon name="plus" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.qaBtnTextWhite}>Nuevo Ensayo</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.quickActionBtn, styles.qaSim]}
                    onPress={() => navigation.navigate('Simulacion')}
                  >
                    <ScientificIcon name="spark" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.qaBtnTextWhite}>Simulación What-If</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.quickActionBtn, styles.qaLive]}
                    onPress={() => navigation.navigate('Monitoreo')}
                  >
                    <ScientificIcon name="clock" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.qaBtnTextWhite}>Monitoreo en Vivo</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.quickActionBtn, styles.qaArch]}
                    onPress={() => navigation.navigate('EnsayosArchivados')}
                  >
                    <ScientificIcon name="archive" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.qaBtnTextWhite}>Mis Muestras</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* MÓDULOS CIENTÍFICOS Y PEDAGÓGICOS ULEAM */}
          <View style={styles.pedagogicalPanel}>
            <View style={styles.pedagogicalHeader}>
              <View style={styles.pedTitleRow}>
                <ScientificIcon name="microscope" size={20} color="#0284C7" style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>Cátedra & Módulos Científicos (Dr. Stalin Santacruz)</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Herramientas formativas, bioquímica del gel, aprendizaje continuo y certificación bioestadística:
              </Text>
            </View>

            <View style={styles.pedagogicalGrid}>
              <Pressable
                style={styles.pedagogicalCard}
                onPress={() => navigation.navigate('Bioquimica')}
              >
                <View style={[styles.pedCardIconBg, { backgroundColor: '#E0F2FE' }]}>
                  <ScientificIcon name="dna" size={24} color="#0284C7" />
                </View>
                <Text style={styles.pedCardTitle}>Bioquímica & Escala pH</Text>
                <Text style={styles.pedCardSub}>3 etapas, micelas de caseína y escala interactiva de pH</Text>
              </Pressable>

              <Pressable
                style={styles.pedagogicalCard}
                onPress={() => navigation.navigate('DemostradorVivo')}
              >
                <View style={[styles.pedCardIconBg, { backgroundColor: '#FEF3C7' }]}>
                  <ScientificIcon name="clock" size={24} color="#D97706" />
                </View>
                <Text style={styles.pedCardTitle}>Demostrador en Vivo</Text>
                <Text style={styles.pedCardSub}>Exposiciones y simulación pedagógica para evaluación</Text>
              </Pressable>

              <Pressable
                style={styles.pedagogicalCard}
                onPress={() => navigation.navigate('FeedbackLoop')}
              >
                <View style={[styles.pedCardIconBg, { backgroundColor: '#EDE9FE' }]}>
                  <ScientificIcon name="brain" size={24} color="#7C3AED" />
                </View>
                <Text style={styles.pedCardTitle}>Feedback Loop</Text>
                <Text style={styles.pedCardSub}>Aprendizaje continuo con nuevos lotes concluidos</Text>
              </Pressable>

              <Pressable
                style={styles.pedagogicalCard}
                onPress={() => navigation.navigate('MetricasModelo')}
              >
                <View style={[styles.pedCardIconBg, { backgroundColor: '#DCFCE7' }]}>
                  <ScientificIcon name="metrics" size={24} color="#059669" />
                </View>
                <Text style={styles.pedCardTitle}>Métricas Científicas</Text>
                <Text style={styles.pedCardSub}>Validación R² = 0.9774 y matriz de los 6 lotes</Text>
              </Pressable>
            </View>
          </View>

        </View>

        {/* PIE DE PÁGINA A ANCHO COMPLETO (100% ESTIRADO DE IZQUIERDA A DERECHA) */}
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
    paddingTop: 20,
    paddingBottom: 20,
  },
  profileBanner: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BAE6FD',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    shadowColor: '#0284C7',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  profileBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 260,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 24,
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
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  profileBadgeText: {
    fontSize: 10.5,
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
    gap: 8,
  },
  profileArchiveBtn: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileArchiveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  profileSwitchBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSwitchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  batchHeroPanel: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  batchHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  batchEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  batchHeroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  batchHeroCode: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  batchHeroSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    maxWidth: 620,
  },
  batchMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  infoPill: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '700',
  },
  dashboardSplitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 24,
  },
  splitLeftCol: {
    flex: 1,
    minWidth: 320,
  },
  splitRightCol: {
    flex: 1.4,
    minWidth: 420,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  inputPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  inputGrid: {
    gap: 12,
  },
  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  qaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    minWidth: 150,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaPrimary: {
    backgroundColor: '#0284C7',
  },
  qaSim: {
    backgroundColor: '#D97706',
  },
  qaLive: {
    backgroundColor: '#059669',
  },
  qaArch: {
    backgroundColor: '#475569',
  },
  qaBtnTextWhite: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pedagogicalPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  pedagogicalHeader: {
    marginBottom: 16,
  },
  pedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pedagogicalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  pedagogicalCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 12,
    padding: 16,
  },
  pedCardIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  pedCardIcon: {
    fontSize: 20,
  },
  pedCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  pedCardSub: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
});
