import React, { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import theme from '../../styles/theme';

export default function HeaderBar({ onOpenAuthModal }) {
  const { user, userToken, logout, openAuthModal } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isCompact = width < 768;

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

  return (
    <View style={[styles.headerContainer, isCompact && styles.headerCompact]}>
      {/* Brand & Scientific Subtitle */}
      <View style={styles.brandSection}>
        <View style={styles.brandTitleRow}>
          <Text style={styles.milkEmoji}>🥛</Text>
          <Text style={styles.brandTitle}>PrediYogur</Text>
          <Text style={styles.brandSub}>| Plataforma Científica ULEAM</Text>
        </View>
        <Text style={styles.scientificSubtitle}>
          Modelado Biofísico No Lineal (Hill) y Monitoreo de Fermentación Láctea con Inóculo Chivería
        </Text>
      </View>

      {/* Badges & User Profile Section */}
      <View style={[styles.rightSection, isCompact && styles.rightSectionCompact]}>
        {/* Scientific Badges */}
        <View style={styles.badgesWrapper}>
          <View style={[styles.badge, styles.badgeAuthor]}>
            <Text style={styles.badgeAuthorText}>👨‍🔬 Dr. Stalin Gustavo Santacruz Terán</Text>
          </View>
          <View style={[styles.badge, styles.badgePrecision]}>
            <Text style={styles.badgePrecisionText}>⭐ R² = 0.9774 (97.74% Precisión)</Text>
          </View>
          <View style={[styles.badge, styles.badgeStorage]}>
            <Text style={styles.badgeStorageText}>💾 SQLite Local Autónomo</Text>
          </View>
        </View>

        {/* User Authentication Pill / Actions */}
        <View style={styles.userSection}>
          {userToken && user ? (
            <View style={styles.userPill}>
              <View style={styles.userInfo}>
                <Text style={styles.userRoleIcon}>{getRolIcon(user.rol)}</Text>
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
                <Text style={styles.switchButtonText}>🔄 Cambiar</Text>
              </Pressable>

              <Pressable
                style={styles.logoutButton}
                onPress={logout}
                accessibilityLabel="Cerrar sesión"
              >
                <Text style={styles.logoutButtonText}>🚪 Salir</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.loginCtaButton}
              onPress={() => handleOpenAuth('login')}
            >
              <Text style={styles.loginCtaText}>🔐 Iniciar Sesión / Registro</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    ...theme.shadows.card,
  },
  headerCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  brandSection: {
    flexShrink: 1,
    marginRight: theme.spacing.md,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  milkEmoji: {
    fontSize: 22,
    marginRight: 6,
  },
  brandTitle: {
    color: theme.colors.surface,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  scientificSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 15,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  rightSectionCompact: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: theme.spacing.xs,
  },
  badgesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeAuthor: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeAuthorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  badgePrecision: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)',
  },
  badgePrecisionText: {
    color: '#86EFAC',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeStorage: {
    backgroundColor: 'rgba(14, 165, 233, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.45)',
  },
  badgeStorageText: {
    color: '#BAE6FD',
    fontSize: 11,
    fontWeight: '700',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 6,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 4,
  },
  userRoleIcon: {
    fontSize: 14,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 140,
  },
  roleTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  switchButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  switchButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  loginCtaButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    ...theme.shadows.card,
  },
  loginCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
