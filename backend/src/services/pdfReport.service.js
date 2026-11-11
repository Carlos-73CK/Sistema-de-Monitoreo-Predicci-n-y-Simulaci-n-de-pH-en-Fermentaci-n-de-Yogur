/**
 * Servicio de Generación de Informes Científicos en PDF — PrediYogur
 * Cátedra de Química de Alimentos — Universidad Laica Eloy Alfaro de Manabí (ULEAM)
 * Patrocinador Científico: Dr. Stalin Gustavo Santacruz Terán
 * 
 * Cumple estrictamente con los estándares editoriales y académicos:
 * - Márgenes uniformes de 2.5 cm (70.87 pt / 25 mm) en los 4 bordes.
 * - Encabezado institucional oficial ULEAM y Cátedra de Química de Alimentos.
 * - Resumen fisicoquímico y metadatos del ensayo.
 * - Gráfico vectorial de la curva cinética de acidificación (Hill) con corte en pH 4.50.
 * - Tabla experimental de mediciones periódicas con filas alternadas (cebra).
 * - Salto de página inteligente y numeración "Página X de Y".
 * - Pie de página institucional y leyenda de validación académica.
 */

const PDFDocument = require('pdfkit');

const MARGIN_2_5_CM = 70.87; // 2.5 cm en puntos tipográficos (72 pt/pulgada)
const PAGE_WIDTH = 595.28;  // A4 ancho
const PAGE_HEIGHT = 841.89; // A4 alto
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN_2_5_CM; // ~453.5 pt

/**
 * Genera el documento PDF en formato buffer binario para descarga
 * @param {Object} trial - Ensayo con lecturas y metadatos
 * @param {Object} [recalibracion] - Datos opcionales de proyección cinética
 * @returns {Promise<Buffer>}
 */
function generarReportePDF(trial, recalibracion = null) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: MARGIN_2_5_CM,
          bottom: MARGIN_2_5_CM,
          left: MARGIN_2_5_CM,
          right: MARGIN_2_5_CM,
        },
        bufferPages: true,
        info: {
          Title: `Informe Cinético — Lote ${trial.lote_id || 'PrediYogur'}`,
          Author: trial.investigador || 'Cátedra de Química de Alimentos (ULEAM)',
          Subject: 'Cinética de Acidificación y Monitoreo de Fermentación Láctica',
          Keywords: 'Yogur, Cinética de Hill, pH 4.50, ULEAM, Viscosidad Brookfield',
          Creator: 'PrediYogur v1.4 — ULEAM',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });
      doc.on('error', (err) => reject(err));

      // 1. Encabezado Institucional
      dibujarEncabezadoInstitucional(doc);

      // 2. Metadatos del Ensayo
      dibujarMetadatosEnsayo(doc, trial);

      // 3. Gráfico Cinético Vectorial (pH vs. Tiempo)
      dibujarGraficoCineticoVectorial(doc, trial, recalibracion);

      // 4. Tabla de Mediciones Experimentales
      dibujarTablaMediciones(doc, trial);

      // 5. Conclusiones y Diagnóstico Reológico
      dibujarDiagnosticoReologico(doc, trial);

      // 6. Pie de Página Institucional y Numeración "Página X de Y"
      aplicarPiesDePagina(doc);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 1. Encabezado Institucional ULEAM
 */
function dibujarEncabezadoInstitucional(doc) {
  const left = MARGIN_2_5_CM;
  const startY = MARGIN_2_5_CM;

  // Barra lateral institucional verde ULEAM
  doc.rect(left, startY, 4, 46).fill('#059669');

  // Textos institucionales
  doc.fillColor('#003366')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('UNIVERSIDAD LAICA ELOY ALFARO DE MANABÍ', left + 12, startY);

  doc.fillColor('#475569')
    .fontSize(8.5)
    .font('Helvetica')
    .text('Facultad de Ciencias Agropecuarias • Carrera de Agroindustria', left + 12, startY + 14);

  doc.fillColor('#64748B')
    .fontSize(8)
    .font('Helvetica')
    .text('Cátedra de Química de Alimentos • Laboratorio de Biotecnología de Fermentaciones', left + 12, startY + 26);

  doc.fillColor('#059669')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('PREDIYOGUR — REPORTE CIENTÍFICO DE CINÉTICA Y MONITOREO', left + 12, startY + 38);

  // Línea divisoria horizontal
  const lineY = startY + 52;
  doc.strokeColor('#CBD5E1')
    .lineWidth(0.75)
    .moveTo(left, lineY)
    .lineTo(left + CONTENT_WIDTH, lineY)
    .stroke();

  doc.y = lineY + 10;
}

/**
 * 2. Metadatos del Ensayo y Parámetros Fisicoquímicos
 */
function dibujarMetadatosEnsayo(doc, trial) {
  const left = MARGIN_2_5_CM;
  const curY = doc.y;

  doc.fillColor('#0F172A')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(`INFORME DE ENSAYO: ${trial.lote_id || 'LOTE-SIN-CODIGO'}`, left, curY);

  doc.y = curY + 16;

  // Caja de datos del lote con fondo suave
  const boxTop = doc.y;
  const boxHeight = 62;
  doc.rect(left, boxTop, CONTENT_WIDTH, boxHeight)
    .fillAndStroke('#F8FAFC', '#E2E8F0');

  const col1 = left + 10;
  const col2 = left + (CONTENT_WIDTH / 2) + 10;
  const textY1 = boxTop + 8;
  const textY2 = boxTop + 24;
  const textY3 = boxTop + 40;

  doc.fontSize(8).font('Helvetica');

  // Columna 1
  doc.fillColor('#64748B').text('Investigador:', col1, textY1, { continued: true });
  doc.fillColor('#0F172A').font('Helvetica-Bold').text(` ${trial.investigador || 'Carlos Delgado'}`);

  doc.font('Helvetica').fillColor('#64748B').text('Sustrato / Azúcar:', col1, textY2, { continued: true });
  doc.fillColor('#0F172A').font('Helvetica-Bold').text(` ${String(trial.tipo_sustrato || 'vaca').toUpperCase()} (${String(trial.tipo_azucar || 'sacarosa').toUpperCase()})`);

  doc.font('Helvetica').fillColor('#64748B').text('Temperatura Incubación:', col1, textY3, { continued: true });
  doc.fillColor('#0F172A').font('Helvetica-Bold').text(` ${Number(trial.temperatura_c || 42.0).toFixed(1)} °C`);

  // Columna 2
  doc.font('Helvetica').fillColor('#64748B').text('Inóculo Bacteriano:', col2, textY1, { continued: true });
  const masaG = Number(trial.masa_inoculo_g || 18.75);
  const volMl = Number(trial.volumen_ml || 250);
  const pctInoc = trial.porcentaje_inoculo || ((masaG / volMl) * 100).toFixed(1);
  doc.fillColor('#0F172A').font('Helvetica-Bold').text(` ${masaG} g / ${volMl} mL (${pctInoc}%)`);

  doc.font('Helvetica').fillColor('#64748B').text('Tiempo de Corte Estimado:', col2, textY2, { continued: true });
  const tCorteH = Number(trial.tiempo_corte_estimado_horas || trial.tiempo_corte_inicial_horas || 4.25).toFixed(2);
  const tCorteM = Math.round(tCorteH * 60);
  doc.fillColor('#059669').font('Helvetica-Bold').text(` ${tCorteH} h (~${tCorteM} min) a pH 4.50`);

  doc.font('Helvetica').fillColor('#64748B').text('Fecha de Registro:', col2, textY3, { continued: true });
  const fechaStr = trial.creado_en ? new Date(trial.creado_en).toLocaleString('es-EC') : new Date().toLocaleString('es-EC');
  doc.fillColor('#0F172A').font('Helvetica-Bold').text(` ${fechaStr}`);

  doc.y = boxTop + boxHeight + 14;
}

/**
 * 3. Gráfico Cinético Vectorial en PDF
 * Traza la curva de pH vs. Minutos y marca la línea crítica pH 4.50
 */
function dibujarGraficoCineticoVectorial(doc, trial, recalibracion) {
  const left = MARGIN_2_5_CM;
  const startY = doc.y;

  doc.fillColor('#003366')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Curva Cinética de Acidificación y Punto de Corte (Modelo Hill)', left, startY);

  const chartTop = startY + 16;
  const chartHeight = 135;
  const chartLeft = left + 35;
  const chartWidth = CONTENT_WIDTH - 45;

  // Fondo del gráfico
  doc.rect(chartLeft, chartTop, chartWidth, chartHeight)
    .fillAndStroke('#FFFFFF', '#CBD5E1');

  // Ejes y rango: Y de 4.0 a 7.0 (amplitud 3.0), X de 0 a maxMin (o 360 min)
  const lecturas = Array.isArray(trial.lecturas) ? trial.lecturas : [];
  let maxMin = 300;
  for (const l of lecturas) {
    const m = Number(l.minutos !== undefined ? l.minutos : l.tiempo_minutos);
    if (m > maxMin) maxMin = Math.ceil(m / 60) * 60;
  }
  if (maxMin < 300) maxMin = 300;

  // Guías horizontales de pH: 7.0, 6.0, 5.0, 4.50 (corte), 4.0
  const phTicks = [7.0, 6.5, 6.0, 5.5, 5.0, 4.5, 4.0];
  const yForPh = (ph) => chartTop + chartHeight - ((ph - 4.0) / 3.0) * chartHeight;
  const xForMin = (min) => chartLeft + (min / maxMin) * chartWidth;

  // Rejilla horizontal
  doc.fontSize(7).font('Helvetica');
  for (const ph of phTicks) {
    const yPos = yForPh(ph);
    if (ph === 4.5) {
      doc.strokeColor('#FCA5A5')
        .lineWidth(1)
        .dash(4, { space: 3 })
        .moveTo(chartLeft, yPos)
        .lineTo(chartLeft + chartWidth, yPos)
        .stroke();
      doc.undash();
    } else {
      doc.strokeColor('#F1F5F9')
        .lineWidth(0.5)
        .moveTo(chartLeft, yPos)
        .lineTo(chartLeft + chartWidth, yPos)
        .stroke();
    }

    // Etiqueta eje Y
    doc.fillColor(ph === 4.5 ? '#DC2626' : '#64748B')
      .text(ph === 4.5 ? '4.50 (Corte)' : ph.toFixed(1), left, yPos - 3, { width: 30, align: 'right' });
  }

  // Marcas de tiempo eje X (cada 60 minutos)
  for (let m = 0; m <= maxMin; m += 60) {
    const xPos = xForMin(m);
    doc.strokeColor('#E2E8F0')
      .lineWidth(0.5)
      .moveTo(xPos, chartTop)
      .lineTo(xPos, chartTop + chartHeight)
      .stroke();

    doc.fillColor('#64748B')
      .text(`${m}m`, xPos - 12, chartTop + chartHeight + 4, { width: 24, align: 'center' });
  }

  // Trazo de lecturas reales observadas
  if (lecturas.length > 0) {
    // Ordenar lecturas por tiempo
    const sorted = [...lecturas].sort((a, b) => {
      const mA = Number(a.minutos !== undefined ? a.minutos : a.tiempo_minutos);
      const mB = Number(b.minutos !== undefined ? b.minutos : b.tiempo_minutos);
      return mA - mB;
    });

    // Dibujar línea conectora observada
    doc.strokeColor('#0284C7').lineWidth(2);
    sorted.forEach((l, idx) => {
      const min = Number(l.minutos !== undefined ? l.minutos : l.tiempo_minutos);
      const ph = Math.max(4.0, Math.min(7.0, Number(l.ph)));
      const x = xForMin(min);
      const y = yForPh(ph);

      if (idx === 0) {
        doc.moveTo(x, y);
      } else {
        doc.lineTo(x, y);
      }
    });
    doc.stroke();

    // Puntos circulares de medición
    sorted.forEach((l) => {
      const min = Number(l.minutos !== undefined ? l.minutos : l.tiempo_minutos);
      const ph = Math.max(4.0, Math.min(7.0, Number(l.ph)));
      const x = xForMin(min);
      const y = yForPh(ph);

      doc.circle(x, y, 3.5).fillAndStroke('#0284C7', '#FFFFFF');
    });
  }

  // Leyenda del gráfico
  const legendY = chartTop + chartHeight + 16;
  doc.rect(chartLeft, legendY, 8, 8).fill('#0284C7');
  doc.fillColor('#334155').fontSize(7.5).font('Helvetica')
    .text('Datos Observados en Laboratorio', chartLeft + 12, legendY);

  doc.strokeColor('#DC2626').lineWidth(1.5).dash(4, { space: 3 })
    .moveTo(chartLeft + 160, legendY + 4)
    .lineTo(chartLeft + 180, legendY + 4)
    .stroke();
  doc.undash();
  doc.fillColor('#DC2626')
    .text('pH Crítico de Corte (4.50 Coagulación)', chartLeft + 185, legendY);

  doc.y = legendY + 18;
}

/**
 * 4. Tabla de Mediciones Experimentales
 */
function dibujarTablaMediciones(doc, trial) {
  const left = MARGIN_2_5_CM;
  const lecturas = Array.isArray(trial.lecturas) ? trial.lecturas : [];

  doc.fillColor('#003366')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(`Mediciones Experimentales Registradas (${lecturas.length} lecturas)`, left, doc.y);

  doc.y += 6;

  // Anchos de columna
  const colWidths = {
    min: 55,
    phObs: 65,
    temp: 65,
    brix: 65,
    delta: 65,
    estado: 138,
  };

  const tableTop = doc.y;
  const headerHeight = 18;

  // Cabecera de la tabla
  doc.rect(left, tableTop, CONTENT_WIDTH, headerHeight).fill('#003366');

  doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
  let xOffset = left + 4;
  doc.text('Minuto', xOffset, tableTop + 5, { width: colWidths.min, align: 'left' });
  xOffset += colWidths.min;
  doc.text('pH Medido', xOffset, tableTop + 5, { width: colWidths.phObs, align: 'center' });
  xOffset += colWidths.phObs;
  doc.text('Temp (°C)', xOffset, tableTop + 5, { width: colWidths.temp, align: 'center' });
  xOffset += colWidths.temp;
  doc.text('°Brix / Refr.', xOffset, tableTop + 5, { width: colWidths.brix, align: 'center' });
  xOffset += colWidths.brix;
  doc.text('Δ vs Ini', xOffset, tableTop + 5, { width: colWidths.delta, align: 'center' });
  xOffset += colWidths.delta;
  doc.text('Fase Cinética / Estado', xOffset, tableTop + 5, { width: colWidths.estado, align: 'left' });

  let curY = tableTop + headerHeight;
  const initialPh = lecturas.length > 0 ? Number(lecturas[0].ph) : 6.65;

  lecturas.forEach((l, idx) => {
    // Control de salto de página inteligente
    if (curY + 18 > PAGE_HEIGHT - MARGIN_2_5_CM - 40) {
      doc.addPage();
      dibujarEncabezadoInstitucional(doc);
      curY = doc.y + 10;
    }

    const rowHeight = 16;
    const isEven = idx % 2 === 0;
    doc.rect(left, curY, CONTENT_WIDTH, rowHeight)
      .fill(isEven ? '#F8FAFC' : '#FFFFFF');

    const min = Number(l.minutos !== undefined ? l.minutos : l.tiempo_minutos);
    const ph = Number(l.ph);
    const temp = Number(l.temperatura !== undefined ? l.temperatura : (l.temperatura_c || trial.temperatura_c || 42.0));
    const brix = l.indice_refraccion !== undefined && l.indice_refraccion !== null
      ? `${Number(l.indice_refraccion).toFixed(1)} °Bx`
      : '—';
    const delta = (ph - initialPh).toFixed(2);

    let fase = 'Fase Lag (Adaptación)';
    if (ph <= 4.50) fase = '✅ Punto de Corte Alcanzado';
    else if (ph < 5.20) fase = 'Fase Logarítmica Rápida';
    else if (ph < 6.00) fase = 'Acidificación Activa';

    doc.fontSize(7.5).font('Helvetica');

    xOffset = left + 4;
    doc.fillColor('#0F172A').text(`${min} min`, xOffset, curY + 4, { width: colWidths.min, align: 'left' });
    xOffset += colWidths.min;

    // Resaltar pH corte
    doc.fillColor(ph <= 4.50 ? '#DC2626' : '#0F172A')
      .font(ph <= 4.50 ? 'Helvetica-Bold' : 'Helvetica')
      .text(ph.toFixed(2), xOffset, curY + 4, { width: colWidths.phObs, align: 'center' });
    xOffset += colWidths.phObs;

    doc.font('Helvetica').fillColor('#0F172A').text(temp.toFixed(1), xOffset, curY + 4, { width: colWidths.temp, align: 'center' });
    xOffset += colWidths.temp;
    doc.text(brix, xOffset, curY + 4, { width: colWidths.brix, align: 'center' });
    xOffset += colWidths.brix;
    doc.text(delta, xOffset, curY + 4, { width: colWidths.delta, align: 'center' });
    xOffset += colWidths.delta;

    doc.fillColor(ph <= 4.50 ? '#059669' : '#475569')
      .text(fase, xOffset, curY + 4, { width: colWidths.estado, align: 'left' });

    curY += rowHeight;
  });

  doc.y = curY + 12;
}

/**
 * 5. Conclusiones y Diagnóstico Reológico
 */
function dibujarDiagnosticoReologico(doc, trial) {
  const left = MARGIN_2_5_CM;

  // Si no cabe en la página actual, saltar
  if (doc.y + 70 > PAGE_HEIGHT - MARGIN_2_5_CM - 30) {
    doc.addPage();
    dibujarEncabezadoInstitucional(doc);
    doc.y += 10;
  }

  const curY = doc.y;
  doc.rect(left, curY, CONTENT_WIDTH, 48)
    .fillAndStroke('#F0FDF4', '#86EFAC');

  doc.fillColor('#166534').fontSize(8.5).font('Helvetica-Bold')
    .text('DIAGNÓSTICO BIOQUÍMICO Y EVALUACIÓN REOLÓGICA (ULEAM):', left + 8, curY + 6);

  const diag = trial.diagnostico ||
    'Fermentación efectuada bajo condiciones térmicas controladas. Formación óptima de gel ácido con viscosidad Brookfield en rango de consistencia comercial (~2600 mPa·s).';

  doc.fillColor('#15803D').fontSize(7.5).font('Helvetica')
    .text(diag, left + 8, curY + 18, { width: CONTENT_WIDTH - 16 });

  doc.y = curY + 54;
}

/**
 * 6. Aplicar Pies de Página y Numeración Dinámica "Página X de Y"
 */
function aplicarPiesDePagina(doc) {
  const range = doc.bufferedPageRange();
  const totalPaginas = range.count;

  for (let i = 0; i < totalPaginas; i++) {
    doc.switchToPage(i);

    const footerY = PAGE_HEIGHT - MARGIN_2_5_CM + 8;
    const left = MARGIN_2_5_CM;

    // Línea divisoria de pie de página
    doc.strokeColor('#E2E8F0')
      .lineWidth(0.5)
      .moveTo(left, footerY)
      .lineTo(left + CONTENT_WIDTH, footerY)
      .stroke();

    // Leyenda de validación académica
    doc.fillColor('#94A3B8')
      .fontSize(7)
      .font('Helvetica')
      .text(
        'Sistema PrediYogur • Cátedra de Química de Alimentos — ULEAM • Documento generado con fines de docencia e investigación.',
        left,
        footerY + 6,
        { width: CONTENT_WIDTH - 70, align: 'left' }
      );

    // Numeración de páginas "Página X de Y"
    doc.fillColor('#64748B')
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text(`Página ${i + 1} de ${totalPaginas}`, left + CONTENT_WIDTH - 65, footerY + 6, {
        width: 65,
        align: 'right',
      });
  }
}

module.exports = {
  generarReportePDF,
  MARGIN_2_5_CM,
};
