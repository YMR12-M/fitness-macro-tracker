// =====================
// CHARTS MODULE
// =====================
let weeklyChartInst = null;
let weightChartInst = null;
let macroChartInst  = null;
let donutChartInst  = null;

const CHART_DEFAULTS = () => {
  Chart.defaults.color = '#666';
  Chart.defaults.font.family = "'IBM Plex Arabic', 'Cairo', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.plugins.tooltip.backgroundColor = '#1a1a1a';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.08)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.titleColor = '#f0f0f0';
  Chart.defaults.plugins.tooltip.bodyColor = '#999';
};

function destroyChart(inst) {
  if (inst) { try { inst.destroy(); } catch(e) {} }
}

// ─── WEEKLY CALORIES BAR ───────────────────────
function initWeeklyChart() {
  const ctx = document.getElementById('weeklyChart');
  if (!ctx) return null;
  destroyChart(weeklyChartInst);
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: WEEKLY_DATA.labels,
      datasets: [
        {
          label: 'Eaten',
          data: WEEKLY_DATA.eaten,
          backgroundColor: ctx2 => {
            const g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, 300);
            g.addColorStop(0, 'rgba(0,229,160,0.9)');
            g.addColorStop(1, 'rgba(0,229,160,0.2)');
            return g;
          },
          borderRadius: { topLeft:6, topRight:6 },
          barThickness: 26,
          order: 2,
        },
        {
          label: 'Burned',
          data: WEEKLY_DATA.burned,
          backgroundColor: 'rgba(255,107,53,0.55)',
          borderRadius: { topLeft:6, topRight:6 },
          barThickness: 26,
          order: 2,
        },
        {
          label: 'Goal',
          data: WEEKLY_DATA.goal,
          type: 'line',
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: false,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.raw.toLocaleString('ar')} kcal`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#555', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          border: { display: false },
          ticks: { color: '#444', callback: v => v.toLocaleString('ar') },
        },
      },
    },
  });
}

// ─── WEIGHT TREND LINE ─────────────────────────
function initWeightChart() {
  const ctx = document.getElementById('weightChart');
  if (!ctx) return null;
  destroyChart(weightChartInst);
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: WEIGHT_DATA.labels,
      datasets: [{
        label: 'Weight (kg)',
        data: WEIGHT_DATA.weights,
        borderColor: '#00E5A0',
        borderWidth: 2.5,
        backgroundColor: ctx2 => {
          const g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, 200);
          g.addColorStop(0, 'rgba(0,229,160,0.18)');
          g.addColorStop(1, 'rgba(0,229,160,0)');
          return g;
        },
        fill: true,
        tension: 0.45,
        pointBackgroundColor: '#00E5A0',
        pointBorderColor: '#0a0a0a',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: false,
          callbacks: { label: ctx => ` ${ctx.raw} kg` },
        },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: '#555' } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          border: { display: false },
          ticks: { color: '#444', callback: v => v + ' kg' },
        },
      },
    },
  });
}

// ─── MACRO HISTORY STACKED ─────────────────────
function initMacroChart() {
  const ctx = document.getElementById('macroChart');
  if (!ctx) return null;
  destroyChart(macroChartInst);
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MACRO_HISTORY.labels,
      datasets: [
        { label: 'Protein', data: MACRO_HISTORY.protein, backgroundColor: 'rgba(0,229,160,0.85)',  borderRadius:4, stack:'a' },
        { label: 'Carbs',   data: MACRO_HISTORY.carbs,   backgroundColor: 'rgba(74,158,255,0.75)', borderRadius:4, stack:'a' },
        { label: 'Fat',   data: MACRO_HISTORY.fat,     backgroundColor: 'rgba(255,107,53,0.75)', borderRadius:4, stack:'a' },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: '#777', boxWidth: 10, padding: 16, font: { size: 11 } },
        },
        tooltip: { rtl: false, mode: 'index', intersect: false },
      },
      scales: {
        x: { grid: { display:false }, border: { display:false }, stacked:true, ticks:{ color:'#555' } },
        y: { grid: { color:'rgba(255,255,255,0.04)' }, border:{ display:false }, stacked:true, ticks:{ color:'#444', callback: v => v+'g' } },
      },
    },
  });
}

// ─── MACRO DONUT (dashboard) ──────────────────
function initDonutChart(protein, carbs, fat) {
  const ctx = document.getElementById('donutChart');
  if (!ctx) return null;
  destroyChart(donutChartInst);
  const total = protein + carbs + fat || 1;
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Protein','Carbs','Fat'],
      datasets: [{
        data: [protein, carbs, fat],
        backgroundColor: ['#00E5A0','#4A9EFF','#FF6B35'],
        borderColor: '#141414',
        borderWidth: 3,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: false,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw}g (${Math.round(ctx.raw/total*100)}%)`,
          },
        },
      },
    },
  });
}

function initCharts() {
  CHART_DEFAULTS();
  weeklyChartInst = initWeeklyChart();
  weightChartInst = initWeightChart();
  macroChartInst  = initMacroChart();
  const p = state.meals.reduce((a,m)=>a+m.protein,0);
  const c = state.meals.reduce((a,m)=>a+m.carbs,0);
  const f = state.meals.reduce((a,m)=>a+m.fat,0);
  donutChartInst  = initDonutChart(Math.round(p), Math.round(c), Math.round(f));
}

function updateDonut() {
  const p = state.meals.reduce((a,m)=>a+m.protein,0);
  const c = state.meals.reduce((a,m)=>a+m.carbs,0);
  const f = state.meals.reduce((a,m)=>a+m.fat,0);
  if (donutChartInst) {
    donutChartInst.data.datasets[0].data = [Math.round(p), Math.round(c), Math.round(f)];
    donutChartInst.update('active');
  }
}
