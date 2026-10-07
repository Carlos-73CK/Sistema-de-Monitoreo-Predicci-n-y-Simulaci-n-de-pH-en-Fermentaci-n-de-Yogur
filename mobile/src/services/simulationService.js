/**
 * Servicio de Simulación y Modelado Cinético de pH ("What-If Analysis")
 * Cátedra de Química de Alimentos - ULEAM (Dr. Stalin Santacruz)
 * 
 * Modela la curva de acidificación bacteriana (degradación de azúcares y 
 * producción de ácido láctico) en función de:
 * 1. Tipo de sustrato (Vaca, Chocho, Coco)
 * 2. Inóculo de yogur comercial Chivería dosificado en gramos
 * 3. Temperatura de incubación en baño maría (Óptimo: 42 °C; Rango: 41 - 43 °C)
 * 4. Umbral de corte estricto: pH 4.5
 */

export const simulationService = {
  /**
   * Genera la curva cinética estimada de pH y el tiempo estimado para alcanzar pH 4.5
   * @param {Object} params
   * @param {'vaca'|'chocho'|'coco'} params.tipoSustrato - Tipo de matriz
   * @param {number} params.masaInoculoG - Masa de yogur Chivería en gramos
   * @param {number} params.temperaturaC - Temperatura en baño maría (°C)
   * @param {number} [params.volumenMl=1000] - Volumen de lote en mL
   * @returns {Object} Resultado de la simulación
   */
  simularAcidificacion: ({ tipoSustrato = 'vaca', masaInoculoG = 30, temperaturaC = 42, volumenMl = 1000 }) => {
    const masa = Number(masaInoculoG) || 30;
    const temp = Number(temperaturaC) || 42;
    const vol = Number(volumenMl) || 1000;

    // 1. Parámetros basales por tipo de matriz
    let phInicial = 6.65;
    let phAsintota = 4.10;
    let tasaBase = 0.0075; // Tasa cinética de acidificación (1/min)

    switch (tipoSustrato.toLowerCase()) {
      case 'chocho':
        phInicial = 6.45;
        phAsintota = 4.20;
        tasaBase = 0.0058; // Menor velocidad de acidificación inicial en sustrato vegetal
        break;
      case 'coco':
        phInicial = 6.35;
        phAsintota = 4.25;
        tasaBase = 0.0062;
        break;
      case 'vaca':
      default:
        phInicial = 6.68;
        phAsintota = 4.05;
        tasaBase = 0.0080;
        break;
    }

    // 2. Factor de inóculo Chivería: dosificación base recomendada ~3% (30g por 1000 mL)
    const proporcionInoculo = (masa / vol) * 100;
    // Factor de inóculo normalizado (más inóculo acelera la fase logarítmica)
    const factorInoculo = Math.min(Math.max(proporcionInoculo / 3.0, 0.4), 2.5);

    // 3. Factor de temperatura (Curva de campana en torno al óptimo fisiológico de 42 °C)
    // Bacterias termófilas: Streptococcus thermophilus y Lactobacillus bulgaricus
    let factorTemperatura = 1.0;
    if (temp >= 41.0 && temp <= 43.0) {
      factorTemperatura = 1.0 - Math.abs(temp - 42.0) * 0.05; // Máximo en 42 °C
    } else if (temp < 41.0) {
      // Ralentización por baja temperatura (ej. a 38 °C desciende drásticamente)
      const delta = 41.0 - temp;
      factorTemperatura = Math.max(0.95 - delta * 0.12, 0.2);
    } else {
      // Estrés térmico a > 43 °C
      const delta = temp - 43.0;
      factorTemperatura = Math.max(0.95 - delta * 0.20, 0.1);
    }

    // Constante cinética efectiva
    const kEfectiva = tasaBase * factorInoculo * factorTemperatura;

    // 4. Simulación paso a paso (cada 15 minutos) hasta llegar a pH 4.5 o 600 min
    const puntos = [];
    const PH_CORTE = 4.5;
    let tiempoCorteMin = null;
    let phActual = phInicial;
    const deltaMinutos = 15;
    const tiempoMaximo = 600;

    for (let t = 0; t <= tiempoMaximo; t += deltaMinutos) {
      // Modelo de decaimiento sigmoidal de pH
      // pH(t) = phAsintota + (phInicial - phAsintota) / (1 + (t / t_medio)^gamma)
      const tMedio = Math.log(2) / kEfectiva;
      const decaimiento = 1 / (1 + Math.pow(t / Math.max(tMedio, 1), 2.2));
      phActual = Number((phAsintota + (phInicial - phAsintota) * decaimiento).toFixed(2));

      puntos.push({
        minutos: t,
        ph: phActual,
        temperatura: temp,
      });

      if (tiempoCorteMin === null && phActual <= PH_CORTE) {
        tiempoCorteMin = t;
      }

      // Si ya bajó de 4.45 y tenemos varios puntos, podemos cerrar la curva
      if (phActual <= 4.35 && t >= (tiempoCorteMin || 0) + 30) {
        break;
      }
    }

    // Si no alcanzó el corte en el horizonte máximo
    if (tiempoCorteMin === null) {
      tiempoCorteMin = tiempoMaximo;
    }

    const fueraDeRangoTermico = temp < 41.0 || temp > 43.0;

    return {
      tipoSustrato,
      masaInoculoG: masa,
      temperaturaC: temp,
      phInicial,
      phCorte: PH_CORTE,
      tiempoEstimadoCorteMinutos: tiempoCorteMin,
      tiempoEstimadoHoras: (tiempoCorteMin / 60).toFixed(1),
      fueraDeRangoTermico,
      alertaTermica: fueraDeRangoTermico
        ? `¡Atención! La temperatura (${temp} °C) está fuera del rango óptimo (41.0 °C - 43.0 °C).`
        : null,
      puntos,
    };
  },
};

export default simulationService;
