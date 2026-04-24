// =============================================================
// PARÁMETROS FISCALES Y LABORALES POR AÑO
// =============================================================
// Este archivo contiene TODOS los valores numéricos que cambian
// año a año. Es el único archivo que necesitas editar si cambia
// la normativa (salvo los tramos IRPF, que están en irpf.js).
//
// ESTRUCTURA:
//   BASE_MAX          → Base máxima de cotización SS (€/año)
//   IRPF_MINIMO       → Mínimo personal del contribuyente (€/año)
//   MINIMO_EXENTO     → Umbral mínimo exento de retención (€/año)
//   GASTOS_FIJOS      → Deducción Art.19 por gastos de trabajo (€/año)
//   MEI               → Mecanismo Equidad Intergeneracional [empresa%, trabajador%]
//   SOLIDARIDAD       → Cuota solidaridad para salarios > base máx [t1%, t2%, t3%]
//   ART20             → Parámetros de la Reducción por Rendimientos del Trabajo
//   SS_TIPO_EMPRESA   → Tipo total SS a cargo de la empresa (constante)
//   SS_TIPO_TRABAJADOR→ Tipo total SS a cargo del trabajador (constante)
// =============================================================


// -------------------------------------------------------------
// SEGURIDAD SOCIAL — TIPOS DE COTIZACIÓN
// Estos tipos son constantes para todos los años del estudio.
// Desglose:
//   Comunes:   23.60% empresa / 4.70% trabajador
//   Desempleo:  5.50% empresa / 1.55% trabajador
//   FOGASA:     0.20% empresa / 0.00% trabajador
//   F. Profesional: 0.60% empresa / 0.10% trabajador
//   AT y EP:    1.50% empresa / 0.00% trabajador
// -------------------------------------------------------------
const SS_TIPO_EMPRESA    = 0.236 + 0.055 + 0.002 + 0.006 + 0.015; // = 0.314 (31.4%)
const SS_TIPO_TRABAJADOR = 0.047 + 0.0155 + 0.000 + 0.001 + 0.000; // = 0.0635 (6.35%)


// -------------------------------------------------------------
// BASE MÁXIMA DE COTIZACIÓN (€/año)
// El salario que supere este importe NO cotiza por SS normal.
// El exceso puede tributar por la Cuota de Solidaridad (desde 2025).
// -------------------------------------------------------------
const BASE_MAX = {
  2012: 39150.0,
  2013: 41108.4,
  2014: 43164.0,
  2015: 43272.0,
  2016: 43704.0,
  2017: 45014.4,
  2018: 45014.4,
  2019: 48841.2,
  2020: 48841.2,
  2021: 48841.2,
  2022: 49672.8,
  2023: 53946.0,
  2024: 56646.0,
  2025: 58914.0,
  2026: 61214.4,
};


// -------------------------------------------------------------
// MECANISMO DE EQUIDAD INTERGENERACIONAL (MEI)
// Cotización adicional introducida en 2023 para financiar pensiones.
// Formato: [% empresa, % trabajador]
// Aplicado sobre la base de cotización (igual que SS normal).
// -------------------------------------------------------------
const MEI = {
  2012: [0.0000, 0.0000],
  2013: [0.0000, 0.0000],
  2014: [0.0000, 0.0000],
  2015: [0.0000, 0.0000],
  2016: [0.0000, 0.0000],
  2017: [0.0000, 0.0000],
  2018: [0.0000, 0.0000],
  2019: [0.0000, 0.0000],
  2020: [0.0000, 0.0000],
  2021: [0.0000, 0.0000],
  2022: [0.0000, 0.0000],
  2023: [0.0050, 0.0010],  // 0.50% empresa / 0.10% trabajador
  2024: [0.0058, 0.0012],  // 0.58% / 0.12%
  2025: [0.0067, 0.0013],  // 0.67% / 0.13%
  2026: [0.0075, 0.0015],  // 0.75% / 0.15%
};


// -------------------------------------------------------------
// CUOTA DE SOLIDARIDAD (desde 2025)
// Para salarios que superan la base máxima de cotización.
// El exceso tributa en 3 tramos progresivos:
//   Tramo 1: exceso hasta el 10% de la base máx  → tipo solidaridad[0]
//   Tramo 2: exceso del 10% al 50% de la base máx → tipo solidaridad[1]
//   Tramo 3: exceso por encima del 50%             → tipo solidaridad[2]
// La cuota total se reparte: 5/6 empresa, 1/6 trabajador.
// Formato: [tipo_t1, tipo_t2, tipo_t3]  (decimales, ej: 0.0092 = 0.92%)
// Array vacío [] = no aplica ese año.
// -------------------------------------------------------------
const SOLIDARIDAD = {
  2012: [],
  2013: [],
  2014: [],
  2015: [],
  2016: [],
  2017: [],
  2018: [],
  2019: [],
  2020: [],
  2021: [],
  2022: [],
  2023: [],
  2024: [],
  2025: [0.0092, 0.0100, 0.0117],  // tipos para los 3 tramos
  2026: [0.0115, 0.0125, 0.0146],
};


// -------------------------------------------------------------
// MÍNIMO PERSONAL DEL CONTRIBUYENTE (€/año)
// Base sobre la que se aplica el primer tipo del IRPF para
// calcular la cuota que "protege" el mínimo vital.
// -------------------------------------------------------------
const IRPF_MINIMO = {
  2012: 5151,
  2013: 5151,
  2014: 5151,
  2015: 5550,
  2016: 5550,
  2017: 5550,
  2018: 5550,
  2019: 5550,
  2020: 5550,
  2021: 5550,
  2022: 5550,
  2023: 5550,
  2024: 5550,
  2025: 5550,
  2026: 5550,
};


// -------------------------------------------------------------
// UMBRAL MÍNIMO EXENTO DE RETENCIÓN (€/año)  — Art. 85.3 RIRPF
// Si el salario bruto anual es menor o igual a este importe,
// la retención no puede superar el 43% del exceso sobre el umbral.
// Límite: retención = min(cuota calculada,  (bruto - minimo_exento) * 43%)
// -------------------------------------------------------------
const MINIMO_EXENTO = {
  2012: 11162,
  2013: 11162,
  2014: 11162,
  2015: 12000,
  2016: 12000,
  2017: 12000,
  2018: 12643,
  2019: 14000,
  2020: 14000,
  2021: 14000,
  2022: 14000,
  2023: 15000,
  2024: 15876,
  2025: 15876,
  2026: 15876,
};


// -------------------------------------------------------------
// GASTOS DEDUCIBLES FIJOS — Art. 19 LIRPF (€/año)
// Deducción fija por ser trabajador por cuenta ajena.
// Se aplica sobre el rendimiento previo antes de calcular la
// Reducción por Rendimientos del Trabajo (Art. 20).
// -------------------------------------------------------------
const GASTOS_FIJOS = {
  2012: 0,
  2013: 0,
  2014: 0,
  2015: 2000,
  2016: 2000,
  2017: 2000,
  2018: 2000,
  2019: 2000,
  2020: 2000,
  2021: 2000,
  2022: 2000,
  2023: 2000,
  2024: 2000,
  2025: 2000,
  2026: 2000,
};


// -------------------------------------------------------------
// REDUCCIÓN POR RENDIMIENTOS DEL TRABAJO — Art. 20 LIRPF
// Se aplica a rentas bajas. La reducción disminuye progresivamente
// a medida que sube el salario, hasta desaparecer.
//
// Parámetros por año:
//   umbralInf  → por debajo de este rendimiento, se aplica reducción máxima
//   redMax     → reducción máxima (en el umbral inferior)
//   umbralSup  → por encima de este rendimiento, la reducción es cero (o mínima)
//   redMin     → reducción mínima (aplicable por encima del umbral sup, solo hasta 2014)
//
// El rendimiento de referencia es el PREVIO (bruto - SS trabajador),
// ANTES de aplicar gastos fijos.
//
// NOTA: 2018 es un año transitorio (media entre fórmulas 2017 y 2019).
// NOTA: 2024+ usa una fórmula de 3 segmentos, ver nomina.js para la lógica.
// -------------------------------------------------------------
const ART20 = {
  // Hasta 2014
  2012: { umbralInf: 9180,  redMax: 4080, umbralSup: 13260, redMin: 2652 },
  2013: { umbralInf: 9180,  redMax: 4080, umbralSup: 13260, redMin: 2652 },
  2014: { umbralInf: 9180,  redMax: 4080, umbralSup: 13260, redMin: 2652 },
  // 2015-2017
  2015: { umbralInf: 11250, redMax: 3700, umbralSup: 14450, redMin: 0 },
  2016: { umbralInf: 11250, redMax: 3700, umbralSup: 14450, redMin: 0 },
  2017: { umbralInf: 11250, redMax: 3700, umbralSup: 14450, redMin: 0 },
  // 2018: transitorio (ver nomina.js — se calcula como media de 2017 y 2019)
  2018: { transitorio: true },
  // 2019-2022
  2019: { umbralInf: 13115, redMax: 5565, umbralSup: 16825, redMin: 0 },
  2020: { umbralInf: 13115, redMax: 5565, umbralSup: 16825, redMin: 0 },
  2021: { umbralInf: 13115, redMax: 5565, umbralSup: 16825, redMin: 0 },
  2022: { umbralInf: 13115, redMax: 5565, umbralSup: 16825, redMin: 0 },
  // 2023
  2023: { umbralInf: 14047.5, redMax: 6498, umbralSup: 19747.5, redMin: 0 },
  // 2024+ (3 segmentos, parámetros usados en nomina.js)
  2024: { umbralInf: 14852, redMax: 7302, umbral2: 17673.52, red2: 2364.34, umbralSup: 19747.5, redMin: 0 },
  2025: { umbralInf: 14852, redMax: 7302, umbral2: 17673.52, red2: 2364.34, umbralSup: 19747.5, redMin: 0 },
  2026: { umbralInf: 14852, redMax: 7302, umbral2: 17673.52, red2: 2364.34, umbralSup: 19747.5, redMin: 0 },
};


// -------------------------------------------------------------
// DEDUCCIÓN POR SALARIO MÍNIMO INTERPROFESIONAL (SMI)
// Deducción en cuota aplicable a rentas próximas al SMI.
// Formato: { hasta: importe_bruto, deduccion_max: €, reduccion_por_euro: % }
// Solo aplicable en 2025 y 2026.
// -------------------------------------------------------------
const DEDUCCION_SMI = {
  // Años sin deducción SMI: devuelven 0 (ver nomina.js)
  2025: { umbralFijo: 16576, deduccionMax: 340,    umbralFin: 18276 },
  2026: { umbralFijo: 17094, deduccionMax: 590.89, umbralFin: Infinity }, // phaseout: 0.20€ por € de más
};
