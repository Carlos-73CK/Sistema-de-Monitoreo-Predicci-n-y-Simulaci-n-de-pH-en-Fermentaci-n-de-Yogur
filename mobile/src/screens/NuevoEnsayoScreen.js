import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function NuevoEnsayoScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo Ensayo</Text>
      <Text style={styles.subtitle}>Configuración de lote y monitoreo cinético</Text>

      <View style={styles.buttonWrapper}>
        <Button
          title="Regresar al Dashboard"
          onPress={() => navigation.goBack()}
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
  },
});
