import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';

export default function MonitoreoScreen({ route, navigation }) {
  // Datos iniciales de ensayo (o recibidos por parámetros de navegación)
  const ensayoParam = route?.params?.ensayo || {
    id: 1,
    codigo: 'LOTE-YOG-001',
    tipoSustrato: 'vaca',
    masaInoculoG: 30,
    temperaturaObjetivo: 42.0,
    estado: 'en_proceso',
  };

  const [lecturas, setLecturas] = useState([
    { id: 1, minutos: 0, ph: 6.68, temperatura: 42.0 },
    { id: 2, minutos: 60, ph: 6.20, temperatura: 42.1 },
    { id: 3, minutos: 120, ph: 5.45, temperatura: 41.8 },
    { id: 4, minutos: 180, ph: 4.85, temperatura: 42.0 },
  ]);

  // Formulario de nueva lectura
  const [minutosInput, setMinutosInput] = useState('');
  const [phInput, setPhInput] = useState('');
  const [tempInput, setTempInput] = useState('');

  // Formulario de finalización
  const [viscosidadInput, setViscosidadInput] = useState('');
  const [ensayoFinalizado, setEnsayoFinalizado] = useState(false);

  // Última lectura registrada
  const ultimaLectura = lecturas[lecturas.length - 1] || null;
  const phActual = ultimaLectura ? ultimaLectura.ph : 7.0;
  const tempActual = ultimaLectura ? ultimaLectura.temperatura : 42.0;

  // Reglas biológicas y térmicas
  const fueraDeRangoTermico = tempActual < 41.0 || tempActual > 43.0;
  const phCorteAlcanzado = phActual <= 4.5;

  const handleAgregarLectura = () => {
    const minutos = parseFloat(minutosInput);
    const ph = parseFloat(phInput);
    const temperatura = parseFloat(tempInput);

    if (isNaN(minutos) || isNaN(ph) || isNaN(temperatura)) {
      Alert.alert('Datos Inválidos', 'Por favor ingresa valores numéricos para minutos, pH y temperatura.');
      return;
    }

    if (ph < 2 || ph > 9) {
      Alert.alert('Rango no válido', 'El pH debe estar en un rango biológico coherente (2.0 a 9.0).');
      return;
    }

    const nuevaLectura = {
      id: Date.now(),
      minutos,
      ph,
      temperatura,
    };

    setLecturas([...lecturas, nuevaLectura]);
    setMinutosInput('');
    setPhInput('');
    setTempInput('');

    if (ph <= 4.5) {
      Alert.alert(
        '¡Corte Crítico de Fermentación!',
        'Se ha alcanzado el pH 4.5. Suspenda la incubación y mida obligatoriamente la viscosidad final.'
      );
    }
  };

  const handleFinalizarEnsayo = () => {
    const viscosidad = parseFloat(viscosidadInput);
    if (isNaN(viscosidad) || viscosidad <= 0) {
      Alert.alert('Viscosidad Requerida', 'El registro de viscosidad final es obligatorio según el protocolo del Dr. Stalin Santacruz.');
      return;
    }

    setEnsayoFinalizado(true);
    Alert.alert(
      'Ensayo Finalizado',
      `Fermentación culminada con éxito. Viscosidad final registrada: ${viscosidad} mPa·s.`,
      [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Encabezado del Lote */}
      <View style={styles.cardHeader}>
        <Text style={styles.codigoText}>{ensayoParam.codigo}</Text>
        <Text style={styles.subText}>
          Sustrato: {ensayoParam.tipoSustrato.toUpperCase()} | Inóculo Chivería: {ensayoParam.masaInoculoG} g
        </Text>
      </View>

      {/* Alerta de Desviación Térmica (41 °C - 43 °C) */}
      {fueraDeRangoTermico && (
        <View style={styles.alertaTermicaContainer}>
          <Text style={styles.alertaTitulo}>⚠️ ALERTA DE CONTROL TÉRMICO</Text>
          <Text style={styles.alertaTexto}>
            La temperatura actual ({tempActual} °C) está fuera de la ventana óptima de incubación (41.0 °C – 43.0 °C). Ajuste el baño de agua.
          </Text>
        </View>
      )}

      {/* Alerta de pH de Corte (4.5) */}
      {phCorteAlcanzado && (
        <View style={styles.alertaCorteContainer}>
          <Text style={styles.alertaCorteTitulo}>🛑 ¡pH DE CORTE (4.5) ALCANZADO!</Text>
          <Text style={styles.alertaCorteTexto}>
            La acidificación óptima ha sido completada. Suspenda el proceso y mida la viscosidad final.
          </Text>
        </View>
      )}

      {/* Panel de Métricas Actuales */}
      <View style={styles.metricasRow}>
        <View style={styles.metricaBox}>
          <Text style={styles.metricaEtiqueta}>pH Actual</Text>
          <Text style={[styles.metricaValor, phCorteAlcanzado && { color: '#c0392b' }]}>
            {phActual.toFixed(2)}
          </Text>
          <Text style={styles.metricaMeta}>Meta de corte: 4.50</Text>
        </View>

        <View style={styles.metricaBox}>
          <Text style={styles.metricaEtiqueta}>Temperatura</Text>
          <Text style={[styles.metricaValor, fueraDeRangoTermico ? { color: '#e67e22' } : { color: '#27ae60' }]}>
            {tempActual.toFixed(1)} °C
          </Text>
          <Text style={styles.metricaMeta}>Óptimo: 42.0 °C</Text>
        </View>
      </View>

      {/* Formulario de Nueva Lectura */}
      {!ensayoFinalizado && (
        <View style={styles.formCard}>
          <Text style={styles.seccionTitulo}>Registrar Nueva Lectura</Text>
          <View style={styles.inputsRow}>
            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>Minutos</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 240"
                keyboardType="numeric"
                value={minutosInput}
                onChangeText={setMinutosInput}
              />
            </View>
            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>pH</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 4.60"
                keyboardType="numeric"
                value={phInput}
                onChangeText={setPhInput}
              />
            </View>
            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>Temp (°C)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 42.0"
                keyboardType="numeric"
                value={tempInput}
                onChangeText={setTempInput}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.btnAgregar} onPress={handleAgregarLectura}>
            <Text style={styles.btnTexto}>+ Guardar Lectura</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Registro de Viscosidad Final Obligatoria */}
      {!ensayoFinalizado && (
        <View style={styles.cierreCard}>
          <Text style={styles.seccionTitulo}>Corte y Control Reológico Final</Text>
          <Text style={styles.cierreDescripcion}>
            Al alcanzar el corte en pH 4.5, registre obligatoriamente la viscosidad final de la matriz láctea:
          </Text>
          <View style={styles.viscosidadRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 10 }]}
              placeholder="Viscosidad (mPa·s / cP)"
              keyboardType="numeric"
              value={viscosidadInput}
              onChangeText={setViscosidadInput}
            />
            <TouchableOpacity style={styles.btnFinalizar} onPress={handleFinalizarEnsayo}>
              <Text style={styles.btnFinalizarTexto}>Finalizar Ensayo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Historial de Lecturas */}
      <View style={styles.tablaCard}>
        <Text style={styles.seccionTitulo}>Historial Cinético ({lecturas.length} lecturas)</Text>
        <View style={styles.tablaHeader}>
          <Text style={[styles.tablaCol, { fontWeight: 'bold' }]}>Minutos</Text>
          <Text style={[styles.tablaCol, { fontWeight: 'bold' }]}>pH</Text>
          <Text style={[styles.tablaCol, { fontWeight: 'bold' }]}>Temp (°C)</Text>
        </View>
        {lecturas.map((item) => (
          <View key={item.id} style={styles.tablaFila}>
            <Text style={styles.tablaCol}>{item.minutos} min</Text>
            <Text style={[styles.tablaCol, item.ph <= 4.5 && { color: '#c0392b', fontWeight: 'bold' }]}>
              {item.ph.toFixed(2)}
            </Text>
            <Text style={[styles.tablaCol, (item.temperatura < 41 || item.temperatura > 43) && { color: '#e67e22', fontWeight: 'bold' }]}>
              {item.temperatura.toFixed(1)} °C
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  cardHeader: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  codigoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  subText: {
    fontSize: 13,
    color: '#4a5568',
    marginTop: 4,
  },
  alertaTermicaContainer: {
    backgroundColor: '#fffaf0',
    borderColor: '#dd6b20',
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  alertaTitulo: {
    color: '#c05621',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  alertaTexto: {
    color: '#7b341e',
    fontSize: 13,
    lineHeight: 18,
  },
  alertaCorteContainer: {
    backgroundColor: '#fff5f5',
    borderColor: '#e53e3e',
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  alertaCorteTitulo: {
    color: '#c53030',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  alertaCorteTexto: {
    color: '#742a2a',
    fontSize: 13,
    lineHeight: 18,
  },
  metricasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricaBox: {
    flex: 0.48,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  metricaEtiqueta: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '600',
  },
  metricaValor: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2b6cb0',
    marginVertical: 4,
  },
  metricaMeta: {
    fontSize: 11,
    color: '#a0aec0',
  },
  formCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 10,
  },
  inputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputCol: {
    flex: 0.31,
  },
  inputLabel: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  btnAgregar: {
    backgroundColor: '#3182ce',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  btnTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cierreCard: {
    backgroundColor: '#f7fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  cierreDescripcion: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 10,
  },
  viscosidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnFinalizar: {
    backgroundColor: '#d69e2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  btnFinalizarTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tablaCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  tablaHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#edf2f7',
    paddingBottom: 8,
    marginBottom: 6,
  },
  tablaFila: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
    paddingVertical: 8,
  },
  tablaCol: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#4a5568',
  },
});
