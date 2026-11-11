import 'react-native-gesture-handler';
import React from 'react';
import { Platform, StyleSheet, View, Text, Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[PrediYogur SafeMode] Error capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>🔬 PrediYogur</Text>
          <Text style={styles.errorSubtitle}>
            Modo de recuperación seguro activado.
          </Text>
          <Text style={styles.errorDetails}>
            {String(this.state.error?.message || this.state.error || 'Error inesperado')}
          </Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.retryBtnText}>Reintentar Carga</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const linking = {
  prefixes: [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:3000',
    'prediyogur://',
    '/',
  ],
  config: {
    screens: {
      Dashboard: '',
      Simulacion: 'simulacion',
      Monitoreo: 'monitoreo',
      NuevoEnsayo: 'nuevo-ensayo',
      EnsayosArchivados: 'ensayos',
      Bioquimica: 'bioquimica',
      DemostradorVivo: 'demostrador',
      FeedbackLoop: 'feedback-loop',
      MetricasModelo: 'metricas',
      Login: 'login',
      Registro: 'registro',
    },
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <NavigationContainer linking={Platform.OS === 'web' ? linking : undefined}>
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0F172A',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#38BDF8',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorDetails: {
    fontSize: 12,
    color: '#F87171',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 20,
    width: '100%',
  },
  retryBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
