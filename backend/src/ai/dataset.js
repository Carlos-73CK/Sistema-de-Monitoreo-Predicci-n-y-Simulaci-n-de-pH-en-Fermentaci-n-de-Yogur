/**
 * Dataset Experimental de Laboratorio - Dr. Stalin Gustavo Santacruz Terán
 * Cátedra de Química de Alimentos y Maestría (ULEAM)
 * 
 * Matriz Factorial 2 x 3:
 * - 2 Niveles de Inóculo (Yogur Chivería): 2.5% (6.25 g) y 7.5% (18.75 g)
 * - 3 Temperaturas de Incubación en Baño María: 40 °C, 42 °C (óptima) y 44 °C
 * - Matriz Base: 250 g de Leche entera de vaca
 * - Variables medidas: tiempo (h / min), pH, Índice de Refracción (°Brix), Temperatura (°C), Viscosidad final (mPa·s)
 */

const EXPERIMENTAL_BATCHES = [
  {
    loteId: 'LOTE-CHV-40-2.5',
    temperaturaIncubacionC: 40,
    porcentajeInoculo: 2.5,
    masaInoculoG: 6.25,
    masaLecheG: 250,
    viscosidadFinalMpaS: 2579,
    viscosimetroCondiciones: 'rotor 4, 60 rpm, 17 °C',
    tiempoCorteHoras: 5.83,
    lecturas: [
      { tiempoHoras: 0.0, tiempoMinutos: 0, ph: 6.2, indiceRefraccion: 10.2, temperaturaC: 26.1 },
      { tiempoHoras: 0.5, tiempoMinutos: 30, ph: 6.3, indiceRefraccion: 13.1, temperaturaC: 29.1 },
      { tiempoHoras: 1.5, tiempoMinutos: 90, ph: 5.8, indiceRefraccion: 12.2, temperaturaC: 32.5 },
      { tiempoHoras: 2.5, tiempoMinutos: 150, ph: 5.1, indiceRefraccion: 11.8, temperaturaC: 33.6 },
      { tiempoHoras: 3.5, tiempoMinutos: 210, ph: 4.9, indiceRefraccion: 6.4, temperaturaC: 32.5 },
      { tiempoHoras: 5.5, tiempoMinutos: 330, ph: 4.7, indiceRefraccion: 6.5, temperaturaC: 31.2 },
      { tiempoHoras: 5.83, tiempoMinutos: 350, ph: 4.6, indiceRefraccion: 5.9, temperaturaC: 32.4 },
    ],
  },
  {
    loteId: 'LOTE-CHV-40-7.5',
    temperaturaIncubacionC: 40,
    porcentajeInoculo: 7.5,
    masaInoculoG: 18.75,
    masaLecheG: 250,
    viscosidadFinalMpaS: 786.6,
    viscosimetroCondiciones: 'rotor 4, 60 rpm, 17 °C',
    tiempoCorteHoras: 5.50,
    lecturas: [
      { tiempoHoras: 0.0, tiempoMinutos: 0, ph: 6.4, indiceRefraccion: 12.0, temperaturaC: 25.0 },
      { tiempoHoras: 0.5, tiempoMinutos: 30, ph: 6.1, indiceRefraccion: 11.5, temperaturaC: 34.8 },
      { tiempoHoras: 1.5, tiempoMinutos: 90, ph: 5.3, indiceRefraccion: 12.0, temperaturaC: 32.4 },
      { tiempoHoras: 2.5, tiempoMinutos: 150, ph: 4.9, indiceRefraccion: 8.5, temperaturaC: 33.0 },
      { tiempoHoras: 3.5, tiempoMinutos: 210, ph: 4.7, indiceRefraccion: 7.6, temperaturaC: 31.4 },
      { tiempoHoras: 5.5, tiempoMinutos: 330, ph: 4.6, indiceRefraccion: 5.5, temperaturaC: 33.8 },
    ],
  },
  {
    loteId: 'LOTE-CHV-42-2.5',
    temperaturaIncubacionC: 42,
    porcentajeInoculo: 2.5,
    masaInoculoG: 6.25,
    masaLecheG: 250,
    viscosidadFinalMpaS: 1454,
    viscosimetroCondiciones: 'rotor 4, 60 rpm, 18 °C',
    tiempoCorteHoras: 6.75,
    lecturas: [
      { tiempoHoras: 0.0, tiempoMinutos: 0, ph: 6.2, indiceRefraccion: 10.2, temperaturaC: 26.1 },
      { tiempoHoras: 1.0, tiempoMinutos: 60, ph: 6.3, indiceRefraccion: 11.2, temperaturaC: 32.8 },
      { tiempoHoras: 2.25, tiempoMinutos: 135, ph: 6.0, indiceRefraccion: 11.8, temperaturaC: 34.6 },
      { tiempoHoras: 3.25, tiempoMinutos: 195, ph: 5.9, indiceRefraccion: 11.8, temperaturaC: 34.2 },
      { tiempoHoras: 4.25, tiempoMinutos: 255, ph: 5.8, indiceRefraccion: 5.7, temperaturaC: 34.2 },
      { tiempoHoras: 6.75, tiempoMinutos: 405, ph: 4.7, indiceRefraccion: 5.1, temperaturaC: 34.2 },
    ],
  },
  {
    loteId: 'LOTE-CHV-42-7.5',
    temperaturaIncubacionC: 42,
    porcentajeInoculo: 7.5,
    masaInoculoG: 18.75,
    masaLecheG: 250,
    viscosidadFinalMpaS: 2639,
    viscosimetroCondiciones: 'rotor 4, 60 rpm, 18 °C',
    tiempoCorteHoras: 4.25,
    optimo: true,
    lecturas: [
      { tiempoHoras: 0.0, tiempoMinutos: 0, ph: 6.2, indiceRefraccion: 10.2, temperaturaC: 26.1 },
      { tiempoHoras: 1.0, tiempoMinutos: 60, ph: 6.0, indiceRefraccion: 11.8, temperaturaC: 36.0 },
      { tiempoHoras: 2.25, tiempoMinutos: 135, ph: 5.3, indiceRefraccion: 12.6, temperaturaC: 36.2 },
      { tiempoHoras: 3.25, tiempoMinutos: 195, ph: 4.9, indiceRefraccion: 7.5, temperaturaC: 35.1 },
      { tiempoHoras: 4.25, tiempoMinutos: 255, ph: 4.6, indiceRefraccion: 5.7, temperaturaC: 35.1 },
    ],
  },
  {
    loteId: 'LOTE-CHV-44-2.5',
    temperaturaIncubacionC: 44,
    porcentajeInoculo: 2.5,
    masaInoculoG: 6.25,
    masaLecheG: 250,
    viscosidadFinalMpaS: 1185,
    viscosimetroCondiciones: 'rotor 4, 60 rpm, 15.5 °C',
    tiempoCorteHoras: 6.50,
    lecturas: [
      { tiempoHoras: 0.0, tiempoMinutos: 0, ph: 6.2, indiceRefraccion: 10.2, temperaturaC: 34.5 },
      { tiempoHoras: 1.0, tiempoMinutos: 60, ph: 6.4, indiceRefraccion: 13.3, temperaturaC: 37.5 },
      { tiempoHoras: 2.0, tiempoMinutos: 120, ph: 6.0, indiceRefraccion: 13.1, temperaturaC: 38.0 },
      { tiempoHoras: 3.0, tiempoMinutos: 180, ph: 5.6, indiceRefraccion: 12.9, temperaturaC: 37.9 },
      { tiempoHoras: 4.0, tiempoMinutos: 240, ph: 5.4, indiceRefraccion: 13.9, temperaturaC: 35.7 },
      { tiempoHoras: 5.5, tiempoMinutos: 330, ph: 4.9, indiceRefraccion: 7.9, temperaturaC: 35.7 },
      { tiempoHoras: 6.5, tiempoMinutos: 390, ph: 4.6, indiceRefraccion: 6.1, temperaturaC: 36.9 },
    ],
  },
  {
    loteId: 'LOTE-CHV-44-7.5',
    temperaturaIncubacionC: 44,
    porcentajeInoculo: 7.5,
    masaInoculoG: 18.75,
    masaLecheG: 250,
    viscosidadFinalMpaS: 796.5,
    viscosimetroCondiciones: 'rotor 4, 60 rpm, 15.5 °C',
    tiempoCorteHoras: 6.50,
    lecturas: [
      { tiempoHoras: 1.0, tiempoMinutos: 60, ph: 6.1, indiceRefraccion: 12.8, temperaturaC: 36.7 },
      { tiempoHoras: 2.0, tiempoMinutos: 120, ph: 5.6, indiceRefraccion: 13.1, temperaturaC: 39.5 },
      { tiempoHoras: 3.0, tiempoMinutos: 180, ph: 5.2, indiceRefraccion: 13.0, temperaturaC: 38.0 },
      { tiempoHoras: 4.0, tiempoMinutos: 240, ph: 5.0, indiceRefraccion: 13.6, temperaturaC: 38.4 },
      { tiempoHoras: 5.5, tiempoMinutos: 330, ph: 4.8, indiceRefraccion: 7.9, temperaturaC: 35.7 },
      { tiempoHoras: 6.5, tiempoMinutos: 390, ph: 4.6, indiceRefraccion: 7.4, temperaturaC: 36.9 },
    ],
  },
];

/**
 * Aplanar todas las muestras para entrenamiento y validación de regresión
 */
function getFlattenedDataset() {
  const points = [];
  for (const b of EXPERIMENTAL_BATCHES) {
    for (const lec of b.lecturas) {
      points.push({
        loteId: b.loteId,
        temperaturaIncubacionC: b.temperaturaIncubacionC,
        porcentajeInoculo: b.porcentajeInoculo,
        masaInoculoG: b.masaInoculoG,
        tiempoMinutos: lec.tiempoMinutos,
        tiempoHoras: lec.tiempoHoras,
        phReal: lec.ph,
        indiceRefraccionReal: lec.indiceRefraccion,
        temperaturaRealMedida: lec.temperaturaC,
        viscosidadFinalReal: b.viscosidadFinalMpaS,
      });
    }
  }
  return points;
}

module.exports = {
  EXPERIMENTAL_BATCHES,
  getFlattenedDataset,
};
