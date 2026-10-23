import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import DashboardScreen from '../screens/DashboardScreen';
import NuevoEnsayoScreen from '../screens/NuevoEnsayoScreen';
import MonitoreoScreen from '../screens/MonitoreoScreen';
import SimulacionScreen from '../screens/SimulacionScreen';
import EnsayosArchivadosScreen from '../screens/EnsayosArchivadosScreen';
import BioquimicaScreen from '../screens/BioquimicaScreen';
import DemostradorVivoScreen from '../screens/DemostradorVivoScreen';
import FeedbackLoopScreen from '../screens/FeedbackLoopScreen';
import MetricasModeloScreen from '../screens/MetricasModeloScreen';
import AuthModal from '../components/common/AuthModal';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { userToken, isLoading, isAuthModalVisible, activeAuthTab, closeAuthModal } =
    useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1E3A8A',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 16,
          },
        }}
      >
        {userToken === null ? (
          // Flujo de autenticación (Público)
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: 'PrediYogur - Iniciar Sesión', headerShown: false }}
            />
            <Stack.Screen
              name="Registro"
              component={RegistroScreen}
              options={{ title: 'PrediYogur - Crear Cuenta', headerShown: false }}
            />
          </>
        ) : (
          // Flujo principal de la aplicación (Privado)
          <>
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{
                title: 'PrediYogur - Panel Científico',
                headerShown: false, // DashboardScreen usa HeaderBar integrado
              }}
            />
            <Stack.Screen
              name="EnsayosArchivados"
              component={EnsayosArchivadosScreen}
              options={{ title: '📁 Ensayos & Lotes Archivados' }}
            />
            <Stack.Screen
              name="NuevoEnsayo"
              component={NuevoEnsayoScreen}
              options={{ title: '➕ Nuevo Ensayo de Fermentación' }}
            />
            <Stack.Screen
              name="Monitoreo"
              component={MonitoreoScreen}
              options={{ title: '⏱️ Monitoreo de pH y Temperatura' }}
            />
            <Stack.Screen
              name="Simulacion"
              component={SimulacionScreen}
              options={{ title: '⚡ Simulación Cinética (What-If)' }}
            />
            <Stack.Screen
              name="Bioquimica"
              component={BioquimicaScreen}
              options={{ title: '🧬 Bioquímica & Escala pH' }}
            />
            <Stack.Screen
              name="DemostradorVivo"
              component={DemostradorVivoScreen}
              options={{ title: '⏱️ Demostrador en Vivo (Dr. Santacruz)' }}
            />
            <Stack.Screen
              name="FeedbackLoop"
              component={FeedbackLoopScreen}
              options={{ title: '🧠 Feedback Loop (Aprendizaje Continuo)' }}
            />
            <Stack.Screen
              name="MetricasModelo"
              component={MetricasModeloScreen}
              options={{ title: '📊 Métricas Científicas (R² = 0.9774)' }}
            />
          </>
        )}
      </Stack.Navigator>

      {/* Modal Universal de Autenticación / Cambio de Usuario */}
      <AuthModal
        visible={isAuthModalVisible}
        initialTab={activeAuthTab}
        onClose={closeAuthModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
