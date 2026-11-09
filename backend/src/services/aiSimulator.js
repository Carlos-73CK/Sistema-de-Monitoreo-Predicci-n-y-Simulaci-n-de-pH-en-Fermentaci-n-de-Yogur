/**
 * Servicio de Simulación y Modelado Bioestadístico de Hill — PrediYogur
 * Cátedra de Química de Alimentos y Modelado Matemático (ULEAM)
 * Especialista Bioestadístico: Jordan Meza
 * Patrocinador Científico: Dr. Stalin Gustavo Santacruz Terán
 * 
 * Implementa las ecuaciones biofísicas y cinéticas del modelo sigmoidal de Hill:
 * 1. Dinámica de inóculo porcentual y masa efectiva:
 *    masaInoculoG = (porcentajeInoculo / 100) * masaSolucionG
 * 2. Cinética diferencial de carbohidratos y mezclas ('mezcla_sacarosa_glucosa'):
 *    - Glucosa: Monosacárido libremente disponible para glucólisis homoláctica directa (sin retardo hidrolítico).
 *    - Sacarosa: Disacárido dependiente de hidrólisis enzimática previa por invertasa (beta-fructofuranosidasa).
 *    - Ponderación de Vmax y reducción de fase de latencia según ratio de glucosa.
 * 3. Efecto buffer por carbonato de calcio / fosfato tricálcico en bebida de almendra (Nature's Heart):
 *    - Amortiguación de protones libres [H+], impidiendo el decaimiento a pH 4.50
 *    - Estabilización en meseta entre pH 5.0 y 5.3 tras 6-7 horas de incubación.
 * 4. Superficie de respuesta bioestadística para viscosidad final Brookfield (rotor 4, 60 rpm):
 *    - Vaca a 42 °C / 7.5% -> ~2639 mPa·s (Óptimo ULEAM).
 *    - Vaca a 40 °C / 2.5% -> ~2579 mPa·s (Acidificación lenta e hidratación proteica).
 *    - Vaca a 44 °C -> ~796 - 1185 mPa·s (Desnaturalización y estrés térmico).
 *    - Avena y Almendra -> ~50 - 300 mPa·s (Geles débiles / fluidos viscosos sin matriz de caseína).
 */

const PH_CRITICO_CORTE = 4.50;

/**
 * Matriz cinético-experimental de referencia del Dr. Stalin Santacruz (2x3)
 */
const CALIBRATED_KINETIC_GRID = [
  { temp: 40, inoc: 2.5, t50: 130, gamma: 2.8, tCorteH: 5.83, viscosidad: 2579, brixFinal: 5.9 },
  { temp: 40, inoc: 7.5, t50: 75,  gamma: 1.9, tCorteH: 5.50, viscosidad: 786.6, brixFinal: 5.5 },
  { temp: 42, inoc: 2.5, t50: 300, gamma: 3.9, tCorteH: 6.75, viscosidad: 1454, brixFinal: 5.1 },
  { temp: 42, inoc: 7.5, t50: 125, gamma: 3.0, tCorteH: 4.25, viscosidad: 2639, brixFinal: 5.7, optimo: true },
  { temp: 44, inoc: 2.5, t50: 230, gamma: 3.5, tCorteH: 6.50, viscosidad: 1185, brixFinal: 6.1 },
  { temp: 44, inoc: 7.5, t50: 170, gamma: 2.6, tCorteH: 6.50, viscosidad: 796.5, brixFinal: 7.4 },
];

/**
 * 1. INÓCULO PORCENTUAL Y MASA DINÁMICA
 * El modelo matemático acepta `porcentajeInoculo` como parámetro principal y calcula dinámicamente
 * los gramos de inóculo respecto a la masa total: masaInoculoG = (porcentajeInoculo / 100) * masaSolucionG.
 * Si se ingresa masaInoculoG, calcula el porcentaje correspondientemente.
 */
function resolverParametrosInoculo({ porcentajeInoculo, masaInoculoG, masaSolucionG, volumenMl }) {
  const masaSolucion = Number(masaSolucionG !== undefined ? masaSolucionG : (volumenMl !== undefined ? volumenMl : 250)) || 250;

  let pct;
  let masa;

  if (porcentajeInoculo !== undefined && porcentajeInoculo !== null && porcentajeInoculo !== '') {
    pct = Number(porcentajeInoculo);
    masa = Number(((pct / 100) * masaSolucion).toFixed(2));
  } else if (masaInoculoG !== undefined && masaInoculoG !== null && masaInoculoG !== '') {
    masa = Number(masaInoculoG);
    pct = Number(((masa / masaSolucion) * 100).toFixed(2));
  } else {
    // Parámetros basales óptimos del laboratorio ULEAM (7.5% inóculo Chivería)
    pct = 7.5;
    masa = Number(((pct / 100) * masaSolucion).toFixed(2));
  }

  return {
    porcentajeInoculo: Number(pct.toFixed(2)),
    masaInoculoG: Number(masa.toFixed(2)),
    masaSolucionG: Number(masaSolucion.toFixed(1)),
    volumenMl: Number(masaSolucion.toFixed(1)),
  };
}

/**
 * Interpola los hiperparámetros cinéticos en la superficie (T, %Inóculo) mediante IDW
 */
function interpolarParametrosCineticos(temperaturaC, porcentajeInoculo) {
  const temp = Math.max(35, Math.min(48, Number(temperaturaC) || 42));
  const inoc = Math.max(1.0, Math.min(15.0, Number(porcentajeInoculo) || 7.5));

  let sumW = 0;
  let sumT50 = 0;
  let sumGamma = 0;
  let sumTCorte = 0;
  let sumViscosidad = 0;

  for (const node of CALIBRATED_KINETIC_GRID) {
    const distSq = Math.pow((temp - node.temp) / 2.0, 2) + Math.pow((inoc - node.inoc) / 5.0, 2);

    if (distSq < 0.0001) {
      return {
        t50: node.t50,
        gamma: node.gamma,
        tiempoCorteHoras: node.tCorteH,
        viscosidadMpaS: node.viscosidad,
      };
    }

    const w = 1 / Math.pow(distSq, 1.5);
    sumW += w;
    sumT50 += w * node.t50;
    sumGamma += w * node.gamma;
    sumTCorte += w * node.tCorteH;
    sumViscosidad += w * node.viscosidad;
  }

  return {
    t50: Number((sumT50 / sumW).toFixed(1)),
    gamma: Number((sumGamma / sumW).toFixed(2)),
    tiempoCorteHoras: Number((sumTCorte / sumW).toFixed(2)),
    viscosidadMpaS: Number((sumViscosidad / sumW).toFixed(1)),
  };
}

/**
 * 2. MODELADO DE AZÚCARES Y MEZCLAS ('mezcla_sacarosa_glucosa')
 * Pondera la velocidad máxima de acidificación (Vmax) y la fase de latencia en función del ratio de glucosa.
 * - Glucosa: Monosacárido libremente disponible para glucólisis homoláctica sin demora hidrolítica previa.
 * - Sacarosa: Requiere hidrólisis enzimática invertasa previa.
 */
function modelarCineticaCarbohidrato({ tipoAzucar = 'lactosa', ratioGlucosa = 0.5 }) {
  const norm = String(tipoAzucar).trim().toLowerCase();

  if (norm === 'mezcla_sacarosa_glucosa' || norm === 'mezcla') {
    const rGlu = Math.max(0.0, Math.min(1.0, Number(ratioGlucosa !== undefined ? ratioGlucosa : 0.5)));
    const rSac = 1.0 - rGlu;

    // Latencia inversa al ratio de glucosa:
    // más glucosa => arranque glucolítico inmediato; más sacarosa => mayor retraso por hidrólisis invertasa.
    const factorLatencia = Number((1.08 - 0.16 * rGlu).toFixed(4));
    // Vmax ponderada por disponibilidad de glucosa libre para glucólisis homoláctica.
    const factorVmax = Number((0.97 + 0.13 * rGlu).toFixed(4));
    const factorT50 = factorLatencia;
    const factorTiempoCorte = factorLatencia;

    return {
      tipoAzucar: 'mezcla_sacarosa_glucosa',
      ratioGlucosa: rGlu,
      ratioSacarosa: rSac,
      factorT50,
      factorVmax,
      factorTiempoCorte,
      bioquimica: {
        fraccionGlucosa: `${(rGlu * 100).toFixed(0)}% (Glucólisis homoláctica directa sin retardo hidrolítico)`,
        fraccionSacarosa: `${(rSac * 100).toFixed(0)}% (Hidrólisis previa requerida por invertasa beta-fructofuranosidasa)`,
        mecanismo: 'Fermentación bimodal ponderada: disponibilidad de hexosas libres reduce la latencia enzimática y eleva Vmax.',
      },
    };
  }

  if (norm === 'glucosa') {
    return {
      tipoAzucar: 'glucosa',
      ratioGlucosa: 1.0,
      ratioSacarosa: 0.0,
      factorT50: 0.95,
      factorVmax: 1.08,
      factorTiempoCorte: 0.95,
      bioquimica: {
        fraccionGlucosa: '100% libre',
        fraccionSacarosa: '0%',
        mecanismo: 'Glucólisis homoláctica directa e inmediata. No requiere inducción de invertasa ni beta-galactosidasa.',
      },
    };
  }

  if (norm === 'sacarosa') {
    return {
      tipoAzucar: 'sacarosa',
      ratioGlucosa: 0.0,
      ratioSacarosa: 1.0,
      factorT50: 1.02,
      factorVmax: 0.98,
      factorTiempoCorte: 1.02,
      bioquimica: {
        fraccionGlucosa: '0%',
        fraccionSacarosa: '100%',
        mecanismo: 'Requiere hidrólisis disacárida previa por enzima invertasa, extendiendo ligeramente el lag cinético.',
      },
    };
  }

  // Por defecto: lactosa (sustrato disacárido lácteo nativo)
  return {
    tipoAzucar: 'lactosa',
    ratioGlucosa: 0.0,
    ratioSacarosa: 0.0,
    factorT50: 1.0,
    factorVmax: 1.0,
    factorTiempoCorte: 1.0,
    bioquimica: {
      fraccionGlucosa: '0%',
      fraccionSacarosa: '0%',
      mecanismo: 'Disacárido lácteo nativo escindido por beta-galactosidasa en glucosa y galactosa.',
    },
  };
}

/**
 * 3. MODELADO DEL EFECTO BUFFER EN BEBIDA DE ALMENDRA (Nature's Heart)
 * Incorpora la amortiguación por carbonato de calcio / fosfato tricálcico.
 * El pH libre [H+] es amortiguado impidiendo alcanzar el pH de corte 4.50
 * y estabilizando una meseta entre pH 5.0 y 5.3 tras 6-7 horas de incubación.
 */
function getParametrosMatriz(tipoSustrato = 'vaca') {
  const norm = String(tipoSustrato).toLowerCase();

  if (norm.includes('almendra')) {
    return {
      tipoSustrato: 'almendra',
      phInicial: 6.55,
      phFinal: 5.15, // Meseta amortiguada entre pH 5.0 y 5.3 tras 6-7h
      phBufferMesetaMin: 5.0,
      phBufferMesetaMax: 5.3,
      efectoBuffer: true,
      aditivosAmortiguadores: 'Carbonato de Calcio (CaCO3) y Fosfato Tricálcico (Ca3(PO4)2)',
      marcaReferencia: "Nature's Heart",
      brixInicial: 5.2,
      brixFinal: 4.6,
      t50BufferMinutos: 180,
      gammaBuffer: 2.2,
      alcanzaCorte450: false,
    };
  }

  if (norm.includes('avena')) {
    return {
      tipoSustrato: 'avena',
      phInicial: 6.40,
      phFinal: 4.50,
      efectoBuffer: false,
      brixInicial: 9.8,
      brixFinal: 5.4,
      alcanzaCorte450: true,
    };
  }

  if (norm.includes('chocho')) {
    return {
      tipoSustrato: 'chocho',
      phInicial: 6.45,
      phFinal: 4.50,
      efectoBuffer: false,
      brixInicial: 9.2,
      brixFinal: 5.8,
      alcanzaCorte450: true,
    };
  }

  if (norm.includes('coco')) {
    return {
      tipoSustrato: 'coco',
      phInicial: 6.35,
      phFinal: 4.50,
      efectoBuffer: false,
      brixInicial: 8.8,
      brixFinal: 5.5,
      alcanzaCorte450: true,
    };
  }

  // Leche entera de vaca (calibración experimental ULEAM)
  return {
    tipoSustrato: 'vaca',
    phInicial: 6.25,
    phFinal: 4.50,
    efectoBuffer: false,
    brixInicial: 10.5,
    brixFinal: 5.6,
    alcanzaCorte450: true,
  };
}

/**
 * 4. PREDICCIÓN DE VISCOSIDAD BROOKFIELD FINAL (rotor 4, 60 rpm)
 * Función bioestadística para estimar la viscosidad Brookfield:
 * - Vaca a 42 °C / 7.5% -> ~2639 mPa·s
 * - Vaca a 40 °C / 2.5% -> ~2579 mPa·s
 * - Vaca a 44 °C (desnaturalización térmica) -> ~796 - 1185 mPa·s
 * - Avena y Almendra -> geles débiles / fluidos viscosos (~50 - 300 mPa·s)
 */
function estimarViscosidadBrookfield({
  tipoSustrato = 'vaca',
  temperaturaC = 42,
  porcentajeInoculo,
  masaInoculoG,
  masaSolucionG = 250,
  volumenMl = 250,
}) {
  const resInoc = resolverParametrosInoculo({
    porcentajeInoculo,
    masaInoculoG,
    masaSolucionG,
    volumenMl,
  });

  const temp = Number(temperaturaC) || 42;
  const inocPct = resInoc.porcentajeInoculo;
  const sustrato = String(tipoSustrato).toLowerCase();

  // Caso: Matrices vegetales sin caseína micelar (Almendra y Avena)
  if (sustrato.includes('almendra')) {
    // Almendra: carece de micelas de caseína; forma una suspensión coloidal diluida de baja viscosidad
    const viscoAlmendra = Math.round(95 + 15 * Math.sin(temp * 0.1) + (inocPct - 2.5) * 4);
    const viscoFinal = Math.max(50, Math.min(300, viscoAlmendra));
    return {
      viscosidadPredichaMpaS: viscoFinal,
      viscosidad_mpas: viscoFinal,
      unidad: 'mPa·s',
      condicionesMedicion: 'rotor 4, 60 rpm',
      calidadGel: 'FLUIDO VISCOSO / GEL MUY DÉBIL',
      diagnostico: 'Bebida de almendra: No forma gel de coagulación por ausencia de micelas de caseína bovina. Comportamiento de fluido viscoso (~50 - 300 mPa·s).',
      esMatrizVegetal: true,
    };
  }

  if (sustrato.includes('avena')) {
    // Avena: contiene beta-glucanos y almidones solubles que aportan viscosidad fluida moderada
    const viscoAvena = Math.round(180 + (temp <= 42 ? 25 : -20) + (inocPct >= 5 ? 20 : 0));
    const viscoFinal = Math.max(50, Math.min(300, viscoAvena));
    return {
      viscosidadPredichaMpaS: viscoFinal,
      viscosidad_mpas: viscoFinal,
      unidad: 'mPa·s',
      condicionesMedicion: 'rotor 4, 60 rpm',
      calidadGel: 'GEL DÉBIL / FLUIDO VISCOSO',
      diagnostico: 'Bebida de avena: Coagulación proteica incipiente mediada por beta-glucanos solubles (~50 - 300 mPa·s), sin red tridimensional de caseína.',
      esMatrizVegetal: true,
    };
  }

  if (sustrato.includes('chocho') || sustrato.includes('coco')) {
    const viscoVeg = Math.round(260 + (inocPct >= 5 ? 40 : -20));
    return {
      viscosidadPredichaMpaS: viscoVeg,
      viscosidad_mpas: viscoVeg,
      unidad: 'mPa·s',
      condicionesMedicion: 'rotor 4, 60 rpm',
      calidadGel: 'GEL VEGETAL DÉBIL',
      diagnostico: `Matriz vegetal de ${sustrato}: Estructura coloidal suave (~${viscoVeg} mPa·s).`,
      esMatrizVegetal: true,
    };
  }

  // Matriz Láctea Bovina (Leche de vaca con inóculo Chivería)
  // Evaluamos superficie calibrada ULEAM con IDW
  const { viscosidadMpaS } = interpolarParametrosCineticos(temp, inocPct);

  let calidadGel = 'ÓPTIMA';
  let diagnostico = 'Consistencia adecuada para yogur batido tradicional comercial.';

  if (temp >= 41.5 && temp <= 42.5 && inocPct >= 6.0) {
    calidadGel = 'EXCELENTE (MÁXIMA FIRMEZA)';
    diagnostico = '⭐ Condición Óptima ULEAM (42 °C / 7.5%): Red de paracaseinato cálcico homogénea y tridimensional (~2639 mPa·s).';
  } else if (temp <= 40.5 && inocPct <= 3.5) {
    calidadGel = 'MUY BUENA (GEL FIRME)';
    diagnostico = 'Gel lácteo firme (~2579 mPa·s): Acidificación lenta y homogénea que favorece la hidratación proteica sin sinéresis.';
  } else if (temp >= 43.5) {
    calidadGel = 'DEFICIENTE (ESTRÉS TÉRMICO Y DESNATURALIZACIÓN)';
    diagnostico = `⚠️ Descenso pronunciado de viscosidad (~${viscosidadMpaS} mPa·s [796 - 1185 mPa·s]): El exceso térmico desnaturaliza enzimas y contrae micelas de caseína.`;
  } else if (temp <= 40.5 && inocPct >= 6.0) {
    calidadGel = 'BAJA (RIESGO DE SINÉRESIS)';
    diagnostico = '⚠️ Red de gel frágil (~786.6 mPa·s): A 40 °C con alto inóculo la rápida bajada de pH precipita caseína antes de su reorganización coloidal.';
  } else {
    calidadGel = 'ESTÁNDAR';
    diagnostico = `Gel de firmeza intermedia (~${viscosidadMpaS} mPa·s).`;
  }

  return {
    viscosidadPredichaMpaS: viscosidadMpaS,
    viscosidad_mpas: viscosidadMpaS,
    unidad: 'mPa·s',
    condicionesMedicion: 'rotor 4, 60 rpm',
    calidadGel,
    diagnostico,
    esMatrizVegetal: false,
    reglaMedicion: 'La viscosidad se mide estrictamente al final del ensayo (pH 4.50) con viscosímetro rotacional Brookfield (rotor 4, 60 rpm).',
  };
}

/**
 * Predice un punto cinético individual en cualquier tiempo t (minutos)
 * Aplica la ecuación sigmoidal de Hill con moduladores bioquímicos y buffer
 */
function predecirPunto({
  temperaturaC = 42,
  porcentajeInoculo,
  masaInoculoG,
  masaSolucionG = 250,
  volumenMl = 250,
  minutos = 0,
  tipoSustrato = 'vaca',
  tipoAzucar = 'lactosa',
  ratioGlucosa = 0.5,
}) {
  const tMin = Math.max(0, Number(minutos) || 0);
  const resInoc = resolverParametrosInoculo({
    porcentajeInoculo,
    masaInoculoG,
    masaSolucionG,
    volumenMl,
  });

  const cinAzucar = modelarCineticaCarbohidrato({ tipoAzucar, ratioGlucosa });
  const matriz = getParametrosMatriz(tipoSustrato);

  // Parámetros cinéticos basales interpolados
  const { t50: t50Base, gamma: gammaBase, tiempoCorteHoras } = interpolarParametrosCineticos(
    temperaturaC,
    resInoc.porcentajeInoculo
  );

  let phPredicho;
  let brixPredicho;
  let corteAlcanzado = false;

  if (matriz.efectoBuffer) {
    // 3. EFECTO BUFFER EN BEBIDA DE ALMENDRA (Nature's Heart):
    // Ecuación de amortiguación química por CaCO3 y Ca3(PO4)2:
    // [H+] libre es capturado impidiendo decaer al corte 4.50.
    // Estabiliza una meseta entre 5.0 y 5.3 tras 6-7 horas (360-420 min).
    const t50Buffer = matriz.t50BufferMinutos * cinAzucar.factorT50;
    const gammaBuffer = matriz.gammaBuffer * cinAzucar.factorVmax;

    // Ecuación Hill amortiguada con asíntota en la meseta química (5.15)
    const denominadorBuffer = 1 + Math.pow(tMin / Math.max(t50Buffer, 1), gammaBuffer);
    phPredicho = matriz.phFinal + (matriz.phInicial - matriz.phFinal) / denominadorBuffer;

    // A partir de 6 horas (360 min) el buffer impone meseta estricta en el rango [5.0, 5.3]
    if (tMin >= 360) {
      phPredicho = Math.max(matriz.phBufferMesetaMin, Math.min(matriz.phBufferMesetaMax, phPredicho));
    }

    // El pH nunca alcanza el corte 4.50
    corteAlcanzado = false;

    // Curva de sólidos solubles (°Brix) amortiguada
    const brixDenom = 1 + Math.pow(tMin / (t50Buffer * 1.2), gammaBuffer * 0.8);
    brixPredicho = matriz.brixFinal + (matriz.brixInicial - matriz.brixFinal) / brixDenom;
  } else {
    // Matriz convencional (Vaca, Avena, Chocho, Coco)
    const t50Ajustado = t50Base * cinAzucar.factorT50;
    const gammaAjustado = gammaBase * cinAzucar.factorVmax;

    // Ecuación sigmoidal estándar de Hill:
    // pH(t) = phFinal + (phInicial - phFinal) / (1 + (t / t50)^gamma)
    const denominador = 1 + Math.pow(tMin / Math.max(t50Ajustado, 1), gammaAjustado);
    phPredicho = matriz.phFinal + (matriz.phInicial - matriz.phFinal) / denominador;

    const brixDenominador = 1 + Math.pow(tMin / Math.max(t50Ajustado * 1.1, 1), gammaAjustado * 0.85);
    brixPredicho = matriz.brixFinal + (matriz.brixInicial - matriz.brixFinal) / brixDenominador;

    const tCorteMinutos = Math.round(tiempoCorteHoras * cinAzucar.factorTiempoCorte * 60);
    corteAlcanzado = phPredicho <= PH_CRITICO_CORTE || tMin >= tCorteMinutos;
  }

  return {
    minutos: tMin,
    horas: Number((tMin / 60).toFixed(2)),
    phPredicho: Number(phPredicho.toFixed(2)),
    indiceRefraccionPredicho: Number(brixPredicho.toFixed(1)),
    corteAlcanzado,
    temperaturaC: Number(temperaturaC) || 42,
    porcentajeInoculo: resInoc.porcentajeInoculo,
    masaInoculoG: resInoc.masaInoculoG,
    volumenMl: resInoc.volumenMl,
    tipoSustrato: matriz.tipoSustrato,
    tipoAzucar: cinAzucar.tipoAzucar,
    efectoBuffer: matriz.efectoBuffer || false,
  };
}

/**
 * Predice el tiempo de corte estimado a pH 4.50
 */
function predecirTiempoCorte({
  temperaturaC = 42,
  porcentajeInoculo,
  masaInoculoG,
  masaSolucionG = 250,
  volumenMl = 250,
  tipoSustrato = 'vaca',
  tipoAzucar = 'lactosa',
  ratioGlucosa = 0.5,
}) {
  const temp = Number(temperaturaC) || 42;
  const resInoc = resolverParametrosInoculo({
    porcentajeInoculo,
    masaInoculoG,
    masaSolucionG,
    volumenMl,
  });

  const matriz = getParametrosMatriz(tipoSustrato);
  const cinAzucar = modelarCineticaCarbohidrato({ tipoAzucar, ratioGlucosa });

  if (matriz.efectoBuffer) {
    return {
      tiempoCorteHoras: null,
      tiempoCorteMinutos: null,
      corteAlcanzable: false,
      temperaturaC: temp,
      porcentajeInoculo: resInoc.porcentajeInoculo,
      masaInoculoG: resInoc.masaInoculoG,
      tipoSustrato: matriz.tipoSustrato,
      tipoAzucar: cinAzucar.tipoAzucar,
      efectoBuffer: true,
      diagnosticoCinético: "⚠️ EFECTO BUFFER ACTIVO (Nature's Heart): Las sales inorgánicas (CaCO3 / fosfato tricálcico) amortiguan el medio. El pH no decae a 4.50 y estabiliza una meseta entre pH 5.0 y 5.3 tras 6-7 horas.",
      alertaBuffer: "No se alcanzará el punto de corte tradicional de pH 4.50 debido a la amortiguación química del carbonato de calcio.",
    };
  }

  const { tiempoCorteHoras } = interpolarParametrosCineticos(temp, resInoc.porcentajeInoculo);
  const tiempoCorteAjustado = Number((tiempoCorteHoras * cinAzucar.factorTiempoCorte).toFixed(2));
  const tiempoMinutos = Math.round(tiempoCorteAjustado * 60);
  const fueraDeRangoOptimo = temp < 41.0 || temp > 43.0;

  return {
    tiempoCorteHoras: tiempoCorteAjustado,
    tiempoCorteMinutos: tiempoMinutos,
    corteAlcanzable: true,
    temperaturaC: temp,
    porcentajeInoculo: resInoc.porcentajeInoculo,
    masaInoculoG: resInoc.masaInoculoG,
    volumenMl: resInoc.volumenMl,
    fueraDeRangoOptimo,
    alertaTermica: fueraDeRangoOptimo
      ? `⚠️ ALERTA ACÚSTICA/VISUAL: Temperatura (${temp} °C) fuera del rango óptimo (41.0 °C – 43.0 °C). Modifica la acidificación bacteriana.`
      : null,
    diagnosticoCinético: `Corte crítico pH 4.50 proyectado a las ${tiempoCorteAjustado} h (${tiempoMinutos} min).`,
    bioquimicaCarbohidrato: cinAzucar.bioquimica,
  };
}

/**
 * Genera la trayectoria completa de simulación (What-If)
 */
function simularAcidificacion({
  tipoSustrato = 'vaca',
  tipoAzucar = 'lactosa',
  ratioGlucosa = 0.5,
  porcentajeInoculo,
  masaInoculoG,
  masaSolucionG = 250,
  temperaturaC = 42,
  volumenMl = 250,
  intervaloMinutos = 15,
}) {
  const resInoc = resolverParametrosInoculo({
    porcentajeInoculo,
    masaInoculoG,
    masaSolucionG,
    volumenMl,
  });

  const matriz = getParametrosMatriz(tipoSustrato);
  const corte = predecirTiempoCorte({
    temperaturaC,
    porcentajeInoculo: resInoc.porcentajeInoculo,
    masaInoculoG: resInoc.masaInoculoG,
    masaSolucionG: resInoc.masaSolucionG,
    tipoSustrato,
    tipoAzucar,
    ratioGlucosa,
  });

  const reologia = estimarViscosidadBrookfield({
    tipoSustrato,
    temperaturaC,
    porcentajeInoculo: resInoc.porcentajeInoculo,
    masaInoculoG: resInoc.masaInoculoG,
    masaSolucionG: resInoc.masaSolucionG,
  });

  const tCorteMin = corte.tiempoCorteMinutos || 420;
  const tMaxMin = Math.max(tCorteMin + 30, 480); // mínimo 8 horas de proyección

  const puntos = [];
  const curvaCineticapH = [];

  for (let m = 0; m <= tMaxMin; m += intervaloMinutos) {
    const pt = predecirPunto({
      temperaturaC,
      porcentajeInoculo: resInoc.porcentajeInoculo,
      masaInoculoG: resInoc.masaInoculoG,
      masaSolucionG: resInoc.masaSolucionG,
      minutos: m,
      tipoSustrato,
      tipoAzucar,
      ratioGlucosa,
    });

    const estadoPunto = matriz.efectoBuffer
      ? (m >= 360 ? 'Meseta Buffer Estabilizada' : 'En Fermentación Amortiguada')
      : (m >= tCorteMin ? 'Corte Alcanzado' : 'En Fermentación');

    puntos.push({
      minutos: m,
      horas: (m / 60).toFixed(1),
      ph: pt.phPredicho,
      temperatura: Number(temperaturaC) || 42,
      brix: pt.indiceRefraccionPredicho,
      estado: estadoPunto,
    });

    curvaCineticapH.push(pt);
  }

  // Curva de Referencia Óptima ULEAM (42 °C / 7.5% / Vaca / Lactosa) para superposición gráfica
  const curvaReferenciaOptima = [];
  for (let m = 0; m <= tMaxMin; m += intervaloMinutos) {
    curvaReferenciaOptima.push(predecirPunto({
      temperaturaC: 42.0,
      porcentajeInoculo: 7.5,
      masaInoculoG: 18.75,
      masaSolucionG: 250,
      minutos: m,
      tipoSustrato: 'vaca',
      tipoAzucar: 'lactosa',
    }));
  }

  const fueraDeRangoTermico = Number(temperaturaC) < 41.0 || Number(temperaturaC) > 43.0;

  return {
    tipoSustrato: matriz.tipoSustrato,
    tipoAzucar,
    ratioGlucosa: Number(ratioGlucosa) || 0.5,
    porcentajeInoculo: resInoc.porcentajeInoculo,
    masaInoculoG: resInoc.masaInoculoG,
    masaSolucionG: resInoc.masaSolucionG,
    volumenMl: resInoc.volumenMl,
    temperaturaC: Number(temperaturaC) || 42,
    phInicial: matriz.phInicial,
    phCorte: PH_CRITICO_CORTE,
    phFinalEsperado: matriz.phFinal,
    efectoBuffer: matriz.efectoBuffer || false,
    tiempoEstimadoHoras: corte.tiempoCorteHoras,
    tiempoEstimadoCorteMinutos: corte.tiempoCorteMinutos,
    prediccionCorte: corte,
    viscosidadEstimadaMpaS: reologia.viscosidadPredichaMpaS,
    viscosidad_mpas: reologia.viscosidadPredichaMpaS,
    diagnosticoReologico: reologia.diagnostico,
    reologia,
    brixInicial: matriz.brixInicial,
    brixFinalEsperado: matriz.brixFinal,
    fueraDeRangoTermico,
    alertaTermica: fueraDeRangoTermico
      ? `⚠️ Alerta: Temperatura (${temperaturaC} °C) fuera del rango óptimo (41.0 °C – 43.0 °C). Modifica la tasa de acidificación.`
      : null,
    puntos,
    curva: curvaCineticapH,
    curvaCineticapH,
    curvaReferenciaOptima,
    total_puntos: curvaCineticapH.length,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  PH_CRITICO_CORTE,
  CALIBRATED_KINETIC_GRID,
  resolverParametrosInoculo,
  interpolarParametrosCineticos,
  modelarCineticaCarbohidrato,
  getParametrosMatriz,
  estimarViscosidadBrookfield,
  predecirViscosidad: estimarViscosidadBrookfield,
  predecirPunto,
  predecirTiempoCorte,
  simularAcidificacion,
  generarTrayectoria: simularAcidificacion,
  simularTrayectoriaCompleta: simularAcidificacion,
};