import React, { useState } from 'react';
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
import authService from '../services/authService';
import theme from '../styles/theme';

export default function RegistroScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rol, setRol] = useState('estudiante');
  const [cargando, setCargando] = useState(false);

  const handleRegistro = async () => {
    if (!nombre.trim() || !email.trim() || !password) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos del formulario.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error de contraseña', 'Las contraseñas no coinciden.');
      return;
    }

    try {
      setCargando(true);
      await authService.register({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
        rol,
      });

      Alert.alert(
        '¡Registro Exitoso!',
        'Tu cuenta ha sido creada. Ahora puedes iniciar sesión en PrediYogur.',
        [{ text: 'Iniciar Sesión', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      const msg = error.response?.data?.message || 'No se pudo completar el registro.';
      Alert.alert('Error de Registro', msg);
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
          <Text style={styles.eyebrow}>Facultad de Ciencias de la Vida - ULEAM</Text>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>
            Regístrate para registrar ensayos y simulaciones de fermentación láctea.
          </Text>
        </View>

        <View style={styles.formCard}>
          {/* Nombre completo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Carlos Delgado"
              placeholderTextColor={theme.colors.textMuted}
              value={nombre}
              onChangeText={setNombre}
            />
          </View>

          {/* Correo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo institucional</Text>
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

          {/* Selector de Rol */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rol en el laboratorio</Text>
            <View style={styles.rolesRow}>
              {[
                { id: 'estudiante', label: 'Estudiante' },
                { id: 'investigador', label: 'Investigador' },
                { id: 'docente', label: 'Docente' },
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
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Confirmar contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Repite tu contraseña"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <Pressable
            style={[styles.button, styles.primaryButton, cargando && styles.buttonDisabled]}
            onPress={handleRegistro}
            disabled={cargando}
          >
            <Text style={styles.primaryButtonText}>
              {cargando ? 'Registrando...' : 'Registrar Cuenta'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes una cuenta registrada?</Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Iniciar Sesión</Text>
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
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.lg,
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
  rolesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  rolePill: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
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
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  roleTextActive: {
    color: theme.colors.surface,
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
  loginLink: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
