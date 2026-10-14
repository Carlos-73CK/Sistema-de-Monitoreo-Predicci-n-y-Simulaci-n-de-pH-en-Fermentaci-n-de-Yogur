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

  // 🎯 Estimación y Recalibración Dinámica en Vuelo hacia pH 4.50
  const calcularEstimacionDinamica = () => {
    if (lecturas.length < 2) {
      return {
        tiempoCorteMinutos: 255,
        tiempoCorteHoras: 4.25,
        minutosRestantes: 255,
        diferenciaMinutos: 0,
        ritmo: 1.0,
        confianza: 'Estimación Teórica (± 30 min)',
        diagnostico: 'A la espera de lecturas a 60 y 120 min para recalibrar en vuelo.'
      };
    }

    const t0 = lecturas[0];
    const tk = lecturas[lecturas.length - 1];

    if (tk.ph <= 4.50) {
      return {
        tiempoCorteMinutos: tk.minutos,
        tiempoCorteHoras: parseFloat((tk.minutos / 60).toFixed(2)),
        minutosRestantes: 0,
        diferenciaMinutos: tk.minutos - 255,
        ritmo: parseFloat((255 / (tk.minutos || 1)).toFixed(2)),
        confianza: 'Corte Alcanzado (100%)',
        diagnostico: '¡Punto de corte crítico pH 4.50 alcanzado! Suspender incubación.'
      };
    }

    const deltaT = tk.minutos - t0.minutos;
    const deltaPh = t0.ph - tk.ph;

    // Velocidad promedio observada (caída de pH / minuto)
    const tasa = deltaT > 0 && deltaPh > 0 ? deltaPh / deltaT : 0.0068;
    const phRestante = Math.max(0, tk.ph - 4.50);
    const minRestantes = Math.max(1, Math.round(phRestante / (tasa || 0.0068)));
    const corteEstimado = tk.minutos + minRestantes;
    const dif = corteEstimado - 255;
    const razon = parseFloat(((deltaPh / (deltaT || 1)) / 0.0068).toFixed(2));

    let confianza = 'Baja (± 25 min)';
    if (lecturas.length >= 4 || tk.minutos >= 180) confianza = 'Muy Alta (± 5 min)';
    else if (lecturas.length >= 3 || tk.minutos >= 120) confianza = 'Alta (± 10 min)';
    else if (lecturas.length >= 2) confianza = 'Media (± 18 min)';

    let diagnostico = 'Acidificación a ritmo estándar nominal de laboratorio.';
    if (dif < -5) diagnostico = `⚡ Acidificación rápida (${Math.abs(dif)} min antes). Vigilar baño maría.`;
    else if (dif > 5) diagnostico = `❄️ Acidificación lenta (+${dif} min de retraso). Verificar temperatura.`;

    return {
      tiempoCorteMinutos: corteEstimado,
      tiempoCorteHoras: parseFloat((corteEstimado / 60).toFixed(2)),
      minutosRestantes: minRestantes,
      diferenciaMinutos: dif,
      ritmo: razon > 0 ? razon : 1.0,
      confianza,
      diagnostico
    };
  };

  const estimacion = calcularEstimacionDinamica();

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

      {/* Tarjeta de Recalibración Dinámica en Vivo (IA) */}
      <View style={styles.recalibracionCard}>
        <View style={styles.recalibracionHeader}>
          <Text style={styles.recalibracionTitulo}>🎯 Recalibración IA en Vuelo</Text>
          <View style={styles.recalibracionBadge}>
            <Text style={styles.recalibracionBadgeTexto}>{estimacion.confianza}</Text>
          </View>
        </View>

        <View style={styles.recalibracionGrid}>
          <View style={styles.recalibracionItem}>
            <Text style={styles.recalibracionLabel}>Tiempo Corte pH 4.5</Text>
            <Text style={styles.recalibracionValDestacado}>{estimacion.tiempoCorteHoras} h</Text>
            <Text style={styles.recalibracionSub}>~{estimacion.tiempoCorteMinutos} min</Text>
          </View>
          <View style={styles.recalibracionItem}>
            <Text style={styles.recalibracionLabel}>Variación vs Teórico</Text>
            <Text style={[
              styles.recalibracionVal,
              estimacion.diferenciaMinutos < -3 ? { color: '#059669' } : (estimacion.diferenciaMinutos > 3 ? { color: '#d97706' } : { color: '#0284c7' })
            ]}>
              {estimacion.diferenciaMinutos > 0 ? `+${estimacion.diferenciaMinutos}` : estimacion.diferenciaMinutos} min
            </Text>
            <Text style={styles.recalibracionSub}>Ritmo: {estimacion.ritmo}x</Text>
          </View>
        </View>

        <Text style={styles.diagnosticoTexto}>{estimacion.diagnostico}</Text>
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
  recalibracionCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  recalibracionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recalibracionTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  recalibracionBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7dd3fc',
  },
  recalibracionBadgeTexto: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  recalibracionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recalibracionItem: {
    flex: 0.48,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recalibracionLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  recalibracionValDestacado: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0284c7',
    marginVertical: 2,
  },
  recalibracionVal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  recalibracionSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  diagnosticoTexto: {
    fontSize: 12,
    color: '#0c4a6e',
    backgroundColor: '#e0f2fe',
    padding: 8,
    borderRadius: 6,
    lineHeight: 16,
  },
});
