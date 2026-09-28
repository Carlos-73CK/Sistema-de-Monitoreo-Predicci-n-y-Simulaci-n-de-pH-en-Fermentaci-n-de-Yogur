import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import NuevoEnsayoScreen from '../screens/NuevoEnsayoScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { userToken, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      {userToken === null ? (
        // Flujo de autenticación (Público)
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'PrediYogur - Iniciar Sesión', headerShown: false }}
        />
      ) : (
        // Flujo principal de la aplicación (Privado)
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ title: 'PrediYogur - Panel Principal' }}
          />
          <Stack.Screen
            name="NuevoEnsayo"
            component={NuevoEnsayoScreen}
            options={{ title: 'Nuevo Ensayo de Fermentación' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
