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
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
        />
        <Stack.Screen
          name="Simulacion"
          component={SimulacionScreen}
        />
        <Stack.Screen
          name="Monitoreo"
          component={MonitoreoScreen}
        />
        <Stack.Screen
          name="NuevoEnsayo"
          component={NuevoEnsayoScreen}
        />
        <Stack.Screen
          name="EnsayosArchivados"
          component={EnsayosArchivadosScreen}
        />
        <Stack.Screen
          name="Bioquimica"
          component={BioquimicaScreen}
        />
        <Stack.Screen
          name="DemostradorVivo"
          component={DemostradorVivoScreen}
        />
        <Stack.Screen
          name="FeedbackLoop"
          component={FeedbackLoopScreen}
        />
        <Stack.Screen
          name="MetricasModelo"
          component={MetricasModeloScreen}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />
        <Stack.Screen
          name="Registro"
          component={RegistroScreen}
        />
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
