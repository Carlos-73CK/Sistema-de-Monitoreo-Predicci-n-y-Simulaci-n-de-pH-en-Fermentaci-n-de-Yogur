import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

/**
 * Gráfico Cinético Dinámico e Interactivo (Modelo Hill - ULEAM)
 * Ofrece curvas continuas orgánicas con splines de Bezier, gradientes de llenado,
 * animación interactiva con mouse/hover, tooltips dinámicos con valores de pH y °Brix,
 * línea de corte crítica (pH 4.50) y superposición de curva de referencia.
 */
export default function KineticCurveChart({
  puntos = [],
  titulo = 'Curva Cinética de Acidificación de pH',
  subtitulo = 'Caída continua de pH vs tiempo hasta corte en pH 4.50',
  showSuperponerToggle = true,
  defaultSuperponer = true,
  lecturasReales = [],
  tiempoCorteMinutos = 255,
}) {
  const [superponer, setSuperponer] = useState(defaultSuperponer);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Parámetros de lienzo SVG
  const width = 680;
  const height = 300;
  const padLeft = 56;
  const padRight = 56;
  const padTop = 32;
  const padBottom = 48;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Escalas matemáticas
  const maxMinutos = Math.max(
    360,
    tiempoCorteMinutos ? tiempoCorteMinutos + 60 : 360,
    ...puntos.map((p) => p.minutos || 0),
  );

  const minPh = 4.0;
  const maxPh = 7.0;

  const getX = (min) => padLeft + (Math.max(0, min) / maxMinutos) * plotW;
  const getY = (ph) =>
    padTop + ((maxPh - Math.max(minPh, Math.min(maxPh, ph))) / (maxPh - minPh)) * plotH;

  // Puntos nominales calculados (Curva proyectada)
  const sortedPuntos =
    puntos && puntos.length > 0
      ? [...puntos].sort((a, b) => a.minutos - b.minutos)
      : [
          { minutos: 0, ph: 6.68, brix: 10.5 },
          { minutos: 60, ph: 6.20, brix: 9.8 },
          { minutos: 120, ph: 5.45, brix: 8.6 },
          { minutos: 180, ph: 4.85, brix: 7.4 },
          { minutos: 240, ph: 4.55, brix: 6.0 },
          { minutos: 255, ph: 4.50, brix: 5.7 },
        ];

  // Generador de Spline Cúbico suave (Bezier)
  const buildSmoothPath = (pts) => {
    if (!pts || pts.length === 0) return '';
    if (pts.length === 1) return `M ${getX(pts[0].minutos)},${getY(pts[0].ph)}`;

    const coords = pts.map((p) => ({ x: getX(p.minutos), y: getY(p.ph) }));
    let d = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;

    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = i > 0 ? coords[i - 1] : coords[i];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = i < coords.length - 2 ? coords[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const linePath = buildSmoothPath(sortedPuntos);

  // Área sombreada bajo la curva
  const firstX = getX(sortedPuntos[0].minutos);
  const lastX = getX(sortedPuntos[sortedPuntos.length - 1].minutos);
  const bottomY = padTop + plotH;
  const areaPath = `${linePath} L ${lastX.toFixed(1)},${bottomY} L ${firstX.toFixed(1)},${bottomY} Z`;

  // Curva Óptima ULEAM de referencia (42 °C / 7.5% Chivería -> Corte exacto 255m a 4.50)
  const puntosOptimos = [
    { minutos: 0, ph: 6.68 },
    { minutos: 60, ph: 6.22 },
    { minutos: 120, ph: 5.48 },
    { minutos: 180, ph: 4.88 },
    { minutos: 240, ph: 4.54 },
    { minutos: 255, ph: 4.50 },
  ];
  const optimalLinePath = buildSmoothPath(puntosOptimos);

  // Coordenada Y de corte constante 4.50
  const yCorte450 = getY(4.50);

  // Ticks de ejes
  const phTicks = [7.0, 6.5, 6.0, 5.5, 5.0, 4.5, 4.0];
  const brixTicks = [
    { ph: 7.0, brix: '10.5' },
    { ph: 6.0, brix: '9.0' },
    { ph: 5.0, brix: '7.5' },
    { ph: 4.5, brix: '5.7' },
  ];
  const timeHours = [0, 1, 2, 3, 4, 5, 6].filter((h) => h * 60 <= maxMinutos);

  // Punto activo para tooltip (por hover o por selección)
  const activeIdx = hoverIndex !== null ? hoverIndex : selectedIndex;
  const activePt = activeIdx !== null && sortedPuntos[activeIdx] ? sortedPuntos[activeIdx] : null;

  return (
    <View style={styles.cardContainer}>
      {/* Barra de Título y Controles */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.cardTitle}>{titulo}</Text>
          <Text style={styles.cardSubtitle}>{subtitulo}</Text>
        </View>

        <View style={styles.controlsRow}>
          {showSuperponerToggle ? (
            <Pressable
              style={[styles.toggleBtn, superponer && styles.toggleBtnActive]}
              onPress={() => setSuperponer(!superponer)}
            >
              <Text style={[styles.toggleBtnText, superponer && styles.toggleBtnTextActive]}>
                {superponer ? '⭐ Superpuesto con Óptimo' : '👁️ Modo Simple'}
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.interactivePill}>
            <Text style={styles.interactivePillText}>🖱️ Pasa el mouse o toca los puntos</Text>
          </View>
        </View>
      </View>

      {/* Contenedor del Lienzo Gráfico Interactivo SVG */}
      <View style={styles.svgWrapper}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Gradiente de relleno cian/azul para la curva */}
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.00" />
            </linearGradient>

            {/* Gradiente para tooltip */}
            <linearGradient id="tooltipBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>

            {/* Filtro de sombra para tooltip */}
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Líneas horizontales de cuadrícula (pH) */}
          {phTicks.map((val) => {
            const y = getY(val);
            const isTarget = val === 4.5;
            return (
              <g key={`grid-ph-${val}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={isTarget ? '#EF4444' : '#E2E8F0'}
                  strokeWidth={isTarget ? 2 : 1}
                  strokeDasharray={isTarget ? '6 4' : '3 3'}
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight={isTarget ? '900' : '600'}
                  fill={isTarget ? '#DC2626' : '#64748B'}
                  fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
                >
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Eje Derecho: Azúcares (°Brix) */}
          {brixTicks.map((bt) => {
            const y = getY(bt.ph);
            return (
              <text
                key={`brix-${bt.brix}`}
                x={width - padRight + 10}
                y={y + 4}
                textAnchor="start"
                fontSize="10"
                fontWeight="700"
                fill="#D97706"
                fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
              >
                {bt.brix}°Bx
              </text>
            );
          })}

          {/* Líneas verticales de cuadrícula (Horas) */}
          {timeHours.map((h) => {
            const x = getX(h * 60);
            return (
              <g key={`grid-time-${h}`}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + plotH}
                  stroke="#F1F5F9"
                  strokeWidth="1.2"
                />
                <text
                  x={x}
                  y={padTop + plotH + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#475569"
                  fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
                >
                  {h}h ({h * 60}m)
                </text>
              </g>
            );
          })}

          {/* Etiqueta de Corte Crítico pH 4.50 */}
          <rect
            x={width - padRight - 150}
            y={yCorte450 - 20}
            width="142"
            height="18"
            rx="5"
            fill="#FEE2E2"
            stroke="#EF4444"
            strokeWidth="1.2"
          />
          <text
            x={width - padRight - 79}
            y={yCorte450 - 7}
            textAnchor="middle"
            fontSize="10"
            fontWeight="900"
            fill="#B91C1C"
            fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
          >
            🎯 CORTE pH 4.50 CONSTANTE
          </text>

          {/* Curva Óptima Superpuesta (Si está activa) */}
          {superponer ? (
            <g>
              <path
                d={optimalLinePath}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.8"
                strokeDasharray="6 4"
              />
              <circle
                cx={getX(255)}
                cy={getY(4.50)}
                r="6"
                fill="#10B981"
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
            </g>
          ) : null}

          {/* Área sombreada bajo la curva proyectada */}
          <path d={areaPath} fill="url(#curveGradient)" />

          {/* Curva Cinética Principal Suave con brillo */}
          <path
            d={linePath}
            fill="none"
            stroke="#0284C7"
            strokeWidth="3.6"
            strokeLinecap="round"
          />

          {/* Línea guía vertical interactiva cuando se hace hover */}
          {activePt ? (
            <line
              x1={getX(activePt.minutos)}
              y1={padTop}
              x2={getX(activePt.minutos)}
              y2={bottomY}
              stroke="#0284C7"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.8"
            />
          ) : null}

          {/* Puntos interactivos sobre la curva proyectada con Hover & Animación */}
          {sortedPuntos.map((pt, idx) => {
            const cx = getX(pt.minutos);
            const cy = getY(pt.ph);
            const isCut = pt.ph <= 4.52;
            const isHovered = hoverIndex === idx || selectedIndex === idx;

            return (
              <g
                key={`pt-${idx}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoverIndex(idx)}
                onClick={() => setSelectedIndex(idx)}
              >
                {/* Halo pulsante animado al pasar el mouse */}
                {isHovered ? (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isCut ? 16 : 13}
                    fill="none"
                    stroke={isCut ? '#EF4444' : '#38BDF8'}
                    strokeWidth="3"
                    opacity="0.6"
                  >
                    <animate
                      attributeName="r"
                      values={isCut ? '12;18;12' : '10;15;10'}
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                ) : null}

                {/* Círculo del punto */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 8 : isCut ? 6.5 : 5}
                  fill={isCut ? '#EF4444' : isHovered ? '#0284C7' : '#0369A1'}
                  stroke="#FFFFFF"
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ transition: 'r 0.2s ease, fill 0.2s ease' }}
                />

                {/* Área de captura invisible más grande para facilitar el toque/hover */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="20"
                  fill="transparent"
                />
              </g>
            );
          })}

          {/* Lecturas reales de matraz (si existen) */}
          {lecturasReales &&
            lecturasReales.map((lec, idx) => {
              const cx = getX(lec.tiempo_minutos ?? lec.minutos ?? 0);
              const cy = getY(lec.ph ?? 6.6);
              return (
                <g key={`real-${idx}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r="6"
                    fill="#F59E0B"
                    stroke="#0F172A"
                    strokeWidth="2"
                  />
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="800"
                    fill="#0F172A"
                  >
                    {lec.ph.toFixed(2)}
                  </text>
                </g>
              );
            })}

          {/* Tooltip Dinámico Flotante en el Canvas */}
          {activePt ? (
            (() => {
              const tx = getX(activePt.minutos);
              const ty = getY(activePt.ph);
              const isRightSide = tx > width - 180;
              const boxX = isRightSide ? tx - 165 : tx + 12;
              const boxY = Math.max(padTop, ty - 60);

              return (
                <g filter="url(#shadow)">
                  <rect
                    x={boxX}
                    y={boxY}
                    width="155"
                    height="58"
                    rx="8"
                    fill="url(#tooltipBg)"
                    stroke="#38BDF8"
                    strokeWidth="1.2"
                  />
                  <text
                    x={boxX + 10}
                    y={boxY + 18}
                    fontSize="10.5"
                    fontWeight="800"
                    fill="#38BDF8"
                    fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
                  >
                    ⏱️ {activePt.minutos} min ({(activePt.minutos / 60).toFixed(1)} h)
                  </text>
                  <text
                    x={boxX + 10}
                    y={boxY + 34}
                    fontSize="11"
                    fontWeight="900"
                    fill="#FFFFFF"
                    fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
                  >
                    pH: {activePt.ph.toFixed(2)}{' '}
                    {activePt.ph <= 4.52 ? '(Corte Crítico)' : ''}
                  </text>
                  <text
                    x={boxX + 10}
                    y={boxY + 49}
                    fontSize="10"
                    fontWeight="600"
                    fill="#CBD5E1"
                    fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
                  >
                    Azúcar: {activePt.brix ? `${activePt.brix} °Bx` : '--'}
                  </text>
                </g>
              );
            })()
          ) : null}
        </svg>
      </View>

      {/* Inspector de Punto Seleccionado / Tocado */}
      {activePt ? (
        <View style={styles.inspectorCard}>
          <View style={styles.inspectorRow}>
            <View style={styles.inspectorBadge}>
              <Text style={styles.inspectorBadgeLabel}>Hito Activo</Text>
              <Text style={styles.inspectorBadgeVal}>
                {activePt.minutos} min ({(activePt.minutos / 60).toFixed(2)} h)
              </Text>
            </View>

            <View style={styles.inspectorBadge}>
              <Text style={styles.inspectorBadgeLabel}>pH Proyectado</Text>
              <Text
                style={[
                  styles.inspectorBadgeVal,
                  { color: activePt.ph <= 4.52 ? '#DC2626' : '#0284C7' },
                ]}
              >
                {activePt.ph.toFixed(2)}
              </Text>
            </View>

            <View style={styles.inspectorBadge}>
              <Text style={styles.inspectorBadgeLabel}>Consumo Azúcar</Text>
              <Text style={[styles.inspectorBadgeVal, { color: '#D97706' }]}>
                {activePt.brix ? `${activePt.brix} °Brix` : '--'}
              </Text>
            </View>

            <View style={styles.inspectorBadge}>
              <Text style={styles.inspectorBadgeLabel}>Estado del Gel</Text>
              <Text
                style={[
                  styles.inspectorBadgeVal,
                  { color: activePt.ph <= 4.52 ? '#10B981' : '#475569' },
                ]}
              >
                {activePt.ph <= 4.52 ? '🎯 Coagulación Óptima' : 'En Acidificación'}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Leyenda y Detalles Bioestadísticos */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#0284C7' }]} />
          <Text style={styles.legendText}>Curva Proyectada (Hill R²=0.9774)</Text>
        </View>

        {superponer ? (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { borderColor: '#10B981', borderStyle: 'dashed' }]} />
            <Text style={[styles.legendText, { color: '#047857' }]}>
              Óptimo ULEAM (42 °C / 7.5% - 4.25 h)
            </Text>
          </View>
        ) : null}

        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { borderColor: '#EF4444', borderStyle: 'dashed' }]} />
          <Text style={[styles.legendText, { color: '#DC2626' }]}>Corte Estricto pH 4.50</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
          <Text style={[styles.legendText, { color: '#B45309' }]}>Consumo Azúcar (°Brix)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    marginVertical: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  titleCol: {
    flex: 1,
    minWidth: 260,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  toggleBtn: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1.2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  toggleBtnTextActive: {
    color: '#047857',
  },
  interactivePill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  interactivePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  svgWrapper: {
    width: '100%',
    backgroundColor: '#FAFCFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    overflow: 'hidden',
  },
  inspectorCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  inspectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  inspectorBadge: {
    flex: 1,
    minWidth: 110,
  },
  inspectorBadgeLabel: {
    fontSize: 10,
    color: '#0369A1',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  inspectorBadgeVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 18,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLine: {
    width: 18,
    height: 0,
    borderTopWidth: 2.5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
});
