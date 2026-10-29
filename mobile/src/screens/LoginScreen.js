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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Institucional */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.milkEmoji}>🥛</Text>
            <Text style={styles.eyebrow}>Plataforma Científica ULEAM</Text>
          </View>
          <Text style={styles.title}>PrediYogur</Text>
          <Text style={styles.subtitle}>
            Modelado Biofísico No Lineal (Hill) y Monitoreo de Fermentación Láctea con Inóculo Chivería.
          </Text>
        </View>

        {/* Tarjeta de Cuentas Rápidas de Laboratorio */}
        <View style={styles.quickAccessCard}>
          <Text style={styles.quickAccessTitle}>⚡ Acceso Rápido de Laboratorio (1-Clic):</Text>
          <View style={styles.quickButtonsCol}>
            <Pressable
              style={styles.quickButton}
              onPress={() => quickFillAndLogin('dr.santacruz@uleam.edu.ec', 'santacruz2026')}
              disabled={cargando}
            >
              <Text style={styles.quickButtonText}>
                👨‍🔬 Dr. Stalin Santacruz (Docente / Inv. Principal)
              </Text>
            </Pressable>

            <Pressable
              style={styles.quickButton}
              onPress={() => quickFillAndLogin('carlos.delgado@uleam.edu.ec', 'carlos2026')}
              disabled={cargando}
            >
              <Text style={styles.quickButtonText}>
                🔬 Carlos Delgado (Investigador Titular)
              </Text>
            </Pressable>

            <Pressable
              style={styles.quickButton}
              onPress={() => quickFillAndLogin('estudiante@uleam.edu.ec', 'estudiante2026')}
              disabled={cargando}
            >
              <Text style={styles.quickButtonText}>
                🎓 Estudiante ULEAM (Tesista / Prácticas)
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
                <Text style={styles.toggleEye}>{showPassword ? '🙈 Ocultar' : '👁️ Mostrar'}</Text>
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
              <Text style={styles.primaryButtonText}>🚀 Iniciar Sesión en PrediYogur</Text>
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
        <FooterBar />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
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
    gap: 6,
    marginBottom: 4,
  },
  milkEmoji: {
    fontSize: 22,
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
    fontWeight: '800',
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
  quickAccessTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: theme.spacing.sm,
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
