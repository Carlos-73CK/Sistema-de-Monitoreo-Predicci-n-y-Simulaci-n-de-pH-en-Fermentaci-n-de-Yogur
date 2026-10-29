import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import FooterBar from '../components/common/FooterBar';
import ScientificIcon from '../components/common/ScientificIcons';
import theme from '../styles/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const quickFillAndLogin = (userEmail, userPassword) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setErrorMsg('');
    doLogin(userEmail, userPassword);
  };

  const doLogin = async (overrideEmail, overridePassword) => {
    const emailToUse = (overrideEmail !== undefined ? overrideEmail : email).trim();
    const passToUse = overridePassword !== undefined ? overridePassword : password;

    if (!emailToUse || !passToUse) {
      setErrorMsg('⚠️ Ingrese su correo institucional y contraseña.');
      return;
    }

    try {
      setCargando(true);
      setErrorMsg('');

      const res = await authService.login(emailToUse, passToUse);
      if (res && res.data) {
        await login(res.data.token, res.data.user);
      } else {
        setErrorMsg('⚠️ ' + (res?.message || 'Error al iniciar sesión.'));
      }
    } catch (error) {
      console.warn('[LoginScreen] Error:', error);
      const serverMsg = error.response?.data?.message;
      if (serverMsg) {
        setErrorMsg('⚠️ ' + serverMsg);
      } else {
        // Fallback defensivo para desarrollo offline
        setErrorMsg('⚠️ No se pudo conectar con el servidor backend. Verifique que el servicio esté activo.');
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
        {/* Barra Superior con Retorno al Panel Principal */}
        <View style={styles.topNavRow}>
          <Pressable
            style={styles.backHomeBtn}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <ScientificIcon name="home" size={14} color="#1D4ED8" style={{ marginRight: 6 }} />
            <Text style={styles.backHomeText}>Volver al Panel Principal</Text>
          </Pressable>
        </View>

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
              <Text style={styles.label}>Correo institucional</Text>
              <TextInput
                style={styles.input}
                placeholder="usuario@uleam.edu.ec"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
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
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setErrorMsg('');
                }}
              />
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
});
