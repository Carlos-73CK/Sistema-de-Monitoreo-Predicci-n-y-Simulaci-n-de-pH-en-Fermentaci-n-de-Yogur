/**
 * Servicio de Simulación y Modelado Cinético de pH ("What-If Analysis")
 * Cátedra de Química de Alimentos - ULEAM
 * Patrocinador Científico: Dr. Stalin Gustavo Santacruz Terán
 * Especialista Bioestadístico: Jordan Meza
 * 
 * CALIBRADO con la matriz experimental real del Dr. Stalin Santacruz y cinética de Hill:
 * 1. Inóculo porcentual como parámetro principal y cálculo dinámico de masa:
 *    masaInoculoG = (porcentajeInoculo / 100) * masaSolucionG
 * 2. Modelado de mezclas de carbohidratos ('mezcla_sacarosa_glucosa'):
 *    - Glucosa: Vía homoláctica directa e inmediata (sin retraso hidrolítico).
 *    - Sacarosa: Inducción previa de enzima invertasa disacárida.
 *    - Ponderación de Vmax y latencia según ratio de glucosa.
 * 3. Modelado del efecto buffer en bebida de almendra (Nature's Heart):
 *    - Amortiguación de protones libres [H+] por carbonato de calcio y fosfato tricálcico.
 *    - Meseta estabilizada entre pH 5.0 y 5.3 tras 6-7 horas, sin decaimiento a 4.50.
 * 4. Predicción de viscosidad Brookfield final (rotor 4, 60 rpm):
 *    - Vaca a 42 °C / 7.5% -> ~2639 mPa·s (Óptimo ULEAM).
 *    - Vaca a 40 °C / 2.5% -> ~2579 mPa·s (Gel firme prolongado).
 *    - Vaca a 44 °C -> ~796 - 1185 mPa·s (Desnaturalización térmica).
 *    - Avena y Almendra -> ~50 - 300 mPa·s (Geles débiles / fluidos viscosos).
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
   * 1. INÓCULO PORCENTUAL Y MASA DINÁMICA
   * masaInoculoG = (porcentajeInoculo / 100) * masaSolucionG
   */
  calcularMasaInoculo: (porcentajeInoculo, masaSolucionG = 250) => {
    const pct = Number(porcentajeInoculo) || 7.5;
    const sol = Number(masaSolucionG) || 250;
    return Number(((pct / 100) * sol).toFixed(2));
  },

  calcularPorcentajeInoculo: (masaInoculoG, masaSolucionG = 250) => {
    const masa = Number(masaInoculoG) || 18.75;
    const sol = Number(masaSolucionG) || 250;
    return Number(((masa / sol) * 100).toFixed(2));
  },

  /**
   * 4. PREDICCIÓN DE VISCOSIDAD BROOKFIELD FINAL (rotor 4, 60 rpm)
   */
  estimarViscosidadBrookfieldFinal: ({ tipoSustrato = 'vaca', temperaturaC = 42, porcentajeInoculo = 7.5 }) => {
    const temp = Number(temperaturaC) || 42;
    const pct = Number(porcentajeInoculo) || 7.5;
    const sustratoNorm = String(tipoSustrato).toLowerCase();

    if (sustratoNorm.includes('almendra')) {
      let viscosidad = Math.round(95 + 15 * Math.sin(temp * 0.1) + (pct - 2.5) * 4);
      viscosidad = Math.max(50, Math.min(300, viscosidad));
      return {
        viscosidadEstimada: viscosidad,
        diagnosticoReologico: 'Bebida de almendra (~95 mPa·s): Fluido viscoso / gel débil (50 - 300 mPa·s) por ausencia de micelas de caseína bovina.',
      };
    }

    if (sustratoNorm.includes('avena')) {
      let viscosidad = Math.round(180 + (temp <= 42 ? 25 : -20) + (pct >= 5 ? 20 : 0));
      viscosidad = Math.max(50, Math.min(300, viscosidad));
      return {
        viscosidadEstimada: viscosidad,
        diagnosticoReologico: 'Bebida de avena (~180 mPa·s): Gel débil / fluido viscoso (50 - 300 mPa·s) estructurado por beta-glucanos.',
      };
    }

    if (sustratoNorm.includes('chocho') || sustratoNorm.includes('coco')) {
      const viscosidad = Math.round(260 + (pct >= 5 ? 40 : -20));
      return {
        viscosidadEstimada: viscosidad,
        diagnosticoReologico: `Gel vegetal suave de ${tipoSustrato} (~${viscosidad} mPa·s).`,
      };
    }

    if (temp >= 41.5 && temp <= 42.5 && pct >= 6.0) {
      return {
        viscosidadEstimada: 2639,
        diagnosticoReologico: '⭐ CONDICIÓN ÓPTIMA (42 °C / 7.5%): Máxima firmeza de gel de caseína registrada (~2639 mPa·s).',
      };
    }

    if (temp <= 40.5 && pct <= 3.5) {
      return {
        viscosidadEstimada: 2579,
        diagnosticoReologico: 'Gel lácteo firme (~2579 mPa·s): Logrado tras acidificación lenta y prolongada a 40 °C.',
      };
    }

    if (temp >= 43.5) {
      const viscosidad = pct >= 6.0 ? 796.5 : 1185;
      return {
        viscosidadEstimada: viscosidad,
        diagnosticoReologico: `⚠️ Descenso severo de viscosidad (~${viscosidad} mPa·s [796 - 1185 mPa·s]) por desnaturalización y estrés térmico a >43 °C.`,
      };
    }

    if (temp <= 40.5 && pct >= 6.0) {
      return {
        viscosidadEstimada: 786.6,
        diagnosticoReologico: '⚠️ Viscosidad reducida (~786.6 mPa·s): A 40 °C con alto inóculo la acidificación rápida debilita la red de caseína.',
      };
    }

    return {
      viscosidadEstimada: 1454,
      diagnosticoReologico: 'Consistencia estándar de yogur batido (~1454 mPa·s).',
    };
  },

  /**
   * Genera la simulación predictiva de pH, tiempo de corte, refracción y viscosidad esperada
   */
  simularAcidificacion: ({
    tipoSustrato = 'vaca',
    tipoAzucar = 'lactosa',
    ratioGlucosa = 0.5,
    porcentajeInoculo,
    masaInoculoG,
    temperaturaC = 42,
    volumenMl = 250,
    masaSolucionG,
  }) => {
    const sol = Number(masaSolucionG !== undefined ? masaSolucionG : (volumenMl !== undefined ? volumenMl : 250)) || 250;
    const temp = Number(temperaturaC) || 42;

    // 1. INÓCULO PORCENTUAL Y MASA DINÁMICA
    let pct;
    let masa;
    if (porcentajeInoculo !== undefined && porcentajeInoculo !== null && porcentajeInoculo !== '') {
      pct = Number(porcentajeInoculo);
      masa = Number(((pct / 100) * sol).toFixed(2));
    } else if (masaInoculoG !== undefined && masaInoculoG !== null && masaInoculoG !== '') {
      masa = Number(masaInoculoG);
      pct = Number(((masa / sol) * 100).toFixed(2));
    } else {
      pct = 7.5;
      masa = Number(((7.5 / 100) * sol).toFixed(2));
    }

    const sustratoNorm = String(tipoSustrato).toLowerCase();
    const azucarNorm = String(tipoAzucar).toLowerCase();

    // 2. Parámetros basales y EFECTO BUFFER
    let phInicial = 6.25;
    const PH_CORTE = 4.50;
    let brixInicial = 10.5;
    let phFinal = 4.50;
    let efectoBuffer = false;
    let brixFinalEsperado = 5.7;

    if (sustratoNorm.includes('almendra')) {
      // 3. MODELADO DEL EFECTO BUFFER EN BEBIDA DE ALMENDRA (Nature's Heart)
      // Amortiguación química por sales inorgánicas (CaCO3 / fosfato tricálcico)
      phInicial = 6.55;
      phFinal = 5.15; // Meseta estabilizada entre 5.0 y 5.3 tras 6-7h
      brixInicial = 5.2;
      brixFinalEsperado = 4.6;
      efectoBuffer = true;
    } else if (sustratoNorm.includes('avena')) {
      phInicial = 6.40;
      brixInicial = 9.8;
      brixFinalEsperado = 5.4;
    } else if (sustratoNorm.includes('chocho')) {
      phInicial = 6.45;
      brixInicial = 9.2;
      brixFinalEsperado = 5.8;
    } else if (sustratoNorm.includes('coco')) {
      phInicial = 6.35;
      brixInicial = 8.8;
      brixFinalEsperado = 5.5;
    }

    // 3. MODELADO DE MEZCLAS DE AZÚCARES
    let modAzucar = 1.0;
    let factorVmax = 1.0;
    let diagnosticoAzucar = 'Fuente estándar de lactosa disacárida nativa.';
    const rGlu = Math.max(0.0, Math.min(1.0, Number(ratioGlucosa !== undefined ? ratioGlucosa : 0.5)));

    if (azucarNorm === 'mezcla_sacarosa_glucosa' || azucarNorm === 'mezcla') {
      const rSac = 1.0 - rGlu;
      // Fracción de glucosa directamente disponible para glucólisis homoláctica (sin retardo hidrolítico)
      // Fracción de sacarosa requiere hidrólisis enzimática invertasa previa
      modAzucar = Number((1.08 - 0.16 * rGlu).toFixed(4));
      factorVmax = Number((0.97 + 0.13 * rGlu).toFixed(4));
      diagnosticoAzucar = `Mezcla carbohidratos [${(rGlu * 100).toFixed(0)}% Glucosa / ${(rSac * 100).toFixed(0)}% Sacarosa]: Hexosas libres aceleran el arranque glucolítico homoláctico y elevan Vmax.`;
    } else if (azucarNorm === 'glucosa') {
      modAzucar = 0.95;
      factorVmax = 1.08;
      diagnosticoAzucar = 'Glucosa libre 100%: Asimilación homoláctica directa sin retardo hidrolítico disacárido.';
    } else if (azucarNorm === 'sacarosa') {
      modAzucar = 1.02;
      factorVmax = 0.98;
      diagnosticoAzucar = 'Sacarosa pura: Requiere hidrólisis invertasa previa, prolongando ligeramente la fase de latencia.';
    }

    // 4. Modelo cinético de tiempo de corte (horas) interpolado
    let tiempoBaseHoras = 4.25;
    if (pct <= 3.0) {
      tiempoBaseHoras = 6.75;
    } else if (pct < 7.0) {
      const alpha = (pct - 2.5) / (7.5 - 2.5);
      tiempoBaseHoras = 6.75 - alpha * (6.75 - 4.25);
    } else {
      tiempoBaseHoras = 4.25;
    }

    tiempoBaseHoras *= modAzucar;

    // Penalización térmica experimental (Arrhenius empírico del Dr. Santacruz):
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

    let tiempoCorteFinalHoras = Number((tiempoBaseHoras * factorTermico).toFixed(2));
    let tiempoCorteMinutos = Math.round(tiempoCorteFinalHoras * 60);

    if (efectoBuffer) {
      // Impide decaer a corte 4.50
      tiempoCorteFinalHoras = null;
      tiempoCorteMinutos = null;
    }

    const {
      viscosidadEstimada,
      diagnosticoReologico,
    } = simulationService.estimarViscosidadBrookfieldFinal({
      tipoSustrato,
      temperaturaC: temp,
      porcentajeInoculo: pct,
    });

    // 6. Curva de puntos cinéticos proyectados (cada 30 min)
    const puntos = [];
    const deltaMin = 30;
    const tRefMin = tiempoCorteMinutos || 420;
    const totalPuntos = Math.max(Math.ceil(tRefMin / deltaMin) + 2, 14); // hasta 7-8 horas

    for (let i = 0; i <= totalPuntos; i++) {
      const min = i * deltaMin;
      let phCurva;
      let brixCurva;
      let estadoPunto;

      if (efectoBuffer) {
        // Amortiguación química en bebida de almendra (Nature's Heart):
        // Estabiliza una meseta entre pH 5.0 y 5.3 tras 6-7 horas (360-420 min)
        const t50Buffer = 180 * modAzucar;
        const gammaBuffer = 2.2 * factorVmax;
        const denom = 1 + Math.pow(min / Math.max(t50Buffer, 1), gammaBuffer);
        let phRaw = phFinal + (phInicial - phFinal) / denom;

        if (min >= 360) {
          phRaw = Math.max(5.0, Math.min(5.3, phRaw));
        }
        phCurva = Number(phRaw.toFixed(2));

        const brixDenom = 1 + Math.pow(min / (t50Buffer * 1.2), gammaBuffer * 0.8);
        brixCurva = Number((brixFinalEsperado + (brixInicial - brixFinalEsperado) / brixDenom).toFixed(1));

        estadoPunto = min >= 360 ? 'Meseta Buffer Estabilizada' : 'En Fermentación Amortiguada';
      } else {
        const fraccion = Math.min(min / tRefMin, 1.0);
        phCurva = Number(
          (phInicial - (phInicial - PH_CORTE) * Math.pow(fraccion, 1.8 * factorVmax)).toFixed(2)
        );
        brixCurva = Number(
          (brixInicial - (brixInicial - 5.5) * Math.pow(fraccion, 2.0)).toFixed(1)
        );
        estadoPunto = min >= tRefMin ? 'Corte Alcanzado' : 'En Fermentación';
      }

      puntos.push({
        minutos: min,
        horas: (min / 60).toFixed(1),
        ph: phCurva,
        temperatura: temp,
        brix: brixCurva,
        estado: estadoPunto,
      });

      if (min >= tRefMin + 60 && !efectoBuffer) break;
      if (min >= 480 && efectoBuffer) break; // 8 horas para almendra
    }

    const fueraDeRangoTermico = temp < 41.0 || temp > 43.0;

    return {
      tipoSustrato,
      tipoAzucar,
      ratioGlucosa: rGlu,
      masaInoculoG: masa,
      masaSolucionG: sol,
      porcentajeInoculo: Number(pct.toFixed(2)),
      temperaturaC: temp,
      volumenMl: sol,
      phInicial,
      phCorte: PH_CORTE,
      phFinalEsperado: phFinal,
      efectoBuffer,
      tiempoEstimadoHoras: tiempoCorteFinalHoras,
      tiempoEstimadoCorteMinutos: tiempoCorteMinutos,
      viscosidadEstimadaMpaS: viscosidadEstimada,
      diagnosticoReologico,
      diagnosticoAzucar,
      alertaBuffer: efectoBuffer
        ? "⚠️ EFECTO BUFFER ACTIVO (Nature's Heart): Las sales de calcio impiden alcanzar el corte de pH 4.50. Se estabiliza una meseta entre pH 5.0 y 5.3 tras 6-7 horas."
        : null,
      reglaMedicionViscosidad: 'La viscosidad se mide al final (pH 4.50) con rotor 4 a 60 rpm.',
      brixInicial,
      brixFinalEsperado,
      fueraDeRangoTermico,
      alertaTermica: fueraDeRangoTermico
        ? `⚠️ Alerta: Temperatura (${temp} °C) fuera del rango óptimo (41.0 °C – 43.0 °C). Modifica la acidificación.`
        : null,
      puntos,
    };
  },
};

export default simulationService;
