import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

/**
 * Catálogo de Iconografía Científica y Biotecnológica Vectorial (SVG)
 * Diseñado exclusivamente para PrediYogur (ULEAM).
 * Reemplaza los emojis genéricos por vectores nítidos, modernos y con colores temáticos.
 */

export function ScientificIcon({ name, size = 20, color = '#0284C7', style }) {
  if (Platform.OS !== 'web') {
    // Fallback nativo defensivo
    const fallbackMap = {
      flask: '🧪',
      ph: '🎯',
      droplet: '💧',
      kinetic: '📈',
      clock: '⏱️',
      archive: '📁',
      dna: '🧬',
      metrics: '📊',
      thermometer: '🌡️',
      spark: '⚡',
      microscope: '🔬',
      home: '🏠',
      user: '👤',
      plus: '➕',
      download: '💾',
      check: '✓',
      alert: '⚠',
    };
    return <Text style={[{ fontSize: size * 0.85, color }, style]}>{fallbackMap[name] || '•'}</Text>;
  }

  // Renderizado SVG Web puro de alta definición
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style },
  };

  switch (name) {
    case 'flask':
    case 'fermentador':
      // Matraz Erlenmeyer con nivel de fermentación y burbujas lácteas
      return (
        <svg {...commonProps}>
          <path d="M10 2v5.5L4.4 17.2A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.1-3.8L14 7.5V2" />
          <line x1="8.5" y1="2" x2="15.5" y2="2" />
          <path d="M7 16h10" strokeDasharray="2 2" strokeWidth="1.5" />
          <circle cx="10" cy="18" r="0.8" fill={color} />
          <circle cx="13" cy="17" r="1.2" fill={color} />
          <circle cx="15" cy="19" r="0.8" fill={color} />
        </svg>
      );

    case 'ph':
    case 'probe':
      // Sensor electroquímico de pH con punta de inmersión y haz de medición
      return (
        <svg {...commonProps}>
          <rect x="9" y="2" width="6" height="12" rx="1.5" />
          <path d="M12 14v4" />
          <circle cx="12" cy="19.5" r="1.5" fill={color} />
          <path d="M8 8h8" strokeWidth="1.2" />
          <path d="M8 5h8" strokeWidth="1.2" />
          <path d="M6 19.5c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
        </svg>
      );

    case 'droplet':
    case 'viscosity':
    case 'reologia':
      // Gota láctea con ondas de viscosidad y firmeza de gel
      return (
        <svg {...commonProps}>
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          <path d="M9 13a3 3 0 0 0 3 3" strokeWidth="1.5" />
          <circle cx="12" cy="18" r="1.5" fill={color} opacity="0.8" />
        </svg>
      );

    case 'kinetic':
    case 'curve':
    case 'hill':
      // Curva sigmoidea biofísica de Hill con puntos de inflexión
      return (
        <svg {...commonProps}>
          <line x1="3" y1="21" x2="21" y2="21" />
          <line x1="3" y1="3" x2="3" y2="21" />
          <path d="M4 6c5 0 7 12 16 12" strokeWidth="2.4" />
          <circle cx="12" cy="12" r="2.2" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="18" cy="17.5" r="1.8" fill={color} stroke="#FFFFFF" strokeWidth="1" />
        </svg>
      );

    case 'clock':
    case 'timer':
    case 'realtime':
      // Cronómetro de precisión de fermentación con corte
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="13" r="8" />
          <polyline points="12 9 12 13 15 15" />
          <path d="M12 2v3" />
          <path d="M10 2h4" />
        </svg>
      );

    case 'archive':
    case 'folder':
    case 'muestras':
      // Archivador de muestras de laboratorio con etiquetas
      return (
        <svg {...commonProps}>
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="16" x2="13" y2="16" />
        </svg>
      );

    case 'dna':
    case 'bioquimica':
    case 'micela':
      // Estructura molecular / micelas de caseína
      return (
        <svg {...commonProps}>
          <path d="M4 19a10 10 0 0 1 16-14" />
          <path d="M4 5a10 10 0 0 1 16 14" />
          <line x1="6.5" y1="9" x2="17.5" y2="9" strokeWidth="1.5" />
          <line x1="6.5" y1="15" x2="17.5" y2="15" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="2.5" fill={color} opacity="0.6" />
        </svg>
      );

    case 'metrics':
    case 'chart':
    case 'stats':
      // Gráfico de barras científicas con línea de tendencia R²
      return (
        <svg {...commonProps}>
          <line x1="18" y1="20" x2="18" y2="10" strokeWidth="2.5" />
          <line x1="12" y1="20" x2="12" y2="4" strokeWidth="2.5" />
          <line x1="6" y1="20" x2="6" y2="14" strokeWidth="2.5" />
          <path d="M3 16l6-8 6 4 6-9" strokeWidth="1.6" stroke={color === '#0284C7' ? '#10B981' : color} />
        </svg>
      );

    case 'thermometer':
    case 'temperatura':
      // Termómetro graduado de laboratorio a 42 °C
      return (
        <svg {...commonProps}>
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
          <circle cx="11.5" cy="17.5" r="2" fill={color} />
          <line x1="11.5" y1="12" x2="11.5" y2="17" strokeWidth="1.8" />
          <line x1="14" y1="6" x2="16.5" y2="6" strokeWidth="1.2" />
          <line x1="14" y1="9" x2="16.5" y2="9" strokeWidth="1.2" />
        </svg>
      );

    case 'spark':
    case 'simulacion':
    case 'whatif':
      // Rayo cinético / cálculo predictivo what-if
      return (
        <svg {...commonProps}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} fillOpacity="0.25" />
        </svg>
      );

    case 'microscope':
    case 'catedra':
    case 'investigacion':
      // Microscopio de laboratorio bromatológico
      return (
        <svg {...commonProps}>
          <path d="M6 18h8" />
          <path d="M3 22h18" />
          <path d="M14 22a7 7 0 1 0 0-14h-1" />
          <path d="M9 14h2" />
          <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
          <path d="M12 6V3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3" />
        </svg>
      );

    case 'home':
    case 'panel':
      // Casa / panel principal
      return (
        <svg {...commonProps}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );

    case 'user':
    case 'investigador':
      // Investigador con gafete
      return (
        <svg {...commonProps}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );

    case 'plus':
    case 'nuevo':
      // Añadir nuevo lote
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );

    case 'download':
    case 'export':
      // Exportar datos
      return (
        <svg {...commonProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );

    case 'check':
    case 'exito':
      // Verificación exitosa
      return (
        <svg {...commonProps}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );

    case 'alert':
    case 'alerta':
      // Advertencia de fermentación
      return (
        <svg {...commonProps}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );

    case 'brain':
    case 'feedback':
    case 'ia':
      // Red neuronal / feedback loop de inteligencia artificial
      return (
        <svg {...commonProps}>
          <path d="M12 2a5 5 0 0 1 5 5c0 1.2-.4 2.3-1.1 3.2.7.9 1.1 2 1.1 3.2a5 5 0 0 1-4.9 5" />
          <path d="M12 2a5 5 0 0 0-5 5c0 1.2.4 2.3 1.1 3.2C7.4 11.1 7 12.2 7 13.4A5 5 0 0 0 11.9 18.4" />
          <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 2" />
          <circle cx="8" cy="8" r="1.5" fill={color} />
          <circle cx="16" cy="8" r="1.5" fill={color} />
          <circle cx="16" cy="14" r="1.5" fill={color} />
          <circle cx="8" cy="14" r="1.5" fill={color} />
        </svg>
      );

    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
}

export default ScientificIcon;
