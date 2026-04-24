// =============================================================
// MOTOR DE CÁLCULO DE NÓMINA
// =============================================================
// Traduce exactamente la lógica del script Python original.
// Los DATOS (tipos, tramos, mínimos...) están en js/datos/.
// Las FÓRMULAS están aquí.
//
// Función principal: calcularNomina(bruto, anio)
//   → Devuelve un objeto con todos los conceptos de la nómina.
// =============================================================


// -------------------------------------------------------------
// REDUCCIÓN POR RENDIMIENTOS DEL TRABAJO (Art. 20 LIRPF)
// Función auxiliar. La base de entrada es el rendimiento PREVIO
// (bruto - SS trabajador), ANTES de restar gastos fijos.
// -------------------------------------------------------------
function calcularReduccionTrabajo(rendimientoPrevio, anio) {
  const p = ART20[anio];

  if (anio <= 2014) {
    if (rendimientoPrevio <= p.umbralInf) return p.redMax;
    if (rendimientoPrevio <= p.umbralSup) return p.redMax - 0.35 * (rendimientoPrevio - p.umbralInf);
    return p.redMin;
  }

  if (anio >= 2015 && anio <= 2017) {
    if (rendimientoPrevio <= p.umbralInf) return p.redMax;
    if (rendimientoPrevio <= p.umbralSup) return Math.max(0, p.redMax - 1.15625 * (rendimientoPrevio - p.umbralInf));
    return 0;
  }

  if (anio === 2018) {
    // Régimen transitorio: media aritmética de la fórmula pre (2017) y post (2019)
    const pre = rendimientoPrevio <= 11250 ? 3700
      : (rendimientoPrevio <= 14450 ? Math.max(0, 3700 - 1.15625 * (rendimientoPrevio - 11250)) : 0);
    const post = rendimientoPrevio <= 13115 ? 5565
      : (rendimientoPrevio <= 16825 ? Math.max(0, 5565 - 1.5 * (rendimientoPrevio - 13115)) : 0);
    return (pre / 2) + (post / 2);
  }

  if (anio >= 2019 && anio <= 2022) {
    if (rendimientoPrevio <= p.umbralInf) return p.redMax;
    if (rendimientoPrevio <= p.umbralSup) return Math.max(0, p.redMax - 1.5 * (rendimientoPrevio - p.umbralInf));
    return 0;
  }

  if (anio === 2023) {
    if (rendimientoPrevio <= p.umbralInf) return p.redMax;
    if (rendimientoPrevio <= p.umbralSup) return Math.max(0, p.redMax - 1.14 * (rendimientoPrevio - p.umbralInf));
    return 0;
  }

  if (anio >= 2024) {
    // Fórmula con 3 segmentos (desde 2024)
    if (rendimientoPrevio <= p.umbralInf) return p.redMax;
    if (rendimientoPrevio <= p.umbral2)   return p.redMax - 1.75 * (rendimientoPrevio - p.umbralInf);
    if (rendimientoPrevio <= p.umbralSup) return Math.max(0, p.red2 - 1.14 * (rendimientoPrevio - p.umbral2));
    return 0;
  }

  return 0;
}


// -------------------------------------------------------------
// DEDUCCIÓN POR SMI (Salario Mínimo Interprofesional)
// Solo aplica en 2025 y 2026. En otros años devuelve 0.
// -------------------------------------------------------------
function calcularDeduccionSMI(bruto, anio) {
  if (anio === 2025) {
    const d = DEDUCCION_SMI[2025];
    if (bruto <= d.umbralFijo) return d.deduccionMax;
    if (bruto <= d.umbralFin)  return Math.max(0, d.deduccionMax - 0.20 * (bruto - d.umbralFijo));
    return 0;
  }
  if (anio === 2026) {
    const d = DEDUCCION_SMI[2026];
    if (bruto <= d.umbralFijo) return d.deduccionMax;
    return Math.max(0, d.deduccionMax - 0.20 * (bruto - d.umbralFijo));
  }
  return 0;
}


// -------------------------------------------------------------
// FUNCIÓN PRINCIPAL: calcularNomina(bruto, anio)
// Reproduce exactamente el cálculo del script Python original.
// -------------------------------------------------------------
function calcularNomina(bruto, anio) {
  const baseMax       = BASE_MAX[anio];
  const tramos        = TRAMOS_IRPF[anio];
  const irpfMinimo    = IRPF_MINIMO[anio];
  const minimoExento  = MINIMO_EXENTO[anio];
  const gastosFijos   = GASTOS_FIJOS[anio];
  const mei           = MEI[anio];
  const solidaridad   = SOLIDARIDAD[anio];

  // ── PASO 1: SEGURIDAD SOCIAL ──────────────────────────────
  const baseCotizacion = Math.min(bruto, baseMax);
  const excesoBase     = Math.max(0, bruto - baseMax);

  const tipoEmpresa    = SS_TIPO_EMPRESA    + mei[0];
  const tipoTrabajador = SS_TIPO_TRABAJADOR + mei[1];

  let cotEmpresa    = baseCotizacion * tipoEmpresa;
  let cotTrabajador = baseCotizacion * tipoTrabajador;

  // Cuota de Solidaridad (desde 2025, para salarios > base máxima)
  let cuotaSolidaridadTotal = 0;
  if (solidaridad.length > 0 && excesoBase > 0) {
    const t1Lim = baseMax * 0.10;
    const t2Lim = baseMax * 0.50;
    const ex1   = Math.min(excesoBase, t1Lim);
    const ex2   = Math.min(Math.max(0, excesoBase - t1Lim), t2Lim - t1Lim);
    const ex3   = Math.max(0, excesoBase - t2Lim);
    cuotaSolidaridadTotal = ex1 * solidaridad[0] + ex2 * solidaridad[1] + ex3 * solidaridad[2];
    cotEmpresa    += cuotaSolidaridadTotal * (5 / 6);
    cotTrabajador += cuotaSolidaridadTotal * (1 / 6);
  }

  const costeLaboralTotal = bruto + cotEmpresa;

  // ── PASO 2: BASE IMPONIBLE DEL IRPF ──────────────────────
  const rendimientoPrevio = bruto - cotTrabajador;
  const redTrabajo        = calcularReduccionTrabajo(rendimientoPrevio, anio);
  const rendimientoNeto   = Math.max(0, rendimientoPrevio - gastosFijos);
  const baseImponible     = Math.max(0, rendimientoNeto - redTrabajo);

  // ── PASO 3: CUOTA ÍNTEGRA (suma por tramos) ───────────────
  let cuotaIntegra = 0;
  let limAnt = 0;
  const cuotasPorTramo = [];

  for (const [lim, tipo] of tramos) {
    if (baseImponible > lim) {
      const cuota = (lim - limAnt) * tipo;
      cuotasPorTramo.push({ hasta: lim, tipo, cuota });
      cuotaIntegra += cuota;
      limAnt = lim;
    } else {
      const cuota = (baseImponible - limAnt) * tipo;
      cuotasPorTramo.push({ hasta: lim, tipo, cuota });
      cuotaIntegra += cuota;
      break;
    }
  }

  // ── PASO 4: CUOTA LÍQUIDA ─────────────────────────────────
  const cuotaMinimo        = irpfMinimo * tramos[0][1]; // mínimo personal × tipo primer tramo
  const cuotaTeorica       = Math.max(0, cuotaIntegra - cuotaMinimo);
  const deduccionSMI       = calcularDeduccionSMI(bruto, anio);
  const cuotaConDeduccion  = Math.max(0, cuotaTeorica - deduccionSMI);

  // ── PASO 5: LÍMITE LEGAL DE RETENCIÓN (Art. 85.3 RIRPF) ──
  const limiteRetencion = Math.max(0, (bruto - minimoExento) * 0.43);
  const irpfFinal       = Math.min(cuotaConDeduccion, limiteRetencion);

  // ── RESULTADO ─────────────────────────────────────────────
  const salarioNeto = bruto - cotTrabajador - irpfFinal;

  return {
    bruto,
    anio,

    // Seguridad Social
    baseCotizacion:         round2(baseCotizacion),
    cotEmpresa:             round2(cotEmpresa),
    cotTrabajador:          round2(cotTrabajador),
    cuotaSolidaridad:       round2(cuotaSolidaridadTotal),
    costeLaboralTotal:      round2(costeLaboralTotal),

    // IRPF — base
    rendimientoPrevio:      round2(rendimientoPrevio),
    gastosFijos:            gastosFijos,
    redTrabajo:             round2(redTrabajo),
    baseImponible:          round2(baseImponible),

    // IRPF — cuota
    cuotasPorTramo,
    cuotaIntegra:           round2(cuotaIntegra),
    cuotaMinimo:            round2(cuotaMinimo),
    cuotaTeorica:           round2(cuotaTeorica),
    deduccionSMI:           round2(deduccionSMI),
    cuotaConDeduccion:      round2(cuotaConDeduccion),
    limiteRetencion:        round2(limiteRetencion),
    irpfFinal:              round2(irpfFinal),

    // Resultado final
    salarioNeto:            round2(salarioNeto),

    // Tipos efectivos
    tipoEfectivoIRPF:       bruto > 0 ? round2((irpfFinal / bruto) * 100) : 0,
    tipoEfectivoSS:         bruto > 0 ? round2((cotTrabajador / bruto) * 100) : 0,
    tipoEfectivoTotal:      bruto > 0 ? round2(((irpfFinal + cotTrabajador) / bruto) * 100) : 0,
  };
}

// Utilidad: redondeo a 2 decimales
function round2(n) {
  return Math.round(n * 100) / 100;
}
