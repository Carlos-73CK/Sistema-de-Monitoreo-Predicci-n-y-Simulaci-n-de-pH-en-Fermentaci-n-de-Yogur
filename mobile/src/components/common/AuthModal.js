import React, { useState, useContext, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import theme from '../../styles/theme';

export default function AuthModal({ visible, initialTab, onClose }) {
  const { user, userToken, login, logout } = useContext(AuthContext);

  // Determinar pestaña inicial según si está autenticado
  const defaultTab = initialTab || (userToken ? 'perfil' : 'login');
  const [tab, setTab] = useState(defaultTab);

  // Formulario Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Formulario Registro
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRol, setRegRol] = useState('estudiante');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setTab(initialTab || (userToken ? 'perfil' : 'login'));
      setLoginError('');
      setRegError('');
      setRegSuccess('');
    }
  }, [visible, initialTab, userToken]);

  // Cuentas rápidas de demostración de laboratorio
  const handleQuickLogin = (email, pass) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setLoginError('');
    executeLogin(email, pass);
  };

  const executeLogin = async (emailToUse, passwordToUse) => {
    const email = (emailToUse || loginEmail).trim();
    const pass = passwordToUse || loginPassword;

    if (!email || !pass) {
      setLoginError('⚠️ Ingrese su correo electrónico y contraseña.');
      return;
    }

    try {
      setLoginLoading(true);
      setLoginError('');

      const res = await authService.login(email, pass);
      if (res && res.data) {
        await login(res.data.token, res.data.user);
        if (onClose) onClose();
      } else {
        setLoginError('⚠️ ' + (res?.message || 'Error al iniciar sesión.'));
      }
    } catch (err) {
      console.warn('[AuthModal] Error login:', err);
      const msg = err.response?.data?.message || 'Credenciales inválidas o servidor no disponible.';
      setLoginError('⚠️ ' + msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const executeRegister = async () => {
    setRegError('');
    setRegSuccess('');

    const nombre = regNombre.trim();
    const email = regEmail.trim().toLowerCase();
    const password = regPassword;
    const confirm = regConfirmPassword;

    if (!nombre || nombre.length < 2) {
      setRegError('⚠️ El nombre completo debe tener al menos 2 caracteres.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setRegError('⚠️ Ingrese un correo electrónico válido (ej: usuario@uleam.edu.ec).');
      return;
    }

    if (password.length < 6) {
      setRegError('⚠️ La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirm) {
      setRegError('⚠️ Las contraseñas no coinciden.');
      return;
    }

    try {
      setRegLoading(true);
      const res = await authService.register({
        nombre,
        email,
        password,
        rol: regRol,
      });

      if (res && res.data) {
        setRegSuccess('¡Cuenta creada exitosamente! Conectando...');
        await login(res.data.token, res.data.user);
        setTimeout(() => {
          if (onClose) onClose();
        }, 600);
      } else {
        setRegError('⚠️ ' + (res?.message || 'Error al registrar cuenta.'));
      }
    } catch (err) {
      console.warn('[AuthModal] Error registro:', err);
      const msg = err.response?.data?.message || 'No fue posible registrar la cuenta.';
      setRegError('⚠️ ' + msg);
    } finally {
      setRegLoading(false);
    }
  };

  const getRolBadgeColor = (rol) => {
    switch (rol) {
      case 'docente':
        return { bg: '#FEF3C7', text: '#B45309', label: 'DOCENTE INVESTIGADOR' };
      case 'estudiante':
        return { bg: '#E0F2FE', text: '#0369A1', label: 'ESTUDIANTE / TESISTA' };
      case 'investigador':
      default:
        return { bg: '#DCFCE7', text: '#15803D', label: 'INVESTIGADOR TITULAR' };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header del Modal con botón cerrar */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Acceso a PrediYogur</Text>
              <Text style={styles.modalSubtitle}>Gestión y Aislamiento de Muestras Experimentales</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Selector de Pestañas */}
          <View style={styles.tabsContainer}>
            {userToken && (
              <Pressable
                style={[styles.tabButton, tab === 'perfil' && styles.tabButtonActive]}
                onPress={() => setTab('perfil')}
              >
                <Text style={[styles.tabText, tab === 'perfil' && styles.tabTextActivePrimary]}>
                  👤 Mi Perfil
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.tabButton, tab === 'login' && styles.tabButtonActive]}
              onPress={() => {
                setTab('login');
                setLoginError('');
              }}
            >
              <Text style={[styles.tabText, tab === 'login' && styles.tabTextActivePrimary]}>
                {userToken ? '🔄 Cambiar Cuenta' : '🔐 Iniciar Sesión'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabButton, tab === 'register' && styles.tabButtonActive]}
              onPress={() => {
                setTab('register');
                setRegError('');
                setRegSuccess('');
              }}
            >
              <Text style={[styles.tabText, tab === 'register' && styles.tabTextActiveSuccess]}>
                ✨ Crear Cuenta
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* ================= PANEL 0: MI PERFIL (SI ESTÁ AUTENTICADO) ================= */}
            {tab === 'perfil' && userToken && user && (
              <View style={styles.tabContent}>
                <View style={styles.profileCard}>
                  <View style={styles.profileCardHeader}>
                    <View style={styles.profileAvatarLarge}>
                      <Text style={styles.avatarEmoji}>
                        {user.rol === 'estudiante' ? '🎓' : user.rol === 'docente' ? '📚' : '🔬'}
                      </Text>
                    </View>
                    <View style={styles.profileDetails}>
                      <Text style={styles.profileFullName}>{user.nombre}</Text>
                      <Text style={styles.profileEmailText}>{user.email}</Text>
                      <View
                        style={[
                          styles.rolePillBadge,
                          { backgroundColor: getRolBadgeColor(user.rol).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rolePillBadgeText,
                            { color: getRolBadgeColor(user.rol).text },
                          ]}
                        >
                          {getRolBadgeColor(user.rol).label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.isolationNotice}>
                    <Text style={styles.isolationNoticeTitle}>
                      🔒 Aislamiento de Ensayos & Muestras:
                    </Text>
                    <Text style={styles.isolationNoticeText}>
                      Tus cinéticas de fermentación, lecturas de pH y simulaciones "What-If" se
                      almacenan vinculadas a tu identificador en la base SQLite local de la plataforma.
                    </Text>
                  </View>

                  <View style={styles.profileCardActions}>
                    <Pressable
                      style={styles.switchAccountBtn}
                      onPress={() => setTab('login')}
                    >
                      <Text style={styles.switchAccountBtnText}>🔄 Cambiar a Otra Cuenta</Text>
                    </Pressable>

                    <Pressable
                      style={styles.logoutCardBtn}
                      onPress={async () => {
                        await logout();
                        if (onClose) onClose();
                      }}
                    >
                      <Text style={styles.logoutCardBtnText}>🚪 Cerrar Sesión</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* ================= PANEL 1: INICIAR SESIÓN / CAMBIAR CUENTA ================= */}
            {tab === 'login' && (
              <View style={styles.tabContent}>
                {/* Cuentas de Acceso Rápido para Pruebas del Laboratorio */}
                <View style={styles.quickAccountsCard}>
                  <Text style={styles.quickAccountsTitle}>
                    ⚡ Cuentas Rápidas de Laboratorio (1-Clic):
                  </Text>
                  <View style={styles.quickChipsRow}>
                    <Pressable
                      style={styles.quickChip}
                      onPress={() =>
                        handleQuickLogin('dr.santacruz@uleam.edu.ec', 'santacruz2026')
                      }
                    >
                      <Text style={styles.quickChipText}>
                        👨‍🔬 Dr. Stalin Santacruz (Docente / Inv.)
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.quickChip}
                      onPress={() =>
                        handleQuickLogin('carlos.delgado@uleam.edu.ec', 'carlos2026')
                      }
                    >
                      <Text style={styles.quickChipText}>
                        🔬 Carlos Delgado (Investigador Titular)
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.quickChip}
                      onPress={() =>
                        handleQuickLogin('estudiante@uleam.edu.ec', 'estudiante2026')
                      }
                    >
                      <Text style={styles.quickChipText}>
                        🎓 Estudiante ULEAM (Tesista)
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Banner de error */}
                {loginError ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{loginError}</Text>
                  </View>
                ) : null}

                {/* Formulario */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Correo electrónico institucional</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="usuario@uleam.edu.ec"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>Contraseña</Text>
                    <Pressable onPress={() => setShowLoginPassword(!showLoginPassword)}>
                      <Text style={styles.eyeToggleText}>
                        {showLoginPassword ? '🙈 Ocultar' : '👁️ Mostrar'}
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry={!showLoginPassword}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                  />
                </View>

                <Pressable
                  style={[styles.submitBtn, styles.submitBtnLogin, loginLoading && styles.btnDisabled]}
                  onPress={() => executeLogin()}
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {userToken ? '🔄 Cambiar a Esta Cuenta' : '🚀 Iniciar Sesión en PrediYogur'}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* ================= PANEL 2: REGISTRO NUEVO ================= */}
            {tab === 'register' && (
              <View style={styles.tabContent}>
                {regError ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{regError}</Text>
                  </View>
                ) : null}

                {regSuccess ? (
                  <View style={styles.successBanner}>
                    <Text style={styles.successBannerText}>{regSuccess}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre completo</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ej. Ing. Juan Murillo"
                    placeholderTextColor={theme.colors.textMuted}
                    value={regNombre}
                    onChangeText={setRegNombre}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Correo electrónico institucional</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="usuario@uleam.edu.ec"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={regEmail}
                    onChangeText={setRegEmail}
                  />
                </View>

                {/* Selector de Rol */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Rol en el laboratorio ULEAM</Text>
                  <View style={styles.rolesRow}>
                    {[
                      { id: 'estudiante', label: '🎓 Estudiante' },
                      { id: 'investigador', label: '🔬 Investigador' },
                      { id: 'docente', label: '📚 Docente' },
                    ].map((item) => (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.rolePill,
                          regRol === item.id && styles.rolePillActive,
                        ]}
                        onPress={() => setRegRol(item.id)}
                      >
                        <Text
                          style={[
                            styles.rolePillText,
                            regRol === item.id && styles.rolePillTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>Contraseña (mínimo 6 caracteres)</Text>
                    <Pressable onPress={() => setShowRegPassword(!showRegPassword)}>
                      <Text style={styles.eyeToggleText}>
                        {showRegPassword ? '🙈 Ocultar' : '👁️ Mostrar'}
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry={!showRegPassword}
                    value={regPassword}
                    onChangeText={setRegPassword}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirmar contraseña</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Repita su contraseña"
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry={!showRegPassword}
                    value={regConfirmPassword}
                    onChangeText={setRegConfirmPassword}
                  />
                </View>

                <Pressable
                  style={[styles.submitBtn, styles.submitBtnReg, regLoading && styles.btnDisabled]}
                  onPress={executeRegister}
                  disabled={regLoading}
                >
                  {regLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>✨ Crear Mi Cuenta y Comenzar</Text>
                  )}
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    ...theme.shadows.card,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surfaceMuted,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  closeBtnText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.radii.sm,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  tabTextActivePrimary: {
    color: theme.colors.primary,
  },
  tabTextActiveSuccess: {
    color: '#059669',
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  tabContent: {
    paddingBottom: theme.spacing.lg,
  },
  profileCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.md,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  profileAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  profileDetails: {
    flex: 1,
  },
  profileFullName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileEmailText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  rolePillBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 5,
  },
  rolePillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  isolationNotice: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 6,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  isolationNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 2,
  },
  isolationNoticeText: {
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 16,
  },
  profileCardActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  switchAccountBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
  },
  switchAccountBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutCardBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
  },
  logoutCardBtnText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '700',
  },
  quickAccountsCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  quickAccountsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: theme.spacing.sm,
  },
  quickChipsRow: {
    gap: 6,
  },
  quickChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#38BDF8',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: '#DCFCE7',
    borderColor: '#4ADE80',
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  successBannerText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  eyeToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: '#FAFAFA',
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
  },
  rolePillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  rolePillTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    height: 46,
    borderRadius: theme.radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.card,
  },
  submitBtnLogin: {
    backgroundColor: theme.colors.primary,
  },
  submitBtnReg: {
    backgroundColor: '#059669',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
