/**
 * Validador Fisicoquímico y de Seguridad para Fermentación de Yogur — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 * Patrocinador Científico: Dr. Stalin Gustavo Santacruz Terán
 * 
 * Previene el envenenamiento de datos (Data Poisoning) y fallos numéricos en el modelo
 * de Inteligencia Artificial asegurando que las variables ingresadas respeten los rangos
 * bioquímicos y físicos de la fermentación láctica de leche de vaca con inóculo Chivería.
 */

// Límites fisicoquímicos calibrados con datos de laboratorio ULEAM
const LIMITES = {
  PH: { MIN: 3.8, MAX: 7.2, DEFAULT_CORTE: 4.50 },
  TEMPERATURA_C: { MIN: 20.0, MAX: 52.0, OPTIMA_MIN: 41.0, OPTIMA_MAX: 43.0 },
  INOCULO_PCT: { MIN: 0.5, MAX: 15.0, REFERENCIA_BAJA: 2.5, REFERENCIA_ALTA: 7.5 },
  VOLUMEN_ML: { MIN: 50.0, MAX: 5000.0, ESTANDAR: 250.0 },
  MASA_INOCULO_G: { MIN: 0.5, MAX: 500.0, ESTANDAR: 18.75 },
  TIEMPO_MINUTOS: { MIN: 0, MAX: 720 }, // Hasta 12 horas máximo de monitoreo
  VISCOSIDAD_MPAS: { MIN: 150.0, MAX: 5500.0 },
  INDICE_REFRACCION_BRIX: { MIN: 3.0, MAX: 18.0 },
};

/**
 * Valida una lectura periódica individual de laboratorio
 * @param {Object} lectura
 * @returns {{ esValido: boolean, errores: string[], datosSaneados: Object }}
 */
function validarLecturaFisicoquimica(lectura = {}) {
  const errores = [];

  const tiempoMin = lectura.tiempo_minutos !== undefined ? lectura.tiempo_minutos : lectura.minutos;
  const phRaw = lectura.ph;
  const tempRaw = lectura.temperatura !== undefined ? lectura.temperatura : lectura.temperatura_c;
  const refrRaw = lectura.indice_refraccion !== undefined ? lectura.indice_refraccion : lectura.brix;

  // 1. Tiempo
  const minutos = Number(tiempoMin);
  if (tiempoMin === undefined || Number.isNaN(minutos)) {
    errores.push('El tiempo en minutos es obligatorio y debe ser un número.');
  } else if (minutos < LIMITES.TIEMPO_MINUTOS.MIN || minutos > LIMITES.TIEMPO_MINUTOS.MAX) {
    errores.push(`El tiempo (${minutos} min) debe estar entre ${LIMITES.TIEMPO_MINUTOS.MIN} y ${LIMITES.TIEMPO_MINUTOS.MAX} minutos (máx 12h).`);
  }

  // 2. pH
  const ph = Number(phRaw);
  if (phRaw === undefined || Number.isNaN(ph)) {
    errores.push('El pH es obligatorio y debe ser un valor numérico.');
  } else if (ph < LIMITES.PH.MIN || ph > LIMITES.PH.MAX) {
    errores.push(`El pH (${ph}) está fuera del rango bioquímico para fermentación láctica [${LIMITES.PH.MIN} - ${LIMITES.PH.MAX}].`);
  }

  // 3. Temperatura
  const temp = Number(tempRaw);
  if (tempRaw === undefined || Number.isNaN(temp)) {
    errores.push('La temperatura es obligatoria y debe ser un valor numérico.');
  } else if (temp < LIMITES.TEMPERATURA_C.MIN || temp > LIMITES.TEMPERATURA_C.MAX) {
    errores.push(`La temperatura (${temp} °C) está fuera del rango viable para bacterias lácticas [${LIMITES.TEMPERATURA_C.MIN} - ${LIMITES.TEMPERATURA_C.MAX} °C].`);
  }

  // 4. Índice de Refracción (°Brix) opcional
  let refraccionSaneada = null;
  if (refrRaw !== undefined && refrRaw !== null && refrRaw !== '') {
    const refr = Number(refrRaw);
    if (Number.isNaN(refr)) {
      errores.push('El índice de refracción (°Brix) debe ser un número.');
    } else if (refr < LIMITES.INDICE_REFRACCION_BRIX.MIN || refr > LIMITES.INDICE_REFRACCION_BRIX.MAX) {
      errores.push(`El índice de refracción (${refr} °Brix) debe estar entre ${LIMITES.INDICE_REFRACCION_BRIX.MIN} y ${LIMITES.INDICE_REFRACCION_BRIX.MAX} °Brix.`);
    } else {
      refraccionSaneada = Number(refr.toFixed(2));
    }
  }

  return {
    esValido: errores.length === 0,
    errores,
    datosSaneados: errores.length === 0 ? {
      minutos: Math.round(minutos),
      tiempo_minutos: Math.round(minutos),
      ph: Number(ph.toFixed(2)),
      temperatura: Number(temp.toFixed(1)),
      indice_refraccion: refraccionSaneada,
    } : null,
  };
}

/**
 * Valida los parámetros de entrada para simulaciones cinéticas ("What-If")
 * @param {Object} params
 * @returns {{ esValido: boolean, errores: string[], advertencias: string[], parametrosSaneados: Object }}
 */
function validarParametrosSimulacion(params = {}) {
  const errores = [];
  const advertencias = [];

  const tempRaw = params.temperatura_c !== undefined ? params.temperatura_c : params.temperatura;
  const masaRaw = params.masa_inoculo_g !== undefined ? params.masa_inoculo_g : params.masa_inoculo;
  const volRaw = params.volumen_ml !== undefined ? params.volumen_ml : params.masa_leche;
  const sustratoRaw = params.tipo_sustrato || params.tipo_leche || 'vaca';
  const azucarRaw = params.tipo_azucar || params.tipoAzucar;

  const temp = Number(tempRaw !== undefined ? tempRaw : 42);
  const masa = Number(masaRaw !== undefined ? masaRaw : LIMITES.MASA_INOCULO_G.ESTANDAR);
  const vol = Number(volRaw !== undefined ? volRaw : LIMITES.VOLUMEN_ML.ESTANDAR);

  // 1. Temperatura
  if (Number.isNaN(temp) || temp < LIMITES.TEMPERATURA_C.MIN || temp > LIMITES.TEMPERATURA_C.MAX) {
    errores.push(`La temperatura (${temp} °C) debe estar entre ${LIMITES.TEMPERATURA_C.MIN} °C y ${LIMITES.TEMPERATURA_C.MAX} °C.`);
  } else if (temp < LIMITES.TEMPERATURA_C.OPTIMA_MIN || temp > LIMITES.TEMPERATURA_C.OPTIMA_MAX) {
    advertencias.push(`Temperatura (${temp} °C) fuera del rango térmico óptimo de laboratorio (${LIMITES.TEMPERATURA_C.OPTIMA_MIN} °C – ${LIMITES.TEMPERATURA_C.OPTIMA_MAX} °C).`);
  }

  // 2. Masa y Volumen
  if (Number.isNaN(vol) || vol < LIMITES.VOLUMEN_ML.MIN || vol > LIMITES.VOLUMEN_ML.MAX) {
    errores.push(`El volumen de leche (${vol} mL) debe estar entre ${LIMITES.VOLUMEN_ML.MIN} mL y ${LIMITES.VOLUMEN_ML.MAX} mL.`);
  }

  if (Number.isNaN(masa) || masa < LIMITES.MASA_INOCULO_G.MIN || masa > LIMITES.MASA_INOCULO_G.MAX) {
    errores.push(`La masa de inóculo (${masa} g) debe estar entre ${LIMITES.MASA_INOCULO_G.MIN} g y ${LIMITES.MASA_INOCULO_G.MAX} g.`);
  }

  // 3. Porcentaje de inóculo resultante
  let porcentajeInoculo = 7.5;
  if (vol > 0 && masa > 0) {
    porcentajeInoculo = Number(((masa / vol) * 100).toFixed(2));
    if (porcentajeInoculo < LIMITES.INOCULO_PCT.MIN || porcentajeInoculo > LIMITES.INOCULO_PCT.MAX) {
      errores.push(`El porcentaje de inóculo resultante (${porcentajeInoculo}%) excede los límites fisiológicos permitidos [${LIMITES.INOCULO_PCT.MIN}% - ${LIMITES.INOCULO_PCT.MAX}%].`);
    }
  }

  // 4. Tipo de sustrato
  const sustrato = String(sustratoRaw).trim().toLowerCase();
  const sustratosPermitidos = ['vaca', 'chocho', 'vegetal_chocho', 'coco', 'vegetal_coco'];
  const sustratoFinal = sustratosPermitidos.some((s) => sustrato.includes(s) || s.includes(sustrato))
    ? (sustrato.includes('chocho') ? 'chocho' : sustrato.includes('coco') ? 'coco' : 'vaca')
    : 'vaca';

  // 5. Tipo de azúcar (Química de carbohidratos - Audio 2 Dr. Santacruz)
  let tipoAzucarFinal = 'lactosa';
  const azucarNormalizado = azucarRaw ? String(azucarRaw).trim().toLowerCase() : null;

  if (sustratoFinal === 'chocho' || sustratoFinal === 'coco') {
    if (azucarNormalizado === 'lactosa') {
      advertencias.push(`Nota Bioquímica (Dr. Santacruz): La leche de ${sustratoFinal} no contiene lactosa naturalmente. Se ajusta la fuente de carbohidratos a sacarosa.`);
      tipoAzucarFinal = 'sacarosa';
    } else if (azucarNormalizado === 'glucosa') {
      tipoAzucarFinal = 'glucosa';
    } else {
      tipoAzucarFinal = 'sacarosa'; // Sacarosa por defecto para leches vegetales
    }
  } else {
    // Leche de vaca
    if (azucarNormalizado === 'glucosa') {
      tipoAzucarFinal = 'glucosa';
    } else if (azucarNormalizado === 'sacarosa') {
      tipoAzucarFinal = 'sacarosa';
    } else {
      tipoAzucarFinal = 'lactosa'; // Lactosa nativa por defecto en vaca
    }
  }

  return {
    esValido: errores.length === 0,
    errores,
    advertencias,
    parametrosSaneados: errores.length === 0 ? {
      temperaturaC: Number(temp.toFixed(1)),
      masaInoculoG: Number(masa.toFixed(2)),
      volumenMl: Number(vol.toFixed(1)),
      porcentajeInoculo,
      tipoSustrato: sustratoFinal,
      tipoAzucar: tipoAzucarFinal,
    } : null,
  };
}

/**
 * Valida un lote completo que se ingresa para Aprendizaje Continuo (Feedback Loop)
 * @param {Object} body
 * @returns {{ esValido: boolean, errores: string[], lecturasSaneadas: Array<Object>, metadata: Object }}
 */
function validarLoteFeedback(body = {}) {
  const errores = [];

  const {
    lote_id,
    temperatura_c,
    masa_inoculo_g,
    volumen_ml,
    viscosidad_final,
    lecturas,
  } = body;

  // 1. Validar identificador del lote
  if (!lote_id || typeof lote_id !== 'string' || lote_id.trim().length === 0) {
    errores.push('El campo lote_id es obligatorio y debe ser un identificador válido.');
  }

  // 2. Validar viscosidad final obligatoria (regla del Dr. Stalin Santacruz)
  const visc = Number(viscosidad_final);
  if (viscosidad_final === undefined || Number.isNaN(visc)) {
    errores.push('La viscosidad final es obligatoria para certificar la reología del lote.');
  } else if (visc < LIMITES.VISCOSIDAD_MPAS.MIN || visc > LIMITES.VISCOSIDAD_MPAS.MAX) {
    errores.push(`La viscosidad final (${visc} mPa·s) debe estar en el rango medible de laboratorio [${LIMITES.VISCOSIDAD_MPAS.MIN} - ${LIMITES.VISCOSIDAD_MPAS.MAX} mPa·s].`);
  }

  // 3. Validar condiciones de fermentación del lote
  const validacionParams = validarParametrosSimulacion({
    temperatura_c,
    masa_inoculo_g,
    volumen_ml,
  });

  if (!validacionParams.esValido) {
    errores.push(...validacionParams.errores);
  }

  // 4. Validar serie temporal de lecturas
  if (!Array.isArray(lecturas) || lecturas.length < 2) {
    errores.push('Debe proporcionar al menos 2 lecturas cronológicas del ensayo para que el modelo pueda aprender la cinética.');
    return {
      esValido: false,
      errores,
      lecturasSaneadas: [],
      metadata: null,
    };
  }

  const lecturasSaneadas = [];
  const tiemposVistos = new Set();

  for (let i = 0; i < lecturas.length; i++) {
    const item = lecturas[i];
    const valLectura = validarLecturaFisicoquimica(item);

    if (!valLectura.esValido) {
      errores.push(`Lectura #${i + 1}: ${valLectura.errores.join(' | ')}`);
    } else {
      if (tiemposVistos.has(valLectura.datosSaneados.minutos)) {
        errores.push(`Lectura #${i + 1}: Ya existe una lectura registrada en el minuto ${valLectura.datosSaneados.minutos}.`);
      } else {
        tiemposVistos.add(valLectura.datosSaneados.minutos);
        lecturasSaneadas.push({
          ...valLectura.datosSaneados,
          loteId: String(lote_id).trim(),
          temperaturaIncubacionC: validacionParams.parametrosSaneados?.temperaturaC || 42,
          porcentajeInoculo: validacionParams.parametrosSaneados?.porcentajeInoculo || 7.5,
          masaInoculoG: validacionParams.parametrosSaneados?.masaInoculoG || 18.75,
          viscosidadFinalReal: Number(visc.toFixed(1)),
        });
      }
    }
  }

  // Ordenar cronológicamente por minutos
  lecturasSaneadas.sort((a, b) => a.minutos - b.minutos);

  return {
    esValido: errores.length === 0,
    errores,
    lecturasSaneadas: errores.length === 0 ? lecturasSaneadas : [],
    metadata: errores.length === 0 ? {
      loteId: String(lote_id).trim(),
      totalLecturas: lecturasSaneadas.length,
      viscosidadFinal: Number(visc.toFixed(1)),
      parametros: validacionParams.parametrosSaneados,
    } : null,
  };
}

/**
 * Valida la entrada para recalibración dinámica en tiempo real
 * @param {Object} body
 * @returns {{ esValido: boolean, errores: string[], configuracionSaneada: Object, lecturasSaneadas: Array<Object> }}
 */
function validarRecalibracionDinamica(body = {}) {
  const errores = [];
  const configuracion = body.configuracion || body;
  const lecturasRaw = body.lecturas || body.lecturas_en_curso || body.lecturasEnVivo || [];

  const valParams = validarParametrosSimulacion(configuracion);
  if (!valParams.esValido) {
    errores.push(...valParams.errores);
  }

  if (!Array.isArray(lecturasRaw)) {
    errores.push('El campo lecturas debe ser un arreglo de mediciones periódicas.');
    return { esValido: false, errores, configuracionSaneada: null, lecturasSaneadas: [] };
  }

  const lecturasSaneadas = [];
  for (let i = 0; i < lecturasRaw.length; i++) {
    const item = lecturasRaw[i];
    const valLectura = validarLecturaFisicoquimica(item);
    if (!valLectura.esValido) {
      errores.push(`Lectura #${i + 1}: ${valLectura.errores.join(' | ')}`);
    } else {
      lecturasSaneadas.push(valLectura.datosSaneados);
    }
  }

  return {
    esValido: errores.length === 0,
    errores,
    configuracionSaneada: valParams.parametrosSaneados,
    lecturasSaneadas,
  };
}

module.exports = {
  LIMITES,
  validarLecturaFisicoquimica,
  validarParametrosSimulacion,
  validarLoteFeedback,
  validarRecalibracionDinamica,
};
