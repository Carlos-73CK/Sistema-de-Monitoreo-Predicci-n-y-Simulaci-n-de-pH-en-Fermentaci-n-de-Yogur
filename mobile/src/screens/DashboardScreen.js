import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard - PrediYogur</Text>
      <Text style={styles.subtitle}>
        Bienvenido, {user?.nombre || 'Investigador'}
      </Text>

      <View style={styles.buttonWrapper}>
        <Button
          title="Nuevo Ensayo"
          onPress={() => navigation.navigate('NuevoEnsayo')}
        />
      </View>

      <View style={styles.buttonWrapper}>
        <Button
          title="Cerrar Sesión"
          color="#d9534f"
          onPress={logout}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  buttonWrapper: {
    width: '80%',
    marginVertical: 8,
  },
});
