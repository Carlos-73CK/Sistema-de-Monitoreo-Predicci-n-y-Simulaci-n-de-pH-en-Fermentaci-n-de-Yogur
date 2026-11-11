import React, { useContext, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';
import { getSavedBaseUrl, setCustomBaseUrl, DEFAULT_HOST_IP } from '../services/api';
import FooterBar from '../components/common/FooterBar';
import ScientificIcon from '../components/common/ScientificIcons';
import theme from '../styles/theme';

export default function LoginScreen({ navigation }) {
  const { login, userToken } = useContext(AuthContext);
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recordarSesion, setRecordarSesion] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estado para modal de configuración de IP del servidor
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [currentServerUrl, setCurrentServerUrl] = useState('');
  const [serverStatusMsg, setServerStatusMsg] = useState('');

  useEffect(() => {
    const loadUrl = async () => {
      const url = await getSavedBaseUrl();
      setCurrentServerUrl(url);
      setServerUrlInput(url);
    };
    loadUrl();
  }, []);

  const handleSaveServerUrl = async (urlToSave) => {
    const saved = await setCustomBaseUrl(urlToSave);
    setCurrentServerUrl(saved);
    setServerUrlInput(saved);
    setServerStatusMsg('✓ Servidor actualizado correctamente.');
    setTimeout(() => {
      setShowServerModal(false);
      setServerStatusMsg('');
    }, 800);
  };

  const quickFillAndLogin = (userId, userPassword) => {
    setIdentificador(userId);
    setPassword(userPassword);
    setErrorMsg('');
    doLogin(userId, userPassword);
  };

  const doLogin = async (overrideId, overridePassword) => {
    const idToUse = (overrideId !== undefined ? overrideId : identificador).trim();
    const passToUse = overridePassword !== undefined ? overridePassword : password;

    if (!idToUse || !passToUse) {
      setErrorMsg('⚠️ Ingrese su correo institucional (o nombre de usuario) y contraseña.');
      return;
    }

    try {
      setCargando(true);
      setErrorMsg('');

      const res = await authService.login(idToUse, passToUse);
      if (res && res.data) {
        await login(res.data.token, res.data.user, recordarSesion);
      } else {
        setErrorMsg('⚠️ ' + (res?.message || 'Error al iniciar sesión.'));
      }
    } catch (error) {
      console.warn('[LoginScreen] Error:', error);
      const serverMsg = error.response?.data?.message;
      if (serverMsg) {
        setErrorMsg('⚠️ ' + serverMsg);
      } else {
        setErrorMsg('⚠️ No se pudo conectar con el servidor backend. Verifique su conexión de red.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Barra Superior con Retorno al Panel Principal (solo si ya tiene sesión activa) */}
        {userToken ? (
          <View style={styles.topNavRow}>
            <Pressable
              style={styles.backHomeBtn}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <ScientificIcon name="home" size={14} color="#1D4ED8" style={{ marginRight: 6 }} />
              <Text style={styles.backHomeText}>Volver al Panel Principal</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.formWrapper}>
          {/* Header Institucional */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.flaskBadge}>
                <ScientificIcon name="flask" size={26} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.eyebrow}>Plataforma Científica ULEAM</Text>
                <Text style={styles.title}>PrediYogur</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Modelado Biofísico No Lineal (Hill) y Monitoreo de Fermentación Láctea con Inóculo Chivería.
            </Text>

            {/* Pastilla de Conexión y Estado del Servidor */}
            <Pressable
              style={styles.serverBadgeRow}
              onPress={() => setShowServerModal(true)}
            >
              <View style={styles.serverBadgeLeft}>
                <View style={styles.onlineDot} />
                <Text style={styles.serverBadgeText}>
                  Servidor: {currentServerUrl ? currentServerUrl.replace('/api', '') : '192.168.0.109:5000'}
                </Text>
              </View>
              <Text style={styles.serverBadgeAction}>[⚙️ Cambiar IP]</Text>
            </Pressable>
          </View>

          {/* Tarjeta de Cuentas Rápidas de Laboratorio */}
          <View style={styles.quickAccessCard}>
            <View style={styles.qaHeaderRow}>
              <ScientificIcon name="spark" size={14} color="#0369A1" style={{ marginRight: 6 }} />
              <Text style={styles.quickAccessTitle}>Acceso Rápido de Laboratorio (1-Clic):</Text>
            </View>
            <View style={styles.quickButtonsCol}>
              <Pressable
                style={styles.quickButton}
                onPress={() => quickFillAndLogin('dr.santacruz@uleam.edu.ec', 'santacruz2026')}
                disabled={cargando}
              >
                <ScientificIcon name="microscope" size={15} color="#0369A1" style={{ marginRight: 8 }} />
                <Text style={styles.quickButtonText}>
                  Dr. Stalin Santacruz (Docente / Inv. Principal)
                </Text>
              </Pressable>

              <Pressable
                style={styles.quickButton}
                onPress={() => quickFillAndLogin('carlos.delgado@uleam.edu.ec', 'carlos2026')}
                disabled={cargando}
              >
                <ScientificIcon name="user" size={15} color="#0369A1" style={{ marginRight: 8 }} />
                <Text style={styles.quickButtonText}>
                  Carlos Delgado (Investigador Titular)
                </Text>
              </Pressable>

              <Pressable
                style={styles.quickButton}
                onPress={() => quickFillAndLogin('estudiante@uleam.edu.ec', 'estudiante2026')}
                disabled={cargando}
              >
                <ScientificIcon name="dna" size={15} color="#0369A1" style={{ marginRight: 8 }} />
                <Text style={styles.quickButtonText}>
                  Estudiante ULEAM (Tesista / Prácticas)
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Tarjeta del Formulario */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Iniciar Sesión</Text>

            {/* Mensaje de Error */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <ScientificIcon name="alert" size={14} color="#B91C1C" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo institucional o Nombre de usuario</Text>
              <TextInput
                style={styles.input}
                placeholder="usuario@uleam.edu.ec o carlos.delgado"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                value={identificador}
                onChangeText={(t) => {
                  setIdentificador(t);
                  setErrorMsg('');
                }}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Contraseña</Text>
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.toggleEye}>{showPassword ? 'Ocultar' : 'Mostrar'}</Text>
                </Pressable>
              </View>
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setErrorMsg('');
                }}
              />
            </View>

            {/* Opciones de Recordar Sesión y Recuperación de Contraseña */}
            <View style={styles.optionsRow}>
              <Pressable
                style={styles.rememberRow}
                onPress={() => setRecordarSesion(!recordarSesion)}
              >
                <View style={[styles.checkbox, recordarSesion && styles.checkboxActive]}>
                  {recordarSesion ? (
                    <ScientificIcon name="check" size={12} color="#FFFFFF" />
                  ) : null}
                </View>
                <Text style={styles.rememberText}>Recordar sesión</Text>
              </Pressable>

              <Pressable onPress={() => navigation.navigate('RecuperarPassword')}>
                <Text style={styles.forgotPassLink}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.button, styles.primaryButton, cargando && styles.buttonDisabled]}
              onPress={() => doLogin()}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnRowFlex}>
                  <ScientificIcon name="check" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Iniciar Sesión en PrediYogur</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Pie de pantalla */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes una cuenta institucional?</Text>
            <Pressable onPress={() => navigation.navigate('Registro')}>
              <Text style={styles.registerLink}>Crear cuenta nueva</Text>
            </Pressable>
          </View>
        </View>

        {/* Footer a ancho completo */}
        <FooterBar />
      </ScrollView>

      {/* Modal de Configuración del Servidor Backend */}
      <Modal
        visible={showServerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowServerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ScientificIcon name="spark" size={18} color="#0284C7" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Configurar Servidor Backend</Text>
            </View>

            <Text style={styles.modalDesc}>
              Si pruebas en un teléfono físico en la misma red Wi-Fi, la IP recomendada es tu PC (192.168.0.109:5000). También puedes operar en modo autónomo local sin servidor activo.
            </Text>

            {serverStatusMsg ? (
              <View style={styles.serverStatusBox}>
                <Text style={styles.serverStatusText}>{serverStatusMsg}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabelModal}>URL del Backend (/api):</Text>
            <TextInput
              style={styles.modalInput}
              value={serverUrlInput}
              onChangeText={setServerUrlInput}
              placeholder="http://192.168.0.109:5000/api"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />

            <View style={styles.quickIpRow}>
              <Pressable
                style={styles.quickIpBtn}
                onPress={() => setServerUrlInput(`http://${DEFAULT_HOST_IP}:5000/api`)}
              >
                <Text style={styles.quickIpText}>Wi-Fi ({DEFAULT_HOST_IP})</Text>
              </Pressable>
              <Pressable
                style={styles.quickIpBtn}
                onPress={() => setServerUrlInput('http://10.0.2.2:5000/api')}
              >
                <Text style={styles.quickIpText}>Emulador (10.0.2.2)</Text>
              </Pressable>
            </View>

            <View style={styles.modalActionsRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowServerModal(false)}
              >
                <Text style={styles.modalCancelText}>Cerrar</Text>
              </Pressable>
              <Pressable
                style={styles.modalSaveBtn}
                onPress={() => handleSaveServerUrl(serverUrlInput)}
              >
                <Text style={styles.modalSaveText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  rememberText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  forgotPassLink: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '600',
  },
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingBottom: 0,
  },
  topNavRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  backHomeBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1.5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backHomeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  formWrapper: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  flaskBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    lineHeight: 20,
  },
  quickAccessCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  qaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  quickAccessTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
  },
  quickButtonsCol: {
    gap: 6,
  },
  quickButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#7DD3FC',
    borderWidth: 1,
    borderRadius: theme.radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
  },
  cardTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: theme.spacing.md,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600',
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
  label: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  toggleEye: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  button: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md,
    marginTop: theme.spacing.md,
    ...theme.shadows.card,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '800',
  },
  btnRowFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xl,
    flexWrap: 'wrap',
  },
  footerText: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
  },
  registerLink: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  serverBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  serverBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  serverBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },
  serverBadgeAction: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  serverStatusBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  serverStatusText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  inputLabelModal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  quickIpRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickIpBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  quickIpText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalCancelText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  modalSaveText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
