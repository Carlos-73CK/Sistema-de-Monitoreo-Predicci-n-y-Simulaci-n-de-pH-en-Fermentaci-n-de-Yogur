/**
 * Servicio de Simulación y Modelado Cinético de pH ("What-If Analysis")
 * Cátedra de Química de Alimentos - ULEAM (Dr. Stalin Santacruz)
 * 
 * CALIBRADO con la matriz experimental real de 6 lotes de laboratorio:
 * - Leche entera de vaca (250 g)
 * - Inóculo Chivería: 2.5% (6.25 g) y 7.5% (18.75 g)
 * - Temperaturas evaluadas: 40 °C, 42 °C (óptima) y 44 °C
 * - Monitoreo simultáneo: pH, Temperatura, Índice de Refracción (°Brix) y Viscosidad Final (mPa·s)
 */

export const simulationService = {
  /**
   * Ensayos experimentales de referencia del Dr. Stalin Santacruz (ULEAM)
   */
  ENSAYOS_REFERENCIA: [
    { id: 'E1', temp: 40, inoculoPct: 2.5, inoculoG: 6.25, tiempoCorteH: 5.83, viscosidad: 2579, brixFinal: 5.9 },
    { id: 'E2', temp: 40, inoculoPct: 7.5, inoculoG: 18.75, tiempoCorteH: 5.50, viscosidad: 786.6, brixFinal: 5.5 },
    { id: 'E3', temp: 42, inoculoPct: 2.5, inoculoG: 6.25, tiempoCorteH: 6.75, viscosidad: 1454, brixFinal: 5.1 },
    { id: 'E4', temp: 42, inoculoPct: 7.5, inoculoG: 18.75, tiempoCorteH: 4.25, viscosidad: 2639, brixFinal: 5.7, optimo: true },
    { id: 'E5', temp: 44, inoculoPct: 2.5, inoculoG: 6.25, tiempoCorteH: 6.50, viscosidad: 1185, brixFinal: 6.1 },
    { id: 'E6', temp: 44, inoculoPct: 7.5, inoculoG: 18.75, tiempoCorteH: 6.50, viscosidad: 796.5, brixFinal: 7.4 },
  ],

  /**
   * Genera la simulación predictiva de pH, tiempo de corte, refracción y viscosidad esperada
   * @param {Object} params
   * @param {'vaca'|'chocho'|'coco'} [params.tipoSustrato='vaca']
   * @param {number} [params.masaInoculoG=18.75] - Gramos de yogur Chivería
   * @param {number} [params.temperaturaC=42] - Temperatura de incubación en baño maría
   * @param {number} [params.volumenMl=250] - Volumen de la muestra en gramos o mL
   * @returns {Object} Resultado de la simulación What-If
   */
  simularAcidificacion: ({
    tipoSustrato = 'vaca',
    tipoAzucar = 'lactosa',
    masaInoculoG = 18.75,
    temperaturaC = 42,
    volumenMl = 250,
  }) => {
    const masa = Number(masaInoculoG) || 18.75;
    const temp = Number(temperaturaC) || 42;
    const vol = Number(volumenMl) || 250;

    // Concentración de inóculo en porcentaje (%)
    const porcentajeInoculo = (masa / vol) * 100;

    // 1. Parámetros basales calibrados
    let phInicial = 6.25;
    const PH_CORTE = 4.50; // Constante inviolable indicada por el Dr. Stalin Santacruz
    let brixInicial = 10.5;

    if (tipoSustrato === 'chocho') {
      phInicial = 6.45;
      brixInicial = 9.2;
    } else if (tipoSustrato === 'coco') {
      phInicial = 6.35;
      brixInicial = 8.8;
    }

    // 2. Modelo cinético de tiempo de corte (horas) interpolado de los datos de laboratorio
    let tiempoBaseHoras = 4.25;
    if (porcentajeInoculo <= 3.0) {
      tiempoBaseHoras = 6.75;
    } else if (porcentajeInoculo < 7.0) {
      const alpha = (porcentajeInoculo - 2.5) / (7.5 - 2.5);
      tiempoBaseHoras = 6.75 - alpha * (6.75 - 4.25);
    } else {
      tiempoBaseHoras = 4.25;
    }

    // Modulador cinético por carbohidrato (Audio 2 Dr. Santacruz)
    let modAzucar = 1.0;
    if (tipoAzucar === 'glucosa') modAzucar = 0.95;
    else if (tipoAzucar === 'sacarosa') modAzucar = 1.02;

    tiempoBaseHoras *= modAzucar;

    // 3. Penalización térmica experimental (Arrhenius empírico del Dr. Santacruz):
    let factorTermico = 1.0;
    if (temp >= 41.5 && temp <= 42.5) {
      factorTermico = 1.0; // Máxima eficiencia a 42 °C
    } else if (temp < 41.5) {
      const deltaT = 42.0 - temp;
      factorTermico = 1.0 + deltaT * 0.14;
    } else {
      const deltaT = temp - 42.0;
      factorTermico = 1.0 + deltaT * 0.25;
    }

    const tiempoCorteFinalHoras = Number((tiempoBaseHoras * factorTermico).toFixed(2));
    const tiempoCorteMinutos = Math.round(tiempoCorteFinalHoras * 60);

    // 4. Estimación de Viscosidad Final según datos de laboratorio (Brookfield, rotor 4, 60 rpm)
    let viscosidadEstimada = 1800;
    let diagnosticoReologico = 'Viscosidad dentro de los parámetros esperados.';

    if (temp >= 41.5 && temp <= 42.5 && porcentajeInoculo >= 6.0) {
      viscosidadEstimada = 2639;
      diagnosticoReologico = '⭐ CONDICIÓN ÓPTIMA: Se proyecta la máxima firmeza de gel lácteo (2639 mPa·s).';
    } else if (temp <= 40.5 && porcentajeInoculo >= 6.0) {
      viscosidadEstimada = 786.6;
      diagnosticoReologico = '⚠️ Viscosidad reducida (786 mPa·s). A 40 °C con alto inóculo la acidificación rápida debilita la red de caseína.';
    } else if (temp >= 43.5) {
      viscosidadEstimada = porcentajeInoculo >= 6.0 ? 796.5 : 1185;
      diagnosticoReologico = '⚠️ Descenso marcado de viscosidad (<1200 mPa·s) por desnaturalización y estrés térmico a >43 °C.';
    } else if (temp <= 40.5 && porcentajeInoculo <= 3.5) {
      viscosidadEstimada = 2579;
      diagnosticoReologico = 'Gel firme (2579 mPa·s) logrado tras fermentación lenta prolongada.';
    } else {
      viscosidadEstimada = 1454;
      diagnosticoReologico = 'Consistencia estándar de yogur batido (1454 mPa·s).';
    }

    // 5. Curva de puntos cinéticos proyectados (cada 30 min)
    const puntos = [];
    const deltaMin = 30;
    const totalPuntos = Math.max(Math.ceil(tiempoCorteMinutos / deltaMin) + 1, 6);

    for (let i = 0; i <= totalPuntos; i++) {
      const min = i * deltaMin;
      const fraccion = Math.min(min / tiempoCorteMinutos, 1.0);
      
      const phCurva = Number(
        (phInicial - (phInicial - PH_CORTE) * Math.pow(fraccion, 1.8)).toFixed(2)
      );

      const brixCurva = Number(
        (brixInicial - (brixInicial - 5.5) * Math.pow(fraccion, 2.0)).toFixed(1)
      );

      puntos.push({
        minutos: min,
        horas: (min / 60).toFixed(1),
        ph: phCurva,
        temperatura: temp,
        brix: brixCurva,
        estado: min >= tiempoCorteMinutos ? 'Corte Alcanzado' : 'En Fermentación',
      });

      if (min >= tiempoCorteMinutos + 30) break;
    }

    const fueraDeRangoTermico = temp < 41.0 || temp > 43.0;

    return {
      tipoSustrato,
      tipoAzucar,
      masaInoculoG: masa,
      porcentajeInoculo: Number(porcentajeInoculo.toFixed(1)),
      temperaturaC: temp,
      volumenMl: vol,
      phInicial,
      phCorte: PH_CORTE,
      tiempoEstimadoHoras: tiempoCorteFinalHoras,
      tiempoEstimadoCorteMinutos: tiempoCorteMinutos,
      viscosidadEstimadaMpaS: viscosidadEstimada,
      diagnosticoReologico,
      reglaMedicionViscosidad: 'La viscosidad se mide al final (pH 4.50) con rotor 4 a 60 rpm.',
      brixInicial,
      brixFinalEsperado: 5.7,
      fueraDeRangoTermico,
      alertaTermica: fueraDeRangoTermico
        ? `⚠️ Alerta: Temperatura (${temp} °C) fuera del rango óptimo (41.0 °C – 43.0 °C). Modifica la acidificación.`
        : null,
      puntos,
    };
  },
};

export default simulationService;
