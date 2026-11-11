import api, { getBaseUrl, isNetworkError } from './api';
import storage from '../utils/storage';

const LOCAL_TRIALS_KEY = '@prediyogur_trials';

const ENSAYOS_AUTONOMOS_DEFAULT = [
  {
    id: 1,
    lote_id: 'LOTE-ULEAM-E4-OPTIMO',
    investigador: 'Dr. Stalin Santacruz Terán',
    usuario_email: 'dr.santacruz@uleam.edu.ec',
    tipo_sustrato: 'vaca',
    tipo_azucar: 'sacarosa',
    temperatura_c: 42.0,
    masa_inoculo_g: 18.75,
    volumen_ml: 250,
    porcentaje_inoculo: 7.5,
    tiempo_corte_inicial_horas: 4.25,
    tiempo_corte_estimado_horas: 4.25,
    estado: 'completado',
    lecturas: [
      { minutos: 0, ph: 6.65, temperatura: 42.0 },
      { minutos: 60, ph: 6.42, temperatura: 42.0 },
      { minutos: 120, ph: 6.05, temperatura: 42.0 },
      { minutos: 180, ph: 5.35, temperatura: 42.0 },
      { minutos: 240, ph: 4.62, temperatura: 42.0 },
      { minutos: 255, ph: 4.50, temperatura: 42.0 },
    ],
    creado_en: new Date().toISOString(),
    actualizado_en: new Date().toISOString(),
  },
  {
    id: 2,
    lote_id: 'LOTE-ULEAM-E2-CONTROL',
    investigador: 'Carlos Delgado',
    usuario_email: 'carlos.delgado@uleam.edu.ec',
    tipo_sustrato: 'vaca',
    tipo_azucar: 'lactosa',
    temperatura_c: 40.0,
    masa_inoculo_g: 6.25,
    volumen_ml: 250,
    porcentaje_inoculo: 2.5,
    tiempo_corte_inicial_horas: 5.83,
    tiempo_corte_estimado_horas: 5.83,
    estado: 'completado',
    lecturas: [
      { minutos: 0, ph: 6.70, temperatura: 40.0 },
      { minutos: 60, ph: 6.55, temperatura: 40.0 },
      { minutos: 180, ph: 6.10, temperatura: 40.0 },
      { minutos: 300, ph: 5.20, temperatura: 40.0 },
      { minutos: 350, ph: 4.50, temperatura: 40.0 },
    ],
    creado_en: new Date().toISOString(),
    actualizado_en: new Date().toISOString(),
  },
];

/**
 * Obtiene la lista de ensayos almacenados en AsyncStorage del dispositivo
 */
async function getEnsayosLocales() {
  try {
    const raw = await storage.getItem(LOCAL_TRIALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[ensayosService] Error al leer ensayos locales:', e.message);
  }
  return [];
}

/**
 * Guarda o actualiza un ensayo en AsyncStorage
 */
async function guardarEnsayoLocal(ensayo) {
  try {
    const locales = await getEnsayosLocales();
    const idx = locales.findIndex((e) => e.lote_id === ensayo.lote_id || (ensayo.id && e.id === ensayo.id));
    if (idx >= 0) {
      locales[idx] = { ...locales[idx], ...ensayo, actualizado_en: new Date().toISOString() };
    } else {
      locales.unshift({ ...ensayo, creado_en: ensayo.creado_en || new Date().toISOString(), actualizado_en: new Date().toISOString() });
    }
    await storage.setItem(LOCAL_TRIALS_KEY, JSON.stringify(locales));
  } catch (e) {
    console.warn('[ensayosService] Error al persistir ensayo localmente:', e.message);
  }
}

/**
 * Servicio Universal de Ensayos y Persistencia en SQLite
 * Conecta directamente con los endpoints /api/ai/trials del backend
 * Aislamiento de muestras por usuario y soporte de exportación CSV/JSON/PDF
 */
export const ensayosService = {
  /**
   * Obtiene la lista de ensayos registrados en SQLite y sincronizados localmente
   * @param {Object} [filtros]
   * @param {string} [filtros.usuarioEmail] - Filtrar por email del investigador
   * @param {boolean} [filtros.misEnsayos] - Filtrar únicamente las muestras del usuario autenticado
   * @returns {Promise<Array>} Lista de ensayos (siempre devuelve un Array)
   */
  getEnsayos: async (filtros = {}) => {
    let trialsServidor = [];
    let serverOk = false;

    try {
      const params = {};
      if (filtros.usuarioEmail) {
        params.usuario_email = filtros.usuarioEmail;
      }
      if (filtros.misEnsayos) {
        params.mis_ensayos = 'true';
      }

      const res = await api.get('/ai/trials', { params });
      serverOk = true;

      // Normalizar estructura de respuesta a un Array puro
      if (res.data) {
        if (Array.isArray(res.data)) {
          trialsServidor = res.data;
        } else if (res.data.data) {
          if (Array.isArray(res.data.data)) {
            trialsServidor = res.data.data;
          } else if (Array.isArray(res.data.data.trials)) {
            trialsServidor = res.data.data.trials;
          }
        } else if (Array.isArray(res.data.trials)) {
          trialsServidor = res.data.trials;
        }
      }
    } catch (err) {
      console.warn('[ensayosService] Backend no disponible para listar ensayos, recurriendo a local:', err.message);
    }

    // Cargar ensayos locales guardados en este dispositivo
    const locales = await getEnsayosLocales();

    if (serverOk) {
      // Sincronizar: agregar los locales que no estén en servidor
      const idsServidor = new Set(trialsServidor.map((t) => t.lote_id));
      const combinados = [...trialsServidor];
      for (const loc of locales) {
        if (!idsServidor.has(loc.lote_id)) {
          combinados.push(loc);
        }
      }
      return combinados;
    }

    // Modo Autónomo / Offline: Combinar ensayos locales con los predeterminados de laboratorio
    const todosLocales = [...locales];
    const lotesLocales = new Set(locales.map((t) => t.lote_id));
    for (const def of ENSAYOS_AUTONOMOS_DEFAULT) {
      if (!lotesLocales.has(def.lote_id)) {
        todosLocales.push(def);
      }
    }

    if (filtros.usuarioEmail && filtros.misEnsayos) {
      const emailSearch = String(filtros.usuarioEmail).trim().toLowerCase();
      const filtrados = todosLocales.filter((t) => t.usuario_email && t.usuario_email.toLowerCase() === emailSearch);
      // Si el usuario no tiene muestras propias aún, permitir que visualice las de referencia o sus locales
      return filtrados.length > 0 ? filtrados : todosLocales;
    }

    return todosLocales;
  },

  /**
   * Obtiene un ensayo específico con todas sus lecturas cinéticas por loteId
   * @param {string} loteId 
   * @returns {Promise<Object>}
   */
  getEnsayoPorLoteId: async (loteId) => {
    try {
      const res = await api.get(`/ai/trials/${encodeURIComponent(loteId)}`);
      const data = res.data?.data || res.data;
      if (data) {
        const trial = data.trial || data;
        await guardarEnsayoLocal(trial);
        return trial;
      }
    } catch (err) {
      console.warn('[ensayosService] Backend no disponible para getEnsayoPorLoteId:', err.message);
    }

    // Fallback a AsyncStorage local
    const locales = await getEnsayosLocales();
    const match = locales.find((e) => e.lote_id === loteId);
    if (match) return match;

    const defMatch = ENSAYOS_AUTONOMOS_DEFAULT.find((e) => e.lote_id === loteId);
    if (defMatch) return defMatch;

    return null;
  },

  /**
   * Registra un nuevo lote de fermentación en SQLite y sincroniza localmente
   * @param {Object} datos
   */
  crearEnsayo: async (datos) => {
    const loteId = String(datos.lote_id || datos.codigo || datos.nombre_lote || 'LOTE-EXP-' + Date.now()).trim();
    const tempNum = Number(datos.temperatura_c ?? datos.temperaturaObjetivo ?? 42.0);
    const masaNum = Number(datos.masa_inoculo_g ?? datos.masaInoculoG ?? 18.75);
    const volNum = Number(datos.volumen_ml ?? datos.volumenMl ?? 250);
    const pctInoculo = Number(((masaNum / volNum) * 100).toFixed(2));

    const payload = {
      lote_id: loteId,
      investigador: datos.investigador || 'Investigador ULEAM',
      usuario_email: datos.usuario_email,
      usuario_id: datos.usuario_id,
      tipo_sustrato: datos.tipo_sustrato || datos.tipoSustrato || 'vaca',
      tipo_azucar: datos.tipo_azucar || datos.tipoAzucar || 'lactosa',
      temperatura_c: tempNum,
      masa_inoculo_g: masaNum,
      volumen_ml: volNum,
      porcentaje_inoculo: pctInoculo,
    };

    // Estructura base local de respaldo
    const ensayoLocal = {
      id: Date.now(),
      lote_id: loteId,
      investigador: payload.investigador,
      usuario_email: payload.usuario_email,
      tipo_sustrato: payload.tipo_sustrato,
      tipo_azucar: payload.tipo_azucar,
      temperatura_c: tempNum,
      masa_inoculo_g: masaNum,
      volumen_ml: volNum,
      porcentaje_inoculo: pctInoculo,
      tiempo_corte_inicial_horas: 4.25,
      tiempo_corte_estimado_horas: 4.25,
      estado: 'EN_CURSO',
      lecturas: [
        {
          minutos: 0,
          tiempo_minutos: 0,
          ph: 6.65,
          temperatura: tempNum,
          indice_refraccion: null,
          registrado_en: new Date().toISOString(),
        },
      ],
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };

    // Guardar inmediatamente en almacenamiento local del dispositivo
    await guardarEnsayoLocal(ensayoLocal);

    // Intentar persistir en el SQLite del servidor
    try {
      const res = await api.post('/ai/trials', payload);
      const dataServidor = res.data?.data || res.data;
      const trialServidor = dataServidor.trial || dataServidor;

      if (trialServidor && trialServidor.lote_id) {
        await guardarEnsayoLocal(trialServidor);
        return {
          trial: trialServidor,
          id: trialServidor.id,
          lote_id: trialServidor.lote_id,
          data: dataServidor,
        };
      }
    } catch (err) {
      if (!isNetworkError(err)) {
        throw err; // Error de validación fisicoquímica u otro error explícito del backend
      }
      console.warn('[ensayosService] Backend offline, ensayo registrado en almacenamiento local autónomo.');
    }

    return {
      trial: ensayoLocal,
      id: ensayoLocal.id,
      lote_id: ensayoLocal.lote_id,
      modo: 'offline_local',
    };
  },

  /**
   * Agrega una lectura periódica de monitoreo al ensayo
   * @param {string} loteId
   * @param {Object} lectura
   */
  agregarLectura: async (loteId, lectura) => {
    const min = Number(lectura.minutos ?? lectura.tiempo_minutos);
    const ph = Number(lectura.ph);
    const temp = Number(lectura.temperatura ?? 42.0);
    const brix = lectura.indice_refraccion !== undefined && lectura.indice_refraccion !== null
      ? Number(lectura.indice_refraccion)
      : null;

    const payload = {
      minutos: min,
      tiempo_minutos: min,
      ph,
      temperatura: temp,
      indice_refraccion: brix,
    };

    // Actualizar copia local
    try {
      const locales = await getEnsayosLocales();
      const ensayo = locales.find((e) => e.lote_id === loteId);
      if (ensayo) {
        if (!Array.isArray(ensayo.lecturas)) ensayo.lecturas = [];
        const existIdx = ensayo.lecturas.findIndex((l) => (l.minutos ?? l.tiempo_minutos) === min);
        if (existIdx >= 0) {
          ensayo.lecturas[existIdx] = { ...ensayo.lecturas[existIdx], ...payload };
        } else {
          ensayo.lecturas.push({ ...payload, registrado_en: new Date().toISOString() });
        }
        await guardarEnsayoLocal(ensayo);
      }
    } catch (e) {}

    // Enviar a servidor backend si está disponible
    try {
      const res = await api.post(`/ai/trials/${encodeURIComponent(loteId)}/readings`, payload);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('[ensayosService] Guardando lectura localmente (backend no disponible):', err.message);
      return { success: true, local: true };
    }
  },

  /**
   * Elimina una lectura periódica de un lote
   * @param {string} loteId 
   * @param {number} minuto 
   */
  eliminarLectura: async (loteId, minuto) => {
    try {
      const res = await api.delete(`/ai/trials/${encodeURIComponent(loteId)}/readings/${minuto}`);
      return res.data;
    } catch (err) {
      console.warn('[ensayosService] Error al eliminar lectura en backend:', err.message);
    }
  },

  /**
   * Elimina un lote completo de SQLite y de local
   * @param {string} loteId 
   */
  eliminarEnsayo: async (loteId) => {
    try {
      const locales = await getEnsayosLocales();
      const filtrados = locales.filter((e) => e.lote_id !== loteId);
      await storage.setItem(LOCAL_TRIALS_KEY, JSON.stringify(filtrados));
    } catch (e) {}

    try {
      const res = await api.delete(`/ai/trials/${encodeURIComponent(loteId)}`);
      return res.data;
    } catch (err) {
      console.warn('[ensayosService] Error al eliminar ensayo en backend:', err.message);
    }
  },

  /**
   * Exporta las lecturas de un lote en CSV, JSON o PDF
   * @param {string} loteId 
   * @param {'csv'|'json'|'pdf'} [formato='csv']
   */
  exportarEnsayo: async (loteId, formato = 'csv') => {
    const res = await api.get(`/ai/trials/${encodeURIComponent(loteId)}/export`, {
      params: { formato },
      responseType: formato === 'pdf' ? 'blob' : (formato === 'csv' ? 'text' : 'json'),
    });
    return res.data;
  },

  /**
   * Obtiene la URL absoluta para descarga directa en navegador móvil o web
   * @param {string} loteId 
   * @param {'csv'|'json'|'pdf'} [formato='pdf']
   */
  obtenerUrlDescarga: (loteId, formato = 'pdf') => {
    const base = getBaseUrl();
    return `${base}/ai/trials/${encodeURIComponent(loteId)}/export?formato=${formato}`;
  },

  /**
   * Recalibra en vivo el tiempo de corte estimado a pH 4.50
   * @param {Object} datos
   */
  recalibrar: async (datos) => {
    const res = await api.post('/ai/recalibrate', datos);
    return res.data?.data || res.data;
  },

  /**
   * Envía un lote experimental al Feedback Loop para aprendizaje continuo
   * @param {Object} datosLote
   */
  enviarFeedbackBatch: async (datosLote) => {
    const res = await api.post('/ai/feedback', datosLote);
    return res.data;
  },

  /**
   * Obtiene las métricas científicas globales del modelo Hill (R² = 0.9774)
   */
  getMetricasModelo: async () => {
    const res = await api.get('/ai/metrics');
    return res.data?.data || res.data;
  },
};

export default ensayosService;
