import React, { useState } from 'react';
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
import authService from '../services/authService';
import FooterBar from '../components/common/FooterBar';
import ScientificIcon from '../components/common/ScientificIcons';
import PasswordStrengthBar from '../components/common/PasswordStrengthBar';
import theme from '../styles/theme';

export default function RecuperarPasswordScreen({ navigation }) {
  const [paso, setPaso] = useState(1); // 1 = Solicitar token, 2 = Restablecer con token
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devTokenSugerido, setDevTokenSugerido] = useState('');

  // Paso 1: Solicitar token
  const handleSolicitarToken = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('⚠️ Ingrese su correo institucional o nombre de usuario.');
      return;
    }

    try {
      setCargando(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await authService.forgotPassword(cleanEmail);
      setSuccessMsg(res.message || 'Si la cuenta existe, se ha generado el enlace de restablecimiento.');

      if (res.data?.dev_token) {
        setDevTokenSugerido(res.data.dev_token);
        setToken(res.data.dev_token);
      }

      setPaso(2);
    } catch (error) {
      console.warn('[RecuperarPasswordScreen] Error solicitar:', error);
      const serverMsg = error.response?.data?.message;
      setErrorMsg('⚠️ ' + (serverMsg || 'No se pudo conectar con el servidor.'));
    } finally {
      setCargando(false);
    }
  };

  // Paso 2: Restablecer contraseña con token
  const handleRestablecer = async () => {
    const cleanToken = token.trim();
    if (!cleanToken) {
      setErrorMsg('⚠️ Ingrese el token de recuperación recibido.');
      return;
    }

    if (!password || password.length < 12) {
      setErrorMsg('⚠️ La nueva contraseña debe tener al menos 12 caracteres (referencia de seguridad OWASP).');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('⚠️ Las contraseñas no coinciden. Por favor verifíquelas.');
      return;
    }

    try {
      setCargando(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await authService.resetPassword({
        token: cleanToken,
        password,
        confirmPassword,
      });

      setSuccessMsg(res.message || '¡Contraseña restablecida exitosamente! Redirigiendo...');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1500);
    } catch (error) {
      console.warn('[RecuperarPasswordScreen] Error reset:', error);
      const serverMsg = error.response?.data?.message;
      setErrorMsg('⚠️ ' + (serverMsg || 'No se pudo restablecer la contraseña. El token puede ser inválido o haber expirado.'));
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
        {/* Barra Superior con Retorno al Login */}
        <View style={styles.topNavRow}>
          <Pressable
            style={styles.backHomeBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <ScientificIcon name="arrowLeft" size={14} color="#1D4ED8" style={{ marginRight: 6 }} />
            <Text style={styles.backHomeText}>Volver al Inicio de Sesión</Text>
          </Pressable>
        </View>

        <View style={styles.formWrapper}>
          {/* Header Institucional */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.flaskBadge}>
                <ScientificIcon name="spark" size={26} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.eyebrow}>Seguridad y Acceso — ULEAM</Text>
                <Text style={styles.title}>Recuperar Contraseña</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Procedimiento seguro de restablecimiento de credenciales conforme a directrices de ciberseguridad y LOPDP.
            </Text>
          </View>

          {/* Tarjeta del Formulario */}
          <View style={styles.formCard}>
            {/* Mensajes de Alerta */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <ScientificIcon name="alert" size={14} color="#B91C1C" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successBox}>
                <ScientificIcon name="check" size={14} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {paso === 1 ? (
              // PASO 1: Ingreso de correo / usuario
              <View>
                <Text style={styles.stepTitle}>Paso 1: Identificación de la Cuenta</Text>
                <Text style={styles.stepSubtitle}>
                  Ingrese su correo electrónico institucional o nombre de usuario registrado.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Correo institucional o Usuario</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="usuario@uleam.edu.ec o stalin.santacruz"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      setErrorMsg('');
                    }}
                  />
                </View>

                <Pressable
                  style={[styles.button, styles.primaryButton, cargando && styles.buttonDisabled]}
                  onPress={handleSolicitarToken}
                  disabled={cargando}
                >
                  {cargando ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.btnRowFlex}>
                      <ScientificIcon name="spark" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryButtonText}>Generar Token de Recuperación</Text>
                    </View>
                  )}
                </Pressable>

                <View style={styles.directPaso2Row}>
                  <Text style={styles.directPaso2Text}>¿Ya tienes un token de recuperación?</Text>
                  <Pressable onPress={() => setPaso(2)}>
                    <Text style={styles.directPaso2Link}>Ingresar token aquí</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              // PASO 2: Ingreso de token y nueva contraseña
              <View>
                <Text style={styles.stepTitle}>Paso 2: Restablecer Contraseña</Text>
                <Text style={styles.stepSubtitle}>
                  Ingrese el token recibido y defina una nueva contraseña segura (mínimo 12 caracteres).
                </Text>

                {devTokenSugerido ? (
                  <View style={styles.tokenNoticeBox}>
                    <Text style={styles.tokenNoticeTitle}>🔑 Token generado para entorno de laboratorio:</Text>
                    <Text style={styles.tokenNoticeCode}>{devTokenSugerido}</Text>
                    <Text style={styles.tokenNoticeSub}>Se ha autorellenado automáticamente en el campo inferior.</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Token de Recuperación</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ingrese el código o token de 64 caracteres"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="none"
                    value={token}
                    onChangeText={(t) => {
                      setToken(t);
                      setErrorMsg('');
                    }}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Nueva Contraseña (min. 12 caracteres)</Text>
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      <Text style={styles.toggleEye}>{showPassword ? 'Ocultar' : 'Mostrar'}</Text>
                    </Pressable>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 12 caracteres robustos"
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      setErrorMsg('');
                    }}
                  />
                  <PasswordStrengthBar password={password} />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
                    <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Text style={styles.toggleEye}>{showConfirmPassword ? 'Ocultar' : 'Mostrar'}</Text>
                    </Pressable>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Repita la nueva contraseña"
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
                  onPress={handleRestablecer}
                  disabled={cargando}
                >
                  {cargando ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.btnRowFlex}>
                      <ScientificIcon name="check" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryButtonText}>Actualizar Contraseña</Text>
                    </View>
                  )}
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setPaso(1)}
                  disabled={cargando}
                >
                  <Text style={styles.secondaryButtonText}>← Volver al Paso 1</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Pie de pantalla */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Recordaste tu contraseña?</Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.registerLink}>Iniciar Sesión</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  backHomeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  formWrapper: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  header: {
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  flaskBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  tokenNoticeBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  tokenNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  tokenNoticeCode: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: 6,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  tokenNoticeSub: {
    fontSize: 11,
    color: '#166534',
    fontStyle: 'italic',
  },
  directPaso2Row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  directPaso2Text: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginRight: 6,
  },
  directPaso2Link: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#065F46',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  toggleEye: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  button: {
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#0284C7',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  btnRowFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginRight: 6,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
});
