import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import theme from '../../styles/theme';
import ScientificIcon from './ScientificIcons';

/**
 * Encabezado Institucional de Navegación con Retorno Claro al Panel Principal
 * Proporciona botón de retroceso intuitivo, migas de pan (breadcrumbs) y accesos directos vectoriales.
 */
export default function ScreenHeader({
  title,
  subtitle,
  icon = 'flask',
  navigation,
  showQuickActions = true,
}) {
  const handleBack = () => {
    if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('Dashboard');
    }
  };

  // Convertir emojis comunes a nombres de iconos si se pasan como prop
  const resolveIconName = (val) => {
    if (!val) return 'flask';
    if (val.includes('⚡') || val.includes('simul')) return 'spark';
    if (val.includes('⏱') || val.includes('tiempo') || val.includes('monit')) return 'clock';
    if (val.includes('📁') || val.includes('archivo') || val.includes('ensayo')) return 'archive';
    if (val.includes('🧬') || val.includes('bioquim')) return 'dna';
    if (val.includes('📊') || val.includes('metric')) return 'metrics';
    if (val.includes('➕') || val.includes('nuevo')) return 'plus';
    if (val.includes('🧠') || val.includes('feedback')) return 'brain';
    return val;
  };

  const iconName = resolveIconName(icon);

  return (
    <View style={styles.headerWrapper}>
      {/* Barra de Navegación y Retorno */}
      <View style={styles.navBar}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          onPress={handleBack}
          accessibilityLabel="Volver al Panel Principal"
        >
          <ScientificIcon name="home" size={14} color="#1D4ED8" style={{ marginRight: 6 }} />
          <Text style={styles.backBtnText}>Volver al Panel Principal</Text>
        </Pressable>

        {/* Migas de Pan (Breadcrumbs) */}
        <View style={styles.breadcrumbContainer}>
          <Pressable onPress={() => navigation?.navigate('Dashboard')} style={styles.breadRow}>
            <ScientificIcon name="home" size={13} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.breadcrumbLink}>Inicio</Text>
          </Pressable>
          <Text style={styles.breadcrumbSeparator}>›</Text>
          <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Accesos rápidos de cabecera */}
        {showQuickActions && navigation ? (
          <View style={styles.quickNav}>
            <Pressable
              style={styles.quickNavItem}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <ScientificIcon name="home" size={12} color="#0369A1" style={{ marginRight: 4 }} />
              <Text style={styles.quickNavText}>Panel</Text>
            </Pressable>
            <Pressable
              style={styles.quickNavItem}
              onPress={() => navigation.navigate('Simulacion')}
            >
              <ScientificIcon name="spark" size={12} color="#0369A1" style={{ marginRight: 4 }} />
              <Text style={styles.quickNavText}>Simulación</Text>
            </Pressable>
            <Pressable
              style={styles.quickNavItem}
              onPress={() => navigation.navigate('EnsayosArchivados')}
            >
              <ScientificIcon name="archive" size={12} color="#0369A1" style={{ marginRight: 4 }} />
              <Text style={styles.quickNavText}>Ensayos</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Título de la Pantalla */}
      <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <View style={styles.iconTile}>
            <ScientificIcon name={iconName} size={22} color="#0284C7" />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={styles.screenTitle}>{title}</Text>
            {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    ...theme.shadows.card,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1.5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 8,
  },
  btnPressed: {
    opacity: 0.75,
    backgroundColor: '#DBEAFE',
  },
  backBtnArrow: {
    fontSize: 16,
    color: '#1D4ED8',
    fontWeight: '900',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  breadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbLink: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  breadcrumbSeparator: {
    fontSize: 13,
    color: '#94A3B8',
  },
  breadcrumbCurrent: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  quickNav: {
    flexDirection: 'row',
    gap: 6,
  },
  quickNavItem: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickNavText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  titleSection: {
    marginTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  titleTextContainer: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
});
