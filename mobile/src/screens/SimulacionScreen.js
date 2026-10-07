import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import simulationService from '../services/simulationService';

export default function SimulacionScreen() {
  const [sustrato, setSustrato] = useState('vaca');
  const [masaInoculo, setMasaInoculo] = useState('30');
  const [temperatura, setTemperatura] = useState('42');

  const [resultado, setResultado] = useState(() =>
    simulationService.simularAcidificacion({
      tipoSustrato: 'vaca',
      masaInoculoG: 30,
      temperaturaC: 42,
    })
  );

  const handleSimular = () => {
    const masa = parseFloat(masaInoculo) || 30;
    const temp = parseFloat(temperatura) || 42;

    const res = simulationService.simularAcidificacion({
      tipoSustrato: sustrato,
      masaInoculoG: masa,
      temperaturaC: temp,
    });
    setResultado(res);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Simulador Cinético ("What-If")</Text>
        <Text style={styles.descripcion}>
          Proyecta la curva de acidificación y el tiempo para alcanzar el pH de corte (4.5) variando temperatura e inóculo Chivería.
        </Text>
      </View>

      {/* Selector de Sustrato */}
      <View style={styles.card}>
        <Text style={styles.labelSeccion}>1. Matriz / Tipo de Leche</Text>
        <View style={styles.sustratoRow}>
          {['vaca', 'chocho', 'coco'].map((tipo) => (
            <TouchableOpacity
              key={tipo}
              style={[
                styles.btnSustrato,
                sustrato === tipo && styles.btnSustratoActivo,
              ]}
              onPress={() => setSustrato(tipo)}
            >
              <Text
                style={[
                  styles.btnSustratoTexto,
                  sustrato === tipo && styles.btnSustratoTextoActivo,
                ]}
              >
                {tipo.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inputs de Parámetros */}
        <View style={styles.parametrosRow}>
          <View style={styles.parametroCol}>
            <Text style={styles.label}>Inóculo Chivería (g)</Text>
            <TextInput
              style={styles.input}
              value={masaInoculo}
              onChangeText={setMasaInoculo}
              keyboardType="numeric"
              placeholder="30"
            />
          </View>

          <View style={styles.parametroCol}>
            <Text style={styles.label}>Temperatura (°C)</Text>
            <TextInput
              style={styles.input}
              value={temperatura}
              onChangeText={setTemperatura}
              keyboardType="numeric"
              placeholder="42"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.btnSimular} onPress={handleSimular}>
          <Text style={styles.btnSimularTexto}>⚡ Ejecutar Simulación</Text>
        </TouchableOpacity>
      </View>

      {/* Alerta de Desviación Térmica */}
      {resultado.fueraDeRangoTermico && (
        <View style={styles.alertaCard}>
          <Text style={styles.alertaTitulo}>⚠️ EFECTO CINÉTICO POR DESVIACIÓN TÉRMICA</Text>
          <Text style={styles.alertaTexto}>{resultado.alertaTermica}</Text>
          <Text style={styles.alertaSubtexto}>
            Al operar fuera de 41 °C – 43 °C, la velocidad de fermentación bacteriana disminuye significativamente o sufre estrés térmico.
          </Text>
        </View>
      )}

      {/* Resultados Principales */}
      <View style={styles.resultadosCard}>
        <Text style={styles.labelSeccion}>Predicción de Corte (pH 4.5)</Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Tiempo Estimado</Text>
            <Text style={styles.kpiValor}>{resultado.tiempoEstimadoHoras} h</Text>
            <Text style={styles.kpiSub}>~{resultado.tiempoEstimadoCorteMinutos} minutos</Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>pH Inicial Estimado</Text>
            <Text style={styles.kpiValor}>{resultado.phInicial.toFixed(2)}</Text>
            <Text style={styles.kpiSub}>Meta de corte: {resultado.phCorte.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Proyección Temporal de la Curva */}
      <View style={styles.card}>
        <Text style={styles.labelSeccion}>Proyección Temporal de pH</Text>
        <View style={styles.tablaHeader}>
          <Text style={styles.tablaHeadCol}>Minutos</Text>
          <Text style={styles.tablaHeadCol}>Horas</Text>
          <Text style={styles.tablaHeadCol}>pH Estimado</Text>
          <Text style={styles.tablaHeadCol}>Estado</Text>
        </View>

        {resultado.puntos.map((pt, idx) => (
          <View key={idx} style={styles.tablaFila}>
            <Text style={styles.tablaCol}>{pt.minutos} min</Text>
            <Text style={styles.tablaCol}>{(pt.minutos / 60).toFixed(1)} h</Text>
            <Text style={[styles.tablaCol, pt.ph <= 4.5 && { color: '#e53e3e', fontWeight: 'bold' }]}>
              {pt.ph.toFixed(2)}
            </Text>
            <Text style={[styles.tablaCol, { fontSize: 11 }]}>
              {pt.ph <= 4.5 ? 'CORTE' : 'Acidificando'}
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
  header: {
    marginBottom: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  descripcion: {
    fontSize: 13,
    color: '#4a5568',
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  labelSeccion: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 10,
  },
  sustratoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  btnSustrato: {
    flex: 0.31,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    alignItems: 'center',
    backgroundColor: '#edf2f7',
  },
  btnSustratoActivo: {
    backgroundColor: '#2b6cb0',
    borderColor: '#2b6cb0',
  },
  btnSustratoTexto: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4a5568',
  },
  btnSustratoTextoActivo: {
    color: '#ffffff',
  },
  parametrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  parametroCol: {
    flex: 0.48,
  },
  label: {
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
  },
  btnSimular: {
    backgroundColor: '#2b6cb0',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  btnSimularTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  alertaCard: {
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
    fontSize: 13,
    marginBottom: 4,
  },
  alertaTexto: {
    color: '#7b341e',
    fontSize: 12,
  },
  alertaSubtexto: {
    color: '#9c4221',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  resultadosCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiBox: {
    flex: 0.48,
    backgroundColor: '#ebf8ff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#2b6cb0',
    fontWeight: '600',
  },
  kpiValor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5282',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#4a5568',
  },
  tablaHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#edf2f7',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tablaHeadCol: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#4a5568',
  },
  tablaFila: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
    paddingVertical: 6,
  },
  tablaCol: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#4a5568',
  },
});
