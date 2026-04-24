// =============================================================
// MOTOR: INFLACIÓN ACUMULADA
// =============================================================
// Calcula el multiplicador de inflación acumulada entre dos años.
// Usa los datos de IPC_ANUAL_DIC definidos en js/datos/ipc.js.
//
// Ejemplo: inflacionAcumulada(2015, 2026) devuelve ~1.27
// lo que significa que algo que valía 100€ en 2015 equivale
// a ~127€ en 2026 en términos de poder adquisitivo.
// =============================================================

/**
 * Calcula el multiplicador de inflación acumulada de anioBase a anioDestino.
 * @param {number} anioBase     - Año de partida
 * @param {number} anioDestino  - Año de llegada (por defecto 2026)
 * @returns {number} multiplicador (ej: 1.27 = +27% de inflación acumulada)
 */
function inflacionAcumulada(anioBase, anioDestino = 2026) {
  if (anioBase === anioDestino) return 1.0;
  let multiplicador = 1.0;
  for (let anio = anioBase + 1; anio <= anioDestino; anio++) {
    multiplicador *= (1 + IPC_ANUAL_DIC[anio]);
  }
  return multiplicador;
}

// Precalculamos el multiplicador de cada año a 2026
// (igual que el script Python hace con INFLACION_A_2026)
const INFLACION_A_2026 = {};
for (let anio = 2012; anio <= 2026; anio++) {
  INFLACION_A_2026[anio] = inflacionAcumulada(anio, 2026);
}
