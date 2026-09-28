import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useContext(AuthContext);

  const handleLogin = () => {
    login('token_falso_jwt', { nombre: 'Carlos' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PrediYogur</Text>
      <Text style={styles.subtitle}>Inicio de Sesión (Provisional)</Text>
      <View style={styles.buttonWrapper}>
        <Button title="Ingresar (Simular Login)" onPress={handleLogin} />
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
    fontSize: 24,
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
  },
});
