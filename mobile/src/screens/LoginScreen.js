import React, { useContext, useState } from 'react';
import {
  Alert,
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
import theme from '../styles/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    // Si no ingresa datos, permite login rápido de demostración
    if (!email.trim() && !password) {
      login('token_demo_jwt_uleam', { nombre: 'Carlos Delgado', rol: 'investigador' });
      return;
    }

    try {
      setCargando(true);
      const res = await authService.login(email.trim(), password);
      const token = res.data?.token || 'mock-jwt-token';
      const user = res.data?.user || { nombre: email.split('@')[0], rol: 'estudiante' };
      login(token, user);
    } catch (error) {
      // Fallback amigable para demostraciones sin backend conectado
      login('token_demo_jwt_uleam', { nombre: email.split('@')[0] || 'Investigador', rol: 'investigador' });
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
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Plataforma Científica ULEAM</Text>
          <Text style={styles.title}>PrediYogur</Text>
          <Text style={styles.subtitle}>
            Monitoreo, predicción y simulación cinética de pH en fermentación láctea.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="ejemplo@uleam.edu.ec"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Pressable
            style={[styles.button, styles.primaryButton, cargando && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={cargando}
          >
            <Text style={styles.primaryButtonText}>
              {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes una cuenta institucional?</Text>
          <Pressable onPress={() => navigation.navigate('Registro')}>
            <Text style={styles.registerLink}>Regístrate aquí</Text>
          </Pressable>
        </View>
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
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  eyebrow: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.text,
    fontSize: 32,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
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
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md,
    marginTop: theme.spacing.md,
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
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xl,
  },
  footerText: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
  },
  registerLink: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
