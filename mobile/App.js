import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

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
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer linking={linking}>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
