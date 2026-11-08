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

export default function RegistroScreen({ navigation }) {
  const { login } = useContext(AuthContext);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rol, setRol] = useState('estudiante');

  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegistro = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    const cleanNombre = nombre.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanNombre || cleanNombre.length < 2) {
      setErrorMsg('⚠️ El nombre completo debe tener al menos 2 caracteres.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('⚠️ Ingrese un correo electrónico institucional válido (ej: usuario@uleam.edu.ec).');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('⚠️ La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('⚠️ Las contraseñas no coinciden. Verifíquelas.');
      return;
    }

    try {
      setCargando(true);
      const res = await authService.register({
        nombre: cleanNombre,
        email: cleanEmail,
        password,
        rol,
      });

      if (res && res.data) {
        setSuccessMsg(`¡Bienvenido(a) ${cleanNombre}! Cuenta creada con éxito.`);
        // Auto-login con el token y datos devueltos
        await login(res.data.token, res.data.user);
      } else {
        setErrorMsg('⚠️ ' + (res?.message || 'No se pudo completar el registro.'));
      }
    } catch (error) {
      console.warn('[RegistroScreen] Error:', error);
      const serverMsg = error.response?.data?.message;
      if (serverMsg) {
        setErrorMsg('⚠️ ' + serverMsg);
      } else {
        setErrorMsg('⚠️ Error al comunicarse con el servidor de autenticación.');
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
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.flaskBadge}>
                <ScientificIcon name="dna" size={24} color="#059669" />
              </View>
              <View>
                <Text style={styles.eyebrow}>Facultad de Ciencias de la Vida - ULEAM</Text>
                <Text style={styles.title}>Crear Cuenta</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Regístrate para aislar tus lotes, simular curvas cinéticas y registrar ensayos de fermentación.
            </Text>
          </View>

        <View style={styles.formCard}>
          {/* Mensajes de Estado */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          {/* Nombre completo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre completo del investigador / estudiante</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Ing. Juan Murillo"
              placeholderTextColor={theme.colors.textMuted}
              value={nombre}
              onChangeText={(t) => {
                setNombre(t);
                setErrorMsg('');
              }}
            />
          </View>

          {/* Correo institucional */}
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

          {/* Selector de Rol */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rol en el laboratorio</Text>
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
                    rol === item.id && styles.rolePillActive,
                  ]}
                  onPress={() => setRol(item.id)}
                >
                  <Text
                    style={[
                      styles.roleText,
                      rol === item.id && styles.roleTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Contraseña */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Contraseña (mínimo 6 caracteres)</Text>
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

          {/* Confirmar contraseña */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Text style={styles.toggleEye}>{showConfirmPassword ? '🙈 Ocultar' : '👁️ Mostrar'}</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Repite tu contraseña"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                setErrorMsg('');
              }}
            />
          </View>

          <Pressable
            style={[styles.button, styles.primaryButton, cargando && styles.buttonDisabled]}
            onPress={handleRegistro}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnRowFlex}>
                <ScientificIcon name="check" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Registrar Cuenta y Comenzar</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes una cuenta registrada?</Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Iniciar Sesión</Text>
          </Pressable>
        </View>
      </View>

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
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyebrow: {
    ...theme.typography.caption,
    color: '#059669',
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
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
  successBox: {
    backgroundColor: '#DCFCE7',
    borderColor: '#4ADE80',
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  successText: {
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
  rolesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  rolePillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  roleTextActive: {
    color: theme.colors.surface,
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
    backgroundColor: '#059669',
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
  loginLink: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
