// =============================================================
// IPC ANUAL (DICIEMBRE A DICIEMBRE) — Fuente: INE
// =============================================================
// Estos son los datos de inflación oficial del INE, medida de
// diciembre a diciembre de cada año.
//
// CÓMO ACTUALIZAR:
//   Si el INE publica un nuevo dato, cambia o añade la línea.
//   El formato es:   año: variación_decimal
//   Ejemplo: 0.031 significa +3.1% de inflación ese año.
// =============================================================

const IPC_ANUAL_DIC = {
  2013:  0.003,   // +0.3%
  2014: -0.010,   // -1.0%  (deflación)
  2015:  0.000,   //  0.0%
  2016:  0.016,   // +1.6%
  2017:  0.011,   // +1.1%
  2018:  0.012,   // +1.2%
  2019:  0.008,   // +0.8%
  2020: -0.005,   // -0.5%  (deflación, año COVID)
  2021:  0.065,   // +6.5%  (subida energética)
  2022:  0.057,   // +5.7%
  2023:  0.031,   // +3.1%
  2024:  0.028,   // +2.8%
  2025:  0.029,   // +2.9%  (estimado)
  2026:  0.030,   // +3.0%  (estimado)
};
