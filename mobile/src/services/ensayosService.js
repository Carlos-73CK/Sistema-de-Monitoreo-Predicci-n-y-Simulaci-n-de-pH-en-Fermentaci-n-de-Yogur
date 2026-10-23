import api from './api';

/**
 * Servicio Universal de Ensayos y Persistencia en SQLite
 * Conecta directamente con los endpoints /api/ai/trials del backend
 * Aislamiento de muestras por usuario y soporte de exportación CSV/JSON
 */
export const ensayosService = {
  /**
   * Obtiene la lista de ensayos registrados en SQLite
   * @param {Object} [filtros]
   * @param {string} [filtros.usuarioEmail] - Filtrar por email del investigador
   * @param {boolean} [filtros.misEnsayos] - Filtrar únicamente las muestras del usuario autenticado
   * @returns {Promise<Array>} Lista de ensayos
   */
  getEnsayos: async (filtros = {}) => {
    try {
      const params = {};
      if (filtros.usuarioEmail) {
        params.usuario_email = filtros.usuarioEmail;
      }
      if (filtros.misEnsayos) {
        params.mis_ensayos = 'true';
      }

      const res = await api.get('/ai/trials', { params });
      if (res.data && res.data.data) {
        return res.data.data;
      }
      return res.data || [];
    } catch (err) {
      console.warn('[ensayosService] Error al listar /ai/trials, intentando /ensayos:', err.message);
      try {
        const fallback = await api.get('/ensayos');
        return fallback.data?.data || fallback.data || [];
      } catch (fallbackErr) {
        console.error('[ensayosService] Fallaron ambos endpoints:', fallbackErr.message);
        throw fallbackErr;
      }
    }
  },

  /**
   * Obtiene un ensayo específico con todas sus lecturas cinéticas por loteId
   * @param {string} loteId 
   * @returns {Promise<Object>}
   */
  getEnsayoPorLoteId: async (loteId) => {
    const res = await api.get(`/ai/trials/${encodeURIComponent(loteId)}`);
    return res.data?.data || res.data;
  },

  /**
   * Registra un nuevo lote de fermentación en SQLite
   * @param {Object} datos
   */
  crearEnsayo: async (datos) => {
    const payload = {
      lote_id: datos.lote_id || datos.codigo || datos.nombre_lote,
      investigador: datos.investigador || 'Investigador ULEAM',
      usuario_email: datos.usuario_email,
      usuario_id: datos.usuario_id,
      tipo_sustrato: datos.tipo_sustrato || datos.tipoSustrato || 'vaca',
      tipo_azucar: datos.tipo_azucar || datos.tipoAzucar || 'lactosa',
      temperatura_c: Number(datos.temperatura_c ?? datos.temperaturaObjetivo ?? 42.0),
      masa_inoculo_g: Number(datos.masa_inoculo_g ?? datos.masaInoculoG ?? 18.75),
      volumen_ml: Number(datos.volumen_ml ?? datos.volumenMl ?? 250),
    };

    const res = await api.post('/ai/trials', payload);
    return res.data?.data || res.data;
  },

  /**
   * Agrega una lectura periódica de monitoreo al ensayo
   * @param {string} loteId
   * @param {Object} lectura
   */
  agregarLectura: async (loteId, lectura) => {
    const payload = {
      minutos: Number(lectura.minutos ?? lectura.tiempo_minutos),
      ph: Number(lectura.ph),
      temperatura: Number(lectura.temperatura ?? 42.0),
      indice_refraccion: lectura.indice_refraccion !== undefined && lectura.indice_refraccion !== null
        ? Number(lectura.indice_refraccion)
        : null,
    };

    const res = await api.post(`/ai/trials/${encodeURIComponent(loteId)}/readings`, payload);
    return res.data?.data || res.data;
  },

  /**
   * Elimina una lectura periódica de un lote
   * @param {string} loteId 
   * @param {number} minuto 
   */
  eliminarLectura: async (loteId, minuto) => {
    const res = await api.delete(`/ai/trials/${encodeURIComponent(loteId)}/readings/${minuto}`);
    return res.data;
  },

  /**
   * Elimina un lote completo de SQLite
   * @param {string} loteId 
   */
  eliminarEnsayo: async (loteId) => {
    const res = await api.delete(`/ai/trials/${encodeURIComponent(loteId)}`);
    return res.data;
  },

  /**
   * Exporta las lecturas de un lote en CSV o JSON
   * @param {string} loteId 
   * @param {'csv'|'json'} [formato='csv']
   */
  exportarEnsayo: async (loteId, formato = 'csv') => {
    const res = await api.get(`/ai/trials/${encodeURIComponent(loteId)}/export`, {
      params: { formato },
      responseType: formato === 'csv' ? 'text' : 'json',
    });
    return res.data;
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
