import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ensayosService from '../services/ensayosService';
import theme from '../styles/theme';

export default function EnsayosArchivadosScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [filtroModo, setFiltroModo] = useState('mis_muestras'); // 'mis_muestras' | 'todos'
  const [busqueda, setBusqueda] = useState('');
  const [ensayos, setEnsayos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [exportandoId, setExportandoId] = useState(null);
  const [textoExportadoModal, setTextoExportadoModal] = useState(null);

  const cargarEnsayos = useCallback(async () => {
    try {
      setCargando(true);
      const soloMios = filtroModo === 'mis_muestras';
      const usuarioEmail = soloMios && user ? user.email : null;

      const datos = await ensayosService.getEnsayos({
        usuarioEmail,
        misEnsayos: soloMios,
      });

      setEnsayos(Array.isArray(datos) ? datos : []);
    } catch (err) {
      console.warn('[EnsayosArchivados] Error al cargar lista:', err.message);
      setEnsayos([]);
    } finally {
      setCargando(false);
    }
  }, [filtroModo, user]);

  useEffect(() => {
    cargarEnsayos();
  }, [cargarEnsayos]);

  // Filtrado reactivo por término de búsqueda
  const ensayosFiltrados = ensayos.filter((e) => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return true;
    const lote = String(e.lote_id || '').toLowerCase();
    const inv = String(e.investigador || '').toLowerCase();
    const sustrato = String(e.tipo_sustrato || '').toLowerCase();
    return lote.includes(term) || inv.includes(term) || sustrato.includes(term);
  });

  const handleEliminarEnsayo = (loteId) => {
    const confirmMessage = `¿Estás seguro de eliminar el lote ${loteId} de SQLite? Esta acción no se puede deshacer.`;

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        ejecutarEliminacion(loteId);
      }
    } else {
      Alert.alert('Confirmar Eliminación', confirmMessage, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => ejecutarEliminacion(loteId),
        },
      ]);
    }
  };

  const ejecutarEliminacion = async (loteId) => {
    try {
      await ensayosService.eliminarEnsayo(loteId);
      cargarEnsayos();
    } catch (err) {
      console.error('Error al eliminar lote:', err);
      Alert.alert('Error', 'No fue posible eliminar el lote seleccionado.');
    }
  };

  const handleExportar = async (loteId, formato) => {
    try {
      setExportandoId(loteId);
      const data = await ensayosService.exportarEnsayo(loteId, formato);

      if (formato === 'csv') {
        const csvContent = typeof data === 'string' ? data : JSON.stringify(data);
        if (Platform.OS === 'web') {
          // Descarga directa en navegador
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${loteId}_lecturas.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          setTextoExportadoModal({ titulo: `Exportación CSV (${loteId})`, contenido: csvContent });
        }
      } else {
        const jsonContent = JSON.stringify(data, null, 2);
        if (Platform.OS === 'web') {
          const blob = new Blob([jsonContent], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${loteId}_ensayo.json`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          setTextoExportadoModal({ titulo: `Exportación JSON (${loteId})`, contenido: jsonContent });
        }
      }
    } catch (err) {
      console.error('Error al exportar lote:', err);
      Alert.alert('Error al exportar', 'No se pudieron descargar los datos del ensayo.');
    } finally {
      setExportandoId(null);
    }
  };

  // Estadísticas rápidas
  const totalEnsayos = ensayosFiltrados.length;
  const completados = ensayosFiltrados.filter((e) => {
    const lecturas = e.lecturas || [];
    const ultimoPh = lecturas.length > 0 ? lecturas[lecturas.length - 1].ph : 7.0;
    return e.estado === 'completado' || ultimoPh <= 4.5;
  }).length;
  const enCurso = totalEnsayos - completados;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Banco de Ensayos Experimentales</Text>
        <Text style={styles.title}>Ensayos & Lotes Archivados</Text>
        <Text style={styles.subtitle}>
          Persistencia garantizada en SQLite con trazabilidad y aislamiento de muestras por investigador.
        </Text>
      </View>

      {/* Selector de Modo: Mis Muestras vs Todos los Lotes */}
      <View style={styles.tabSwitcher}>
        <Pressable
          style={[
            styles.switchBtn,
            filtroModo === 'mis_muestras' && styles.switchBtnActive,
          ]}
          onPress={() => setFiltroModo('mis_muestras')}
        >
          <Text
            style={[
              styles.switchBtnText,
              filtroModo === 'mis_muestras' && styles.switchBtnTextActive,
            ]}
          >
            👤 Mis Muestras ({user?.nombre ? user.nombre.split(' ')[0] : 'Mi Perfil'})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.switchBtn,
            filtroModo === 'todos' && styles.switchBtnActive,
          ]}
          onPress={() => setFiltroModo('todos')}
        >
          <Text
            style={[
              styles.switchBtnText,
              filtroModo === 'todos' && styles.switchBtnTextActive,
            ]}
          >
            🌐 Todos los Lotes del Laboratorio
          </Text>
        </Pressable>
      </View>

      {/* Barra de Búsqueda y Botón Refrescar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Buscar por código de lote, sustrato o responsable..."
          placeholderTextColor="#94A3B8"
          value={busqueda}
          onChangeText={setBusqueda}
        />
        <Pressable style={styles.refreshBtn} onPress={cargarEnsayos}>
          <Text style={styles.refreshBtnText}>🔄</Text>
        </Pressable>
      </View>

      {/* Resumen de Métricas */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{totalEnsayos}</Text>
          <Text style={styles.statLabel}>Total Lotes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#059669' }]}>{completados}</Text>
          <Text style={styles.statLabel}>pH ≤ 4.50 (Corte)</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#0284C7' }]}>{enCurso}</Text>
          <Text style={styles.statLabel}>En Incubación</Text>
        </View>
      </View>

      {/* Lista de Ensayos */}
      {cargando ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Cargando ensayos desde SQLite...</Text>
        </View>
      ) : ensayosFiltrados.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🧪</Text>
          <Text style={styles.emptyTitle}>
            {filtroModo === 'mis_muestras'
              ? 'No tienes muestras archivadas aún'
              : 'No se encontraron lotes con ese criterio'}
          </Text>
          <Text style={styles.emptySub}>
            Inicia un nuevo ensayo de fermentación o ejecuta el simulador cinético para registrar datos.
          </Text>
          <Pressable
            style={styles.btnCrearEmpty}
            onPress={() => navigation.navigate('NuevoEnsayo')}
          >
            <Text style={styles.btnCrearEmptyText}>➕ Iniciar Nuevo Ensayo</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cardsList}>
          {ensayosFiltrados.map((item) => {
            const lecturas = item.lecturas || [];
            const cantLecturas = lecturas.length;
            const ultimaLectura = cantLecturas > 0 ? lecturas[cantLecturas - 1] : null;
            const phFin = ultimaLectura ? Number(ultimaLectura.ph) : null;
            const temp = Number(item.temperatura_c || 42.0);
            const esOptimoPh = phFin !== null && phFin <= 4.5;
            const fueraRangoTermico = temp < 41.0 || temp > 43.0;

            return (
              <View key={item.lote_id || item.id} style={styles.ensayoCard}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleBlock}>
                    <Text style={styles.loteBadgeText}>{item.lote_id}</Text>
                    <Text style={styles.investigadorText}>
                      👤 {item.investigador || 'Investigador ULEAM'}
                    </Text>
                  </View>

                  {/* Estado Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      esOptimoPh
                        ? styles.statusOptimo
                        : fueraRangoTermico
                        ? styles.statusTermico
                        : styles.statusProceso,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        esOptimoPh
                          ? styles.statusOptimoText
                          : fueraRangoTermico
                          ? styles.statusTermicoText
                          : styles.statusProcesoText,
                      ]}
                    >
                      {esOptimoPh
                        ? '✅ pH 4.50 Corte'
                        : fueraRangoTermico
                        ? '⚠️ Alerta Térmica'
                        : '⏱️ En Incubación'}
                    </Text>
                  </View>
                </View>

                {/* Parámetros Fisicoquímicos */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaPill}>
                    🥛 {String(item.tipo_sustrato || 'vaca').toUpperCase()}
                  </Text>
                  <Text style={styles.metaPill}>
                    🍬 {String(item.tipo_azucar || 'lactosa').toUpperCase()}
                  </Text>
                  <Text style={styles.metaPill}>
                    🌡️ {temp.toFixed(1)} °C
                  </Text>
                  <Text style={styles.metaPill}>
                    ⚖️ {item.masa_inoculo_g || 18.75} g ({((Number(item.masa_inoculo_g || 18.75) / Number(item.volumen_ml || 250)) * 100).toFixed(1)}%)
                  </Text>
                </View>

                {/* Resumen de Lecturas */}
                <View style={styles.lecturasSummaryRow}>
                  <Text style={styles.lecturasCountText}>
                    📊 {cantLecturas} {cantLecturas === 1 ? 'lectura registrada' : 'lecturas registradas'}
                    {phFin !== null && ` • Último pH: ${phFin.toFixed(2)}`}
                  </Text>
                </View>

                {/* Botones de Acción */}
                <View style={styles.cardActionsRow}>
                  <Pressable
                    style={styles.actionBtnMonitor}
                    onPress={() =>
                      navigation.navigate('Monitoreo', {
                        ensayo: {
                          id: item.id,
                          codigo: item.lote_id,
                          loteId: item.lote_id,
                          tipoSustrato: item.tipo_sustrato,
                          masaInoculoG: item.masa_inoculo_g,
                          temperaturaObjetivo: item.temperatura_c,
                        },
                      })
                    }
                  >
                    <Text style={styles.actionBtnMonitorText}>⏱️ Abrir Monitoreo</Text>
                  </Pressable>

                  <Pressable
                    style={styles.actionBtnExport}
                    onPress={() => handleExportar(item.lote_id, 'csv')}
                    disabled={exportandoId === item.lote_id}
                  >
                    <Text style={styles.actionBtnExportText}>
                      {exportandoId === item.lote_id ? '⏳' : '📥 CSV'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.actionBtnExport}
                    onPress={() => handleExportar(item.lote_id, 'json')}
                    disabled={exportandoId === item.lote_id}
                  >
                    <Text style={styles.actionBtnExportText}>
                      {exportandoId === item.lote_id ? '⏳' : '📄 JSON'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.actionBtnDelete}
                    onPress={() => handleEliminarEnsayo(item.lote_id)}
                  >
                    <Text style={styles.actionBtnDeleteText}>🗑️</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Modal de Texto Exportado (en Móvil) */}
      {textoExportadoModal && (
        <View style={styles.exportModalBackdrop}>
          <View style={styles.exportModalBox}>
            <Text style={styles.exportModalTitle}>{textoExportadoModal.titulo}</Text>
            <ScrollView style={styles.exportModalScroll}>
              <Text style={styles.exportModalCode}>{textoExportadoModal.contenido}</Text>
            </ScrollView>
            <Pressable
              style={styles.exportModalCloseBtn}
              onPress={() => setTextoExportadoModal(null)}
            >
              <Text style={styles.exportModalCloseBtnText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      )}
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
    marginBottom: theme.spacing.md,
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
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: theme.radii.md,
    padding: 4,
    marginBottom: theme.spacing.md,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: theme.radii.sm,
  },
  switchBtnActive: {
    backgroundColor: '#FFFFFF',
    ...theme.shadows.card,
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  switchBtnTextActive: {
    color: theme.colors.primary,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    fontSize: 13,
    color: theme.colors.text,
  },
  refreshBtn: {
    width: 42,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtnText: {
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 400,
    lineHeight: 18,
  },
  btnCrearEmpty: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    marginTop: 16,
  },
  btnCrearEmptyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  cardsList: {
    gap: 12,
  },
  ensayoCard: {
    backgroundColor: '#FFFFFF',
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleBlock: {
    flex: 1,
  },
  loteBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  investigadorText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusOptimo: {
    backgroundColor: '#DCFCE7',
  },
  statusOptimoText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
  },
  statusTermico: {
    backgroundColor: '#FEF3C7',
  },
  statusTermicoText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
  },
  statusProceso: {
    backgroundColor: '#E0F2FE',
  },
  statusProcesoText: {
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metaPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  lecturasSummaryRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginBottom: 10,
  },
  lecturasCountText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtnMonitor: {
    flex: 2,
    minWidth: 140,
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
  },
  actionBtnMonitorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnExport: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radii.sm,
  },
  actionBtnExportText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  actionBtnDelete: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: theme.radii.sm,
  },
  actionBtnDeleteText: {
    fontSize: 12,
  },
  exportModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  exportModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxHeight: '80%',
  },
  exportModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  exportModalScroll: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exportModalCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#334155',
  },
  exportModalCloseBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  exportModalCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
