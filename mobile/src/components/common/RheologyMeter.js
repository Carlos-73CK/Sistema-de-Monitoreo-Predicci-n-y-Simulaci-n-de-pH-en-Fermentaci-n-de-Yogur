import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScientificIcon from './ScientificIcons';

/**
 * Escala Reológica Estimada (Firmeza del Gel Lácteo)
 * Representación visual graduada de viscosidad en mPa·s (cP)
 * Calibrada conforme a los ensayos del Dr. Stalin Gustavo Santacruz Terán (ULEAM).
 */
export default function RheologyMeter({
  viscosidadMpaS = 2639,
  targetMpaS = 2639,
}) {
  const numVisco = Number(viscosidadMpaS) || 0;

  // Rango escala: 0 a 3500 mPa·s
  const maxScale = 3500;
  const pinPercent = Math.max(2, Math.min(98, (numVisco / maxScale) * 100));

  // Diagnóstico reológico según valor
  let estadoText = 'Gel Firme Óptimo ULEAM';
  let estadoColor = '#10B981';
  let badgeBg = '#DCFCE7';

  if (numVisco < 900) {
    estadoText = 'Líquido / Riesgo Severo de Sinéresis';
    estadoColor = '#EF4444';
    badgeBg = '#FEE2E2';
  } else if (numVisco < 1700) {
    estadoText = 'Gel Suave / Viscosidad Baja';
    estadoColor = '#F59E0B';
    badgeBg = '#FEF3C7';
  } else if (numVisco < 2400) {
    estadoText = 'Gel Firme Estándar';
    estadoColor = '#0284C7';
    badgeBg = '#E0F2FE';
  } else if (numVisco >= 2400 && numVisco <= 3000) {
    estadoText = '⭐ Máxima Firmeza Micelar Óptima (2639 mPa·s)';
    estadoColor = '#10B981';
    badgeBg = '#DCFCE7';
  } else {
    estadoText = 'Gel Extra Compacto / Textura Densa';
    estadoColor = '#059669';
    badgeBg = '#D1FAE5';
  }

  return (
    <View style={styles.meterContainer}>
      {/* Cabecera del Medidor */}
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <View style={styles.meterTitleRow}>
            <ScientificIcon name="reologia" size={19} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.meterTitle}>Escala Reológica Estimada (Firmeza del Gel)</Text>
          </View>
          <Text style={styles.meterSubtitle}>
            Viscosímetro Brookfield (Rotor 4, 60 rpm a 10 °C al corte pH 4.50)
          </Text>
        </View>

        <View style={[styles.valBadge, { backgroundColor: badgeBg, borderColor: estadoColor }]}>
          <Text style={[styles.valNumber, { color: estadoColor }]}>
            {numVisco.toLocaleString('es-EC')}
          </Text>
          <Text style={[styles.valUnit, { color: estadoColor }]}>mPa·s (cP)</Text>
        </View>
      </View>

      {/* Pista de color graduada */}
      <View style={styles.trackWrapper}>
        <View style={styles.colorTrack}>
          <View style={[styles.trackSegment, { flex: 0.8, backgroundColor: '#EF4444' }]} />
          <View style={[styles.trackSegment, { flex: 0.7, backgroundColor: '#F59E0B' }]} />
          <View style={[styles.trackSegment, { flex: 1.1, backgroundColor: '#0284C7' }]} />
          <View style={[styles.trackSegment, { flex: 0.9, backgroundColor: '#10B981' }]} />
        </View>

        {/* Pin indicador dinámico */}
        <View style={[styles.pinIndicator, { left: `${pinPercent}%` }]}>
          <View style={[styles.pinCircle, { borderColor: estadoColor }]}>
            <View style={[styles.pinDot, { backgroundColor: estadoColor }]} />
          </View>
          <View style={[styles.pinPointer, { borderTopColor: estadoColor }]} />
        </View>
      </View>

      {/* Marcas y etiquetas de escala */}
      <View style={styles.labelsRow}>
        <Text style={styles.scaleLabel}>0 (Líquido)</Text>
        <Text style={styles.scaleLabel}>800 (Sinéresis)</Text>
        <Text style={styles.scaleLabel}>1500 (Estándar)</Text>
        <Text style={[styles.scaleLabel, styles.scaleLabelOptimo]}>2639 (Óptimo ULEAM)</Text>
        <Text style={styles.scaleLabel}>3500+</Text>
      </View>

      {/* Mensaje de estado bioquímico */}
      <View style={[styles.statusBox, { backgroundColor: badgeBg, borderLeftColor: estadoColor }]}>
        <Text style={[styles.statusText, { color: estadoColor }]}>
          {estadoText}
        </Text>
        <Text style={styles.ruleNote}>
          📋 Regla Dr. Santacruz: La viscosidad final se mide únicamente al final del ensayo (pH 4.50) tras refrigeración para no perturbar la red micelar tridimensional.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  meterContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  titleBlock: {
    flex: 1,
    minWidth: 220,
  },
  meterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meterTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  meterSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  valBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  valNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  valUnit: {
    fontSize: 11,
    fontWeight: '700',
  },
  trackWrapper: {
    position: 'relative',
    height: 32,
    justifyContent: 'center',
    marginVertical: 4,
  },
  colorTrack: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  trackSegment: {
    height: '100%',
  },
  pinIndicator: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    transform: [{ translateX: -10 }],
    zIndex: 10,
  },
  pinCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  pinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  scaleLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  scaleLabelOptimo: {
    color: '#047857',
    fontWeight: '800',
  },
  statusBox: {
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  ruleNote: {
    fontSize: 10.5,
    color: '#334155',
    lineHeight: 14,
  },
});
