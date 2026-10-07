import api from './api';

/**
 * Servicio de Gestión de Ensayos y Lecturas Cinéticas
 * Respeta las reglas de negocio del Dr. Stalin Santacruz (ULEAM):
 * - Inóculo Chivería en gramos
 * - Temperatura objetivo 42 °C (alerta si fuera de 41 - 43 °C)
 * - pH de corte en 4.5
 * - Registro obligatorio de viscosidad final al suspender
 */
export const ensayosService = {
  /**
   * Obtiene la lista de todos los ensayos registrados
   */
  getEnsayos: async () => {
    const response = await api.get('/ensayos');
    return response.data;
  },

  /**
   * Obtiene el detalle completo de un ensayo junto con su serie temporal de lecturas
   * @param {number|string} id 
   */
  getEnsayoPorId: async (id) => {
    const response = await api.get(`/ensayos/${id}`);
    return response.data;
  },

  /**
   * Registra un nuevo ensayo de fermentación
   * @param {Object} datos
   * @param {string} datos.codigo - Código o identificador del lote/ensayo
   * @param {string} datos.tipoSustrato - 'vaca', 'chocho', 'coco', u otro
   * @param {number} datos.masaInoculoG - Masa de yogur Chivería en gramos
   * @param {number} [datos.temperaturaObjetivo=42.0] - Temperatura de baño maría (°C)
   * @param {number} [datos.volumenMl=1000] - Volumen de la muestra en mL
   * @param {string} [datos.observaciones] - Notas iniciales de formulación
   */
  crearEnsayo: async (datos) => {
    const response = await api.post('/ensayos', {
      codigo: datos.codigo,
      tipo_sustrato: datos.tipoSustrato,
      masa_inoculo_g: Number(datos.masaInoculoG),
      temperatura_objetivo: datos.temperaturaObjetivo ? Number(datos.temperaturaObjetivo) : 42.0,
      volumen_ml: datos.volumenMl ? Number(datos.volumenMl) : 1000,
      observaciones: datos.observaciones || '',
    });
    return response.data;
  },

  /**
   * Agrega una lectura periódica al ensayo activo
   * @param {number|string} ensayoId 
   * @param {Object} lectura
   * @param {number} lectura.minutos - Tiempo transcurrido en minutos
   * @param {number} lectura.ph - Medición de pH (rango típico ~7.0 a 4.5)
   * @param {number} lectura.temperatura - Temperatura en baño maría (°C)
   */
  registrarLectura: async (ensayoId, lectura) => {
    const response = await api.post(`/ensayos/${ensayoId}/lecturas`, {
      minutos: Number(lectura.minutos),
      ph: Number(lectura.ph),
      temperatura: Number(lectura.temperatura),
    });
    return response.data;
  },

  /**
   * Finaliza el ensayo de fermentación (habitualmente al alcanzar pH 4.5)
   * @param {number|string} ensayoId 
   * @param {Object} cierre
   * @param {number} cierre.viscosidadFinal - Viscosidad final obligatoria (mPa·s / cP)
   * @param {string} [cierre.observaciones] - Notas de cierre
   */
  finalizarEnsayo: async (ensayoId, cierre) => {
    const response = await api.patch(`/ensayos/${ensayoId}/finalizar`, {
      viscosidad_final: Number(cierre.viscosidadFinal),
      observaciones: cierre.observaciones || '',
    });
    return response.data;
  },
};

export default ensayosService;
