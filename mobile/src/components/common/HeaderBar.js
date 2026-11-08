import React, { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import theme from '../../styles/theme';
import ScientificIcon from './ScientificIcons';

export default function HeaderBar({ navigation, onOpenAuthModal, activeTab = 'Dashboard' }) {
  const { user, userToken, logout, openAuthModal } = useContext(AuthContext);

  const handleOpenAuth = (tab = 'login') => {
    if (onOpenAuthModal) {
      onOpenAuthModal(tab);
    } else {
      openAuthModal(tab);
    }
  };

  const getRolIcon = (rol) => {
    switch (rol) {
      case 'docente':
        return '📚';
      case 'estudiante':
        return '🎓';
      case 'investigador':
      default:
        return '🔬';
    }
  };

  const navItems = [
    { name: 'Dashboard', label: 'Panel Científico', icon: 'home' },
    { name: 'Simulacion', label: 'Simulación What-If', icon: 'spark' },
    { name: 'Monitoreo', label: 'Monitoreo en Vivo', icon: 'clock' },
    { name: 'EnsayosArchivados', label: 'Ensayos Archivados', icon: 'archive' },
    { name: 'Bioquimica', label: 'Bioquímica & pH', icon: 'dna' },
    { name: 'DemostradorVivo', label: 'Demostrador en Vivo', icon: 'ph' },
    { name: 'MetricasModelo', label: 'Métricas R²=0.9774', icon: 'metrics' },
  ];

  return (
    <View style={styles.headerWrapper}>
      {/* Barra Principal con Identidad y Perfil */}
      <View style={styles.headerTopBar}>
        <View style={styles.brandSection}>
          <View style={styles.brandTitleRow}>
            <View style={styles.flaskIconContainer}>
              <ScientificIcon name="flask" size={28} color="#38BDF8" />
            </View>
            <View>
              <View style={styles.brandTitleFlex}>
                <Text style={styles.brandTitle}>PrediYogur</Text>
                <View style={styles.brandBadge}>
                  <Text style={styles.brandBadgeText}>ULEAM CIENTÍFICA</Text>
                </View>
              </View>
              <Text style={styles.scientificSubtitle}>
                Modelado Biofísico No Lineal (Hill) y Monitoreo de Fermentación Láctea con Inóculo Chivería
              </Text>
            </View>
          </View>
        </View>

        {/* Badges Científicos y Sección de Usuario */}
        <View style={styles.rightSection}>
          <View style={styles.badgesWrapper}>
            <View style={[styles.badge, styles.badgeAuthor]}>
              <ScientificIcon name="microscope" size={13} color="#CBD5E1" style={{ marginRight: 5 }} />
              <Text style={styles.badgeAuthorText}>Dr. Stalin Gustavo Santacruz Terán</Text>
            </View>
            <View style={[styles.badge, styles.badgePrecision]}>
              <ScientificIcon name="check" size={13} color="#34D399" style={{ marginRight: 5 }} />
              <Text style={styles.badgePrecisionText}>R² = 0.9774 (97.74% Precisión)</Text>
            </View>
            <View style={[styles.badge, styles.badgeStorage]}>
              <ScientificIcon name="archive" size={13} color="#38BDF8" style={{ marginRight: 5 }} />
              <Text style={styles.badgeStorageText}>SQLite Autónomo</Text>
            </View>
          </View>

          {/* Pastilla de Usuario */}
          <View style={styles.userSection}>
            {userToken && user ? (
              <View style={styles.userPill}>
                <View style={styles.userInfo}>
                  <ScientificIcon name="user" size={14} color="#60A5FA" style={{ marginRight: 5 }} />
                  <Text style={styles.userName} numberOfLines={1}>
                    {user.nombre || 'Investigador'}
                  </Text>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>
                      {String(user.rol || 'investigador').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.switchButton}
                  onPress={() => handleOpenAuth('login')}
                  accessibilityLabel="Cambiar de usuario"
                >
                  <Text style={styles.switchButtonText}>Cambiar</Text>
                </Pressable>

                <Pressable
                  style={styles.logoutButton}
                  onPress={logout}
                  accessibilityLabel="Cerrar sesión"
                >
                  <Text style={styles.logoutButtonText}>Salir</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.loginCtaButton}
                onPress={() => handleOpenAuth('login')}
              >
                <ScientificIcon name="user" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.loginCtaText}>Iniciar Sesión / Registro</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Barra de Pestañas de Navegación Rápida con Iconos Vectoriales */}
      {navigation ? (
        <View style={styles.navTabsBar}>
          <View style={styles.navTabsScroll}>
            {navItems.map((tab) => {
              const isActive = activeTab === tab.name;
              return (
                <Pressable
                  key={tab.name}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => navigation.navigate(tab.name)}
                >
                  <ScientificIcon
                    name={tab.icon}
                    size={14}
                    color={isActive ? '#FFFFFF' : '#94A3B8'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#0F172A',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    ...(Platform.OS === 'web' ? { position: 'sticky', top: 0, zIndex: 100 } : {}),
  },
  headerTopBar: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  brandSection: {
    flex: 1,
    minWidth: 280,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flaskIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitleFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  brandBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scientificSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 16,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeAuthor: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeAuthorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  badgePrecision: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  badgePrecisionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
  },
  badgeStorage: {
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  badgeStorageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  userSection: {
    marginLeft: 4,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userRoleIcon: {
    fontSize: 14,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  roleTag: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  switchButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  switchButtonText: {
    color: '#CBD5E1',
    fontSize: 10.5,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: '#FCA5A5',
    fontSize: 10.5,
    fontWeight: '700',
  },
  loginCtaButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  loginCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  navTabsBar: {
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    width: '100%',
  },
  navTabsScroll: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingVertical: 6,
  },
  tabButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#0284C7',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
});
