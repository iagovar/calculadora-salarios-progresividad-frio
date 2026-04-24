// =============================================================
// LÓGICA DE LA INTERFAZ
// =============================================================
// Este archivo controla lo que ves en pantalla.
// Si solo quieres cambiar números/normativa → edita js/datos/
// Si quieres cambiar las fórmulas → edita js/calculos/
// =============================================================

// ── AÑOS DISPONIBLES ─────────────────────────────────────────
const ANIOS = Array.from({ length: 15 }, (_, i) => 2012 + i); // 2012 … 2026

// ── UTILIDADES DE FORMATO ────────────────────────────────────
const eur = (n, d = 2) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const pct = (n, d = 2) => `${n.toFixed(d)} %`;

// ─────────────────────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
}

// ─────────────────────────────────────────────────────────────
// TAB 1: CALCULADORA DE NÓMINA
// ─────────────────────────────────────────────────────────────
function initCalculadora() {
  const inputBruto = document.getElementById('calc-bruto');
  const selectAnio = document.getElementById('calc-anio');

  // Poblar selector de años
  ANIOS.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    if (a === 2026) opt.selected = true;
    selectAnio.appendChild(opt);
  });

  const recalcular = () => {
    const bruto = parseFloat(inputBruto.value) || 0;
    const anio  = parseInt(selectAnio.value);
    if (bruto < 0) return;
    renderCalculadora(bruto, anio);
  };

  inputBruto.addEventListener('input', recalcular);
  selectAnio.addEventListener('change', recalcular);
  recalcular(); // cálculo inicial
}

function renderCalculadora(bruto, anio) {
  const r = calcularNomina(bruto, anio);
  const resultDiv = document.getElementById('calc-resultado');
  resultDiv.classList.remove('hidden');

  // Métricas principales
  document.getElementById('m-neto').textContent     = eur(r.salarioNeto);
  document.getElementById('m-neto-mes').textContent = eur(r.salarioNeto / 12);
  document.getElementById('m-irpf').textContent     = eur(r.irpfFinal);
  document.getElementById('m-ss-tra').textContent   = eur(r.cotTrabajador);
  document.getElementById('m-coste').textContent    = eur(r.costeLaboralTotal);
  document.getElementById('m-ss-emp').textContent   = eur(r.cotEmpresa);

  document.getElementById('m-tipo-irpf').textContent  = pct(r.tipoEfectivoIRPF);
  document.getElementById('m-tipo-ss').textContent    = pct(r.tipoEfectivoSS);
  document.getElementById('m-tipo-total').textContent = pct(r.tipoEfectivoTotal);

  const maxPct = 50;
  document.getElementById('bar-irpf').style.width  = `${Math.min(r.tipoEfectivoIRPF / maxPct * 100, 100)}%`;
  document.getElementById('bar-ss').style.width    = `${Math.min(r.tipoEfectivoSS / maxPct * 100, 100)}%`;
  document.getElementById('bar-total').style.width = `${Math.min(r.tipoEfectivoTotal / maxPct * 100, 100)}%`;

  // Tabla de desglose
  const tbody = document.getElementById('calc-tbody');
  tbody.innerHTML = buildDesglose(r);
}

function buildDesglose(r) {
  const row = (label, val, cls = '', badge = '') =>
    `<tr><td>${label}${badge ? ` <span class="badge-tramo">${badge}</span>` : ''}</td>
     <td class="text-right ${cls}">${val}</td></tr>`;

  let html = '';

  // -- SEGURIDAD SOCIAL TRABAJADOR --
  html += `<tr class="section-head"><td colspan="2">Seguridad Social — Trabajador</td></tr>`;
  html += row('Base de cotización SS', eur(r.baseCotizacion));
  html += row('Cuota SS trabajador', eur(-r.cotTrabajador), 'val-neg');
  if (r.cuotaSolidaridad > 0)
    html += row('Cuota solidaridad (parte trabajador)', eur(-r.cuotaSolidaridad / 6), 'val-neg');

  // -- IRPF --
  html += `<tr class="section-head"><td colspan="2">Cálculo del IRPF</td></tr>`;
  html += row('Rendimiento previo (bruto − SS)', eur(r.rendimientoPrevio));
  if (r.gastosFijos > 0)
    html += row('Gastos deducibles fijos (Art. 19)', eur(-r.gastosFijos), 'val-neg');
  html += row('Reducción rendimientos trabajo (Art. 20)', eur(-r.redTrabajo), 'val-neg');
  html += row('Base liquidable / imponible', eur(r.baseImponible));

  // Tramos IRPF
  html += `<tr class="section-head"><td colspan="2">Cuota por tramos IRPF</td></tr>`;
  r.cuotasPorTramo.forEach((t, i) => {
    if (t.cuota <= 0) return;
    const limLabel = t.hasta === Infinity ? 'En adelante' : `hasta ${eur(t.hasta)}`;
    html += row(`Tramo ${i + 1} (${limLabel})`, eur(t.cuota), '', `${pct(t.tipo * 100, 1)}`);
  });
  html += row('Cuota íntegra', eur(r.cuotaIntegra));
  html += row('Mínimo personal (deducción)', eur(-r.cuotaMinimo), 'val-neg');
  html += row('Cuota teórica', eur(r.cuotaTeorica));
  if (r.deduccionSMI > 0)
    html += row('Deducción por SMI', eur(-r.deduccionSMI), 'val-neg');
  if (r.limiteRetencion < r.cuotaConDeduccion)
    html += row('Límite legal 43% (Art. 85.3 RIRPF — aplicado)', eur(r.limiteRetencion), 'val-neu');
  html += row('IRPF final retenido', eur(-r.irpfFinal), 'val-neg');

  // -- COSTE EMPRESA --
  html += `<tr class="section-head"><td colspan="2">Coste para la empresa</td></tr>`;
  html += row('Salario bruto', eur(r.bruto));
  html += row('Cuota SS empresa', eur(r.cotEmpresa), 'val-neg');
  html += row('Coste laboral total', eur(r.costeLaboralTotal), 'val-neg');

  // -- RESULTADO --
  html += `<tr class="section-head"><td colspan="2">Resultado</td></tr>`;
  html += `<tr class="total-row">
    <td>💶 Salario neto anual</td>
    <td class="text-right val-pos">${eur(r.salarioNeto)}</td>
  </tr>`;
  html += `<tr class="total-row">
    <td>💶 Salario neto mensual (÷ 12)</td>
    <td class="text-right val-pos">${eur(r.salarioNeto / 12)}</td>
  </tr>`;

  return html;
}

// ─────────────────────────────────────────────────────────────
// TAB 2: PROGRESIVIDAD EN FRÍO
// ─────────────────────────────────────────────────────────────
let chartInstance = null;

function initProgresividad() {
  const input = document.getElementById('prog-bruto');
  const btn   = document.getElementById('prog-btn');

  btn.addEventListener('click', () => {
    const bruto = parseFloat(input.value);
    if (!bruto || bruto <= 0) return;
    renderProgresividad(bruto);
  });

  // Calcular con valor por defecto
  renderProgresividad(parseFloat(input.value) || 35000);
}

function renderProgresividad(bruto2026) {
  const p2026 = calcularNomina(bruto2026, 2026);

  const labels   = [];
  const netosReales = [];     // poder adquisitivo real de ese año en €2026
  const netosNominal2026 = []; // línea de referencia: lo que da 2026
  const diferenciasMes = [];
  const tableRows = [];

  ANIOS.forEach(anio => {
    const inflAcum = INFLACION_A_2026[anio];
    const brutoNominal = bruto2026 / inflAcum; // equivalente en €nominales de ese año

    const r = calcularNomina(brutoNominal, anio);
    const netoReal = r.salarioNeto * inflAcum;   // actualizado a €2026
    const difAnual = netoReal - p2026.salarioNeto;
    const difMes   = difAnual / 12;

    labels.push(anio.toString());
    netosReales.push(round2(netoReal));
    netosNominal2026.push(round2(p2026.salarioNeto));
    diferenciasMes.push(round2(difMes));

    tableRows.push({
      anio, inflAcum, brutoNominal, netoReal, difAnual, difMes,
      irpfPct: round2((r.irpfFinal / brutoNominal) * 100),
    });
  });

  // Chart.js
  const ctx = document.getElementById('prog-chart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Poder adquisitivo real (€ de 2026)',
          data: netosReales,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.08)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.3,
        },
        {
          label: `Neto actual en 2026 (referencia)`,
          data: netosNominal2026,
          borderColor: '#34d399',
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } },
        },
        tooltip: {
          backgroundColor: '#1a2235',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${eur(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: {
          ticks: { color: '#64748b', callback: v => eur(v, 0) },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
      },
    },
  });

  // Tabla comparativa
  const tbody = document.getElementById('prog-tbody');
  tbody.innerHTML = tableRows.map(row => {
    const difClass = row.difMes >= 0 ? 'val-pos' : 'val-neg';
    const difSign  = row.difMes >= 0 ? '+' : '';
    return `<tr>
      <td>${row.anio}</td>
      <td class="text-right">${pct((row.inflAcum - 1) * 100, 1)}</td>
      <td class="text-right">${eur(row.brutoNominal, 0)}</td>
      <td class="text-right">${eur(row.netoReal, 0)}</td>
      <td class="text-right ${difClass}">${difSign}${eur(row.difMes)}/mes</td>
      <td class="text-right">${pct(row.irpfPct, 1)}</td>
    </tr>`;
  }).join('');

  // Resumen
  const ultimo = tableRows[0]; // 2012
  document.getElementById('prog-resumen').innerHTML = `
    En <strong>2012</strong>, un equivalente salarial en euros de hoy dejaba
    <strong class="${ultimo.difMes >= 0 ? 'val-pos' : 'val-neg'}">${eur(Math.abs(ultimo.difMes))}/mes</strong>
    ${ultimo.difMes >= 0 ? 'más' : 'menos'} de poder adquisitivo real que en 2026.
  `;
}

// ─────────────────────────────────────────────────────────────
// TAB 3: NORMATIVA HISTÓRICA
// ─────────────────────────────────────────────────────────────
function initNormativa() {
  renderTablaGeneralNormativa();
  renderTablaTramosIRPF();
}

function renderTablaGeneralNormativa() {
  const tbody = document.getElementById('norm-general-tbody');
  tbody.innerHTML = ANIOS.map(anio => {
    const bMax    = BASE_MAX[anio];
    const mei     = MEI[anio];
    const mExento = MINIMO_EXENTO[anio];
    const gFijos  = GASTOS_FIJOS[anio];
    const sol     = SOLIDARIDAD[anio];
    const art20   = ART20[anio];

    const tipoEmp = ((SS_TIPO_EMPRESA    + mei[0]) * 100).toFixed(2);
    const tipoTra = ((SS_TIPO_TRABAJADOR + mei[1]) * 100).toFixed(2);
    const meiEmpStr = mei[0] > 0 ? `${(mei[0]*100).toFixed(2)}%` : '—';
    const meiTraStr = mei[1] > 0 ? `${(mei[1]*100).toFixed(2)}%` : '—';
    const solStr  = sol.length > 0 ? sol.map(t => `${(t*100).toFixed(2)}%`).join(' / ') : '—';
    const art20Str = art20.transitorio ? 'Transitorio' : (art20.redMax ? `${art20.redMax.toLocaleString('es-ES')}€` : '—');

    return `<tr>
      <td>${anio}</td>
      <td class="text-right">${eur(bMax, 0)}</td>
      <td class="text-right">${tipoEmp}%</td>
      <td class="text-right">${tipoTra}%</td>
      <td class="text-right">${meiEmpStr} / ${meiTraStr}</td>
      <td class="text-right">${solStr}</td>
      <td class="text-right">${eur(mExento, 0)}</td>
      <td class="text-right">${eur(gFijos, 0)}</td>
      <td class="text-right">${art20Str}</td>
    </tr>`;
  }).join('');
}

function renderTablaTramosIRPF() {
  const tbody = document.getElementById('norm-irpf-tbody');
  tbody.innerHTML = ANIOS.map(anio => {
    const tramos = TRAMOS_IRPF[anio];
    const tramosStr = tramos.map(([ lim, tipo ], i) => {
      const limStr = lim === Infinity ? '∞' : eur(lim, 0);
      return `<span class="badge-tramo">T${i+1}: ${pct(tipo*100,1)}</span>`;
    }).join(' ');
    return `<tr><td>${anio}</td><td>${tramosStr}</td></tr>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// INICIO
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initCalculadora();
  initProgresividad();
  initNormativa();
});
