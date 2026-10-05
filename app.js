/* ===== CONFIGURACIÓN PERSISTENTE (localStorage) ===== */
const CFG_KEY = 'datalogger_config';

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch { return {}; }
}

/* ===== DARK MODE ===== */
(function applyDarkOnLoad() {
  if (loadConfig().darkMode) document.body.classList.add('dark');
})();

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  saveConfig({ darkMode: isDark });
  _updateDarkToggleBtn();
}

function _updateDarkToggleBtn() {
  const btn = document.getElementById('dark-toggle-btn');
  if (!btn) return;
  const isDark = document.body.classList.contains('dark');
  btn.querySelector('.dt-icon').innerHTML = isDark
    ? '<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 15a8 8 0 0 1-11-11 9 9 0 1 0 11 11Z"/></svg>'
    : '<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="#f6b815" stroke-width="1.7"><circle cx="12" cy="12" r="4.5" fill="#f6c433"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M20 4l-2 2M6 18l-2 2"/></svg>';
  btn.querySelector('.dt-label').textContent = isDark ? 'Oscuro' : 'Claro';
}

document.addEventListener('DOMContentLoaded', _updateDarkToggleBtn);

function saveConfig(patch) {
  const previous = loadConfig();
  const cfg = { ...previous, ...patch };
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent('datalogger:configchange', {
    detail: { previous, current: cfg, patch }
  }));
}

/* ===== DATOS REACTIVOS ===== */
const DATA_POINTS = 24;
const ARG_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const DEFAULT_SAMPLING_INTERVAL_MS = 60 * 1000;
let dataAutoRefreshTimer = null;
let dataAutoRefreshTimeout = null;
let dataAutoRefreshCallback = null;
const argentinaClockTimers = {};

function formatArgentinaTime(date = new Date()) {
  return date.toLocaleTimeString('es-AR', { timeZone: ARG_TIME_ZONE });
}

function formatArgentinaDateTime(date = new Date()) {
  return date.toLocaleString('es-AR', {
    timeZone: ARG_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'medium'
  });
}

function parseSamplingInterval(value) {
  const match = String(value || '').trim().toLowerCase().match(/^(\d+(?:[.,]\d+)?)\s*(segundo|segundos|minuto|minutos|hora|horas)$/);
  if (!match) return DEFAULT_SAMPLING_INTERVAL_MS;

  const amount = parseFloat(match[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return DEFAULT_SAMPLING_INTERVAL_MS;

  const unit = match[2];
  if (unit.startsWith('segundo')) return amount * 1000;
  if (unit.startsWith('minuto')) return amount * 60 * 1000;
  if (unit.startsWith('hora')) return amount * 60 * 60 * 1000;
  return DEFAULT_SAMPLING_INTERVAL_MS;
}

function getSamplingIntervalMs() {
  const cfg = loadConfig();
  const stored = Number(cfg.samplingIntervalMs);
  if (Number.isFinite(stored) && stored > 0) return stored;

  const parsed = parseSamplingInterval(cfg.samplingInterval);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SAMPLING_INTERVAL_MS;
}

function getCurrentSampleTime(interval = getSamplingIntervalMs()) {
  interval = Number(interval);
  if (!Number.isFinite(interval) || interval <= 0) interval = DEFAULT_SAMPLING_INTERVAL_MS;

  const now = Date.now();
  return new Date(now - (now % interval));
}

function getMsUntilNextSample(interval = getSamplingIntervalMs()) {
  interval = Number(interval);
  if (!Number.isFinite(interval) || interval <= 0) interval = DEFAULT_SAMPLING_INTERVAL_MS;

  const remainder = Date.now() % interval;
  const delay = remainder === 0 ? interval : interval - remainder;
  return Math.max(250, delay);
}

window.formatArgentinaTime = formatArgentinaTime;
window.formatArgentinaDateTime = formatArgentinaDateTime;
window.parseSamplingInterval = parseSamplingInterval;
window.getSamplingIntervalMs = getSamplingIntervalMs;
window.getCurrentSampleTime = getCurrentSampleTime;
window.getMsUntilNextSample = getMsUntilNextSample;

function randomBetween(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateSeries(base, variance, count, decimals = 1) {
  let val = base;
  return Array.from({ length: count }, () => {
    val += randomBetween(-variance, variance, decimals);
    val = Math.max(base - variance * 3, Math.min(base + variance * 3, val));
    return parseFloat(val.toFixed(decimals));
  });
}

function hourLabels() {
  const interval = getSamplingIntervalMs();
  const now = getCurrentSampleTime(interval);
  return Array.from({ length: DATA_POINTS }, (_, i) => {
    const d = new Date(now - (DATA_POINTS - 1 - i) * interval);
    return d.toLocaleTimeString('es-AR', {
      timeZone: ARG_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: interval < 60 * 1000 ? '2-digit' : undefined
    });
  });
}

// Series mutables — se regeneran al actualizar
let HOUR_LABELS = hourLabels();
let TEMP_DATA   = generateSeries(24, 1.5, DATA_POINTS);
let HUM_DATA    = generateSeries(62, 3,   DATA_POINTS);
let PRES_DATA   = generateSeries(101325, 150, DATA_POINTS, 0);

function regenerateData() {
  HOUR_LABELS = hourLabels();
  TEMP_DATA   = generateSeries(24, 1.5, DATA_POINTS);
  HUM_DATA    = generateSeries(62, 3,   DATA_POINTS);
  PRES_DATA   = generateSeries(101325, 150, DATA_POINTS, 0);
}

function appendMeasurement() {
  const lastTemp = TEMP_DATA[TEMP_DATA.length - 1] ?? 24;
  const lastHum = HUM_DATA[HUM_DATA.length - 1] ?? 62;
  const lastPres = PRES_DATA[PRES_DATA.length - 1] ?? 101325;

  TEMP_DATA = [...TEMP_DATA.slice(1), parseFloat(Math.max(18, Math.min(32, lastTemp + randomBetween(-0.6, 0.6))).toFixed(1))];
  HUM_DATA = [...HUM_DATA.slice(1), parseFloat(Math.max(35, Math.min(90, lastHum + randomBetween(-1.2, 1.2))).toFixed(1))];
  PRES_DATA = [...PRES_DATA.slice(1), Math.round(Math.max(99000, Math.min(103500, lastPres + randomBetween(-45, 45, 0))))];
  HOUR_LABELS = hourLabels();
}

function startDataAutoRefresh(callback) {
  dataAutoRefreshCallback = callback;
  if (dataAutoRefreshTimer) clearInterval(dataAutoRefreshTimer);
  if (dataAutoRefreshTimeout) clearTimeout(dataAutoRefreshTimeout);

  const interval = getSamplingIntervalMs();
  dataAutoRefreshTimeout = setTimeout(() => {
    callback();
    dataAutoRefreshTimer = setInterval(callback, interval);
  }, getMsUntilNextSample(interval));
}

function restartDataAutoRefresh() {
  if (dataAutoRefreshCallback) startDataAutoRefresh(dataAutoRefreshCallback);
}

function samplingIntervalChanged(previous = {}, current = {}) {
  const before = Number(previous.samplingIntervalMs) || parseSamplingInterval(previous.samplingInterval);
  const after = Number(current.samplingIntervalMs) || parseSamplingInterval(current.samplingInterval);
  return before !== after;
}

window.addEventListener('storage', event => {
  if (event.key === CFG_KEY) restartDataAutoRefresh();
});

window.addEventListener('datalogger:configchange', event => {
  const detail = event.detail || {};
  if (samplingIntervalChanged(detail.previous, detail.current)) restartDataAutoRefresh();
});

/* ===== OPCIONES DE CHARTS ===== */
const CHART_DEFAULTS = {
  responsive: true,
  animation: { duration: 600 },
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index', intersect: false }
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,.05)' },
      ticks: { font: { size: 11, family: 'Tecnico' }, color: '#64748b' }
    },
    y: {
      grid: { color: 'rgba(0,0,0,.05)' },
      ticks: { font: { size: 11, family: 'Tecnico' }, color: '#64748b' }
    }
  },
  elements: { point: { radius: 0, hoverRadius: 4 } }
};

/* ===== CONVERSIONES ===== */
function toKelvin(c)     { return parseFloat((c + 273.15).toFixed(2)); }
function toFahrenheit(c) { return parseFloat((c * 9 / 5 + 32).toFixed(1)); }
function convertTemp(c, unit) {
  if (unit === 'K') return toKelvin(c);
  if (unit === 'F') return toFahrenheit(c);
  return parseFloat(c.toFixed(1));
}
function tempUnit(unit) { return unit === 'C' ? '°C' : unit === 'K' ? 'K' : '°F'; }

function configNumber(value, fallback, max = Infinity) {
  const parsed = Number(value);
  const safe = Number.isFinite(parsed) ? parsed : fallback;
  return Math.max(0, Math.min(max, safe));
}

function getTempAlertConfig() {
  const cfg = loadConfig();
  const min = configNumber(cfg.tempMin, 10);
  const max = Math.max(min, configNumber(cfg.tempMax, 40));

  return {
    enabled: cfg.tempAlert ?? true,
    min,
    max
  };
}

function getTempAlertState(tempC) {
  const value = Number(tempC);
  const cfg = getTempAlertConfig();

  if (!cfg.enabled || !Number.isFinite(value)) {
    return { active: false, badge: 'ok', label: 'Normal', trendClass: 'stable' };
  }

  if (value < cfg.min) {
    return { active: true, badge: 'error', label: 'Alerta baja', trendClass: 'up' };
  }

  if (value > cfg.max) {
    return { active: true, badge: 'error', label: 'Alerta alta', trendClass: 'up' };
  }

  return { active: false, badge: 'ok', label: 'Normal', trendClass: 'stable' };
}

function toAbsoluteHumidity(rh, tempC) {
  const es = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
  return parseFloat(((rh / 100) * es * 216.7 / (tempC + 273.15)).toFixed(2));
}

/* ===== UTILIDADES DOM ===== */
function updateTimestamp(id) {
  const el = document.getElementById(id || 'last-update');
  if (el) el.textContent = formatArgentinaTime();
}

function startArgentinaClock(id = 'last-update') {
  updateTimestamp(id);
  if (argentinaClockTimers[id]) clearInterval(argentinaClockTimers[id]);
  argentinaClockTimers[id] = setInterval(() => updateTimestamp(id), 1000);
}

function makeTableRows(count = 8) {
  const interval = getSamplingIntervalMs();
  const now = getCurrentSampleTime(interval).getTime();
  return Array.from({ length: count }, (_, i) => {
    const t  = new Date(now - i * interval);
    const tc = TEMP_DATA[TEMP_DATA.length - 1 - i] ?? randomBetween(22, 26);
    const rh = HUM_DATA[HUM_DATA.length  - 1 - i] ?? randomBetween(58, 66);
    const pa = PRES_DATA[PRES_DATA.length - 1 - i] ?? 101325;
    const tempState = getTempAlertState(tc);
    return `<tr>
      <td>${formatArgentinaDateTime(t)}</td>
      <td>${tc} °C</td>
      <td>${rh} %HR</td>
      <td>${pa.toLocaleString('es-AR')} Pa</td>
      <td><span class="badge ${tempState.badge}">${tempState.label}</span></td>
    </tr>`;
  }).join('');
}

/* ===== DASHBOARD ===== */
let dashMainChart = null;

// Estado de series: color y visibilidad
const DS_DEFAULTS = {
  temp: { color: '#30B77E', visible: true },
  hum:  { color: '#249DCF', visible: true },
  pres: { color: '#E24B60', visible: true }
};

let dsState = {}; // se inicializa en initDashboard

// Instancias de color pickers
const _pickers = {};

/* Normaliza una serie a 0-100% respecto a su propio rango */
function normalizeSeries(arr) {
  const min = Math.min(...arr), max = Math.max(...arr);
  const range = max - min || 1;
  return arr.map(v => parseFloat(((v - min) / range * 100).toFixed(2)));
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function initDashboard() {
  // Carga preferencias o usa defaults
  const saved = loadConfig().dsState || {};
  dsState = {
    temp: { color: saved.temp?.color || DS_DEFAULTS.temp.color, visible: saved.temp?.visible ?? true },
    hum:  { color: saved.hum?.color  || DS_DEFAULTS.hum.color,  visible: saved.hum?.visible  ?? true },
    pres: { color: saved.pres?.color || DS_DEFAULTS.pres.color, visible: saved.pres?.visible ?? true }
  };

  startArgentinaClock('last-update');
  _updateDashCards();
  _buildMainChart();
  _initColorPickers();
  _syncDsControls();

  const tbody = document.getElementById('table-body');
  if (tbody) tbody.innerHTML = makeTableRows();

  startDataAutoRefresh(refreshData);
}

function _updateDashCards() {
  const cfg  = loadConfig();
  const tu   = cfg.tempUnit || 'C';
  const last = TEMP_DATA[TEMP_DATA.length - 1];
  const rh   = HUM_DATA[HUM_DATA.length - 1];
  const pa   = PRES_DATA[PRES_DATA.length - 1];

  const tv   = document.getElementById('temp-value');
  const hv   = document.getElementById('hum-value');
  const pv   = document.getElementById('pres-value');
  const tuEl = document.getElementById('temp-card-unit');
  if (tv)   tv.textContent   = convertTemp(last, tu);
  if (hv)   hv.textContent   = rh.toFixed(1);
  if (pv)   pv.textContent   = pa.toLocaleString('es-AR');
  if (tuEl) tuEl.textContent = tempUnit(tu);

  const tempState = getTempAlertState(last);
  const tempTrend = tv?.closest('.card')?.querySelector('.trend');
  if (tempTrend) {
    tempTrend.classList.remove('up', 'down', 'stable');
    tempTrend.classList.add(tempState.trendClass);
    tempTrend.textContent = tempState.label;
  }

  // Valores en controles del gráfico
  const cfg2 = loadConfig();
  const u = cfg2.tempUnit || 'C';
  const dvt = document.getElementById('ds-val-temp');
  const dvh = document.getElementById('ds-val-hum');
  const dvp = document.getElementById('ds-val-pres');
  if (dvt) dvt.textContent = convertTemp(last, u) + ' ' + tempUnit(u);
  if (dvh) dvh.textContent = rh.toFixed(1) + ' %HR';
  if (dvp) dvp.textContent = pa.toLocaleString('es-AR') + ' Pa';
}

function _buildMainChart() {
  const ctx = document.getElementById('mainChart');
  if (!ctx) return;
  if (dashMainChart) dashMainChart.destroy();

  const normTemp = normalizeSeries(TEMP_DATA);
  const normHum  = normalizeSeries(HUM_DATA);
  const normPres = normalizeSeries(PRES_DATA);

  // Valores originales para tooltip
  const origTemp = TEMP_DATA, origHum = HUM_DATA, origPres = PRES_DATA;
  const cfg  = loadConfig();
  const tu   = cfg.tempUnit || 'C';

  dashMainChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: HOUR_LABELS,
      datasets: [
        {
          id: 'temp',
          label: 'Temperatura',
          data: normTemp,
          _orig: origTemp,
          borderColor: dsState.temp.color,
          backgroundColor: hexToRgba(dsState.temp.color, .08),
          fill: true, tension: .4,
          hidden: !dsState.temp.visible,
          borderWidth: 2,
          pointRadius: 0, pointHoverRadius: 5
        },
        {
          id: 'hum',
          label: 'Humedad',
          data: normHum,
          _orig: origHum,
          borderColor: dsState.hum.color,
          backgroundColor: hexToRgba(dsState.hum.color, .08),
          fill: true, tension: .4,
          hidden: !dsState.hum.visible,
          borderWidth: 2,
          pointRadius: 0, pointHoverRadius: 5
        },
        {
          id: 'pres',
          label: 'Presión',
          data: normPres,
          _orig: origPres,
          borderColor: dsState.pres.color,
          backgroundColor: hexToRgba(dsState.pres.color, .08),
          fill: true, tension: .4,
          hidden: !dsState.pres.visible,
          borderWidth: 2,
          pointRadius: 0, pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 400 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => HOUR_LABELS[items[0].dataIndex],
            label: item => {
              const ds = item.dataset;
              const i  = item.dataIndex;
              if (ds.id === 'temp') return ` Temperatura: ${convertTemp(ds._orig[i], tu)} ${tempUnit(tu)}`;
              if (ds.id === 'hum')  return ` Humedad: ${ds._orig[i].toFixed(1)} %HR`;
              if (ds.id === 'pres') return ` Presión: ${ds._orig[i].toLocaleString('es-AR')} Pa`;
              return item.formattedValue;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,.05)' },
          ticks: { font: { size: 11, family: 'Tecnico' }, color: '#64748b' }
        },
        y: {
          min: -5, max: 105,
          grid: { color: 'rgba(0,0,0,.05)' },
          ticks: {
            font: { size: 10, family: 'Tecnico' }, color: '#64748b',
            callback: v => v === 0 ? 'mín' : v === 100 ? 'máx' : ''
          }
        }
      }
    }
  });
}

/* Sincroniza el estado visual de los controles (toggle + swatch) */
function _syncDsControls() {
  ['temp','hum','pres'].forEach(key => {
    const chk   = document.getElementById('chk-' + key);
    const swatch = document.getElementById('swatch-' + key);
    const row   = document.getElementById('ds-row-' + key);
    if (chk)   chk.checked = dsState[key].visible;
    if (swatch) swatch.style.background = dsState[key].color;
    if (row)   row.style.opacity = dsState[key].visible ? '1' : '.45';
  });
}

/* Instancia un ColorPicker por swatch */
function _initColorPickers() {
  ['temp','hum','pres'].forEach(key => {
    const btn = document.getElementById('swatch-' + key);
    if (!btn) return;
    if (_pickers[key]) { _pickers[key].destroy(); }

    btn.style.background = dsState[key].color;

    _pickers[key] = new ColorPicker({
      anchor: btn,
      initialColor: dsState[key].color,
      onChange: hex => {
        dsState[key].color = hex;
        btn.style.background = hex;
        // Actualiza el dataset en el gráfico sin reconstruirlo
        if (dashMainChart) {
          const idx = ['temp','hum','pres'].indexOf(key);
          dashMainChart.data.datasets[idx].borderColor = hex;
          dashMainChart.data.datasets[idx].backgroundColor = hexToRgba(hex, .08);
          dashMainChart.update('none');
        }
        saveConfig({ dsState });
      }
    });

    btn.addEventListener('click', e => {
      e.stopPropagation();
      // Cierra los otros pickers
      Object.entries(_pickers).forEach(([k, p]) => { if (k !== key) p.hide(); });
      _pickers[key].toggle();
    });
  });
}

/* Toggle de visibilidad de una serie */
function toggleDataset(key, visible) {
  dsState[key].visible = visible;
  const row = document.getElementById('ds-row-' + key);
  if (row) row.style.opacity = visible ? '1' : '.45';
  if (dashMainChart) {
    const idx = ['temp','hum','pres'].indexOf(key);
    dashMainChart.data.datasets[idx].hidden = !visible;
    dashMainChart.update();
  }
  saveConfig({ dsState });
}

function refreshData() {
  appendMeasurement();
  updateTimestamp('last-update');
  _updateDashCards();
  _buildMainChart();
  // Re-inicializa pickers con nuevos datos (los colores se mantienen)
  _initColorPickers();

  const tbody = document.getElementById('table-body');
  if (tbody) tbody.innerHTML = makeTableRows();
}

/* ===== TEMPERATURA ===== */
let currentTempUnit = 'C';
let tempChartInst   = null;

function initTemperatura() {
  const cfg  = loadConfig();
  const unit = cfg.tempUnit || 'C';
  currentTempUnit = unit;

  startArgentinaClock('last-update');
  renderTempValues(unit);
  renderTempChart(unit);
  const tbody = document.getElementById('table-body-temp');
  if (tbody) tbody.innerHTML = makeTempRows(unit);

  startDataAutoRefresh(refreshTemperatura);
}

function refreshTemperatura() {
  appendMeasurement();
  updateTimestamp('last-update');
  renderTempValues(currentTempUnit);
  renderTempChart(currentTempUnit);
  const tbody = document.getElementById('table-body-temp');
  if (tbody) tbody.innerHTML = makeTempRows(currentTempUnit);
  if (typeof updateConversionList === 'function') updateConversionList(currentTempUnit);
}

function selectTempUnit(unit) {
  currentTempUnit = unit;
  saveConfig({ tempUnit: unit });           // persiste en localStorage
  document.querySelectorAll('.unit-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.unit === unit);
  });
  renderTempValues(unit);
  renderTempChart(unit);
  const tbody = document.getElementById('table-body-temp');
  if (tbody) tbody.innerHTML = makeTempRows(unit);
}

function renderTempValues(unit) {
  const last = TEMP_DATA[TEMP_DATA.length - 1];
  const conv = d => convertTemp(d, unit).toFixed(unit === 'K' ? 2 : 1);
  const u    = tempUnit(unit);
  const el   = id => document.getElementById(id);

  if (el('temp-current'))    el('temp-current').textContent    = conv(last);
  if (el('temp-unit-label')) el('temp-unit-label').textContent = u;
  if (el('temp-min')) el('temp-min').textContent = conv(Math.min(...TEMP_DATA)) + ' ' + u;
  if (el('temp-max')) el('temp-max').textContent = conv(Math.max(...TEMP_DATA)) + ' ' + u;
  if (el('temp-avg')) {
    const avg = TEMP_DATA.reduce((a, b) => a + b, 0) / TEMP_DATA.length;
    el('temp-avg').textContent = conv(avg) + ' ' + u;
  }
}

function renderTempChart(unit) {
  const converted = TEMP_DATA.map(d => convertTemp(d, unit));
  const ctx = document.getElementById('tempChart');
  if (!ctx) return;
  if (tempChartInst) tempChartInst.destroy();
  tempChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels: HOUR_LABELS,
      datasets: [{ label: `Temperatura (${tempUnit(unit)})`, data: converted, borderColor: '#003087', backgroundColor: 'rgba(0,48,135,.1)', fill: true, tension: .4 }]
    },
    options: { ...CHART_DEFAULTS }
  });
}

function makeTempRows(unit) {
  const interval = getSamplingIntervalMs();
  const now = getCurrentSampleTime(interval).getTime();
  return Array.from({ length: 8 }, (_, i) => {
    const t   = new Date(now - i * interval);
    const raw = TEMP_DATA[TEMP_DATA.length - 1 - i] ?? 24;
    const tempState = getTempAlertState(raw);
    return `<tr>
      <td>${formatArgentinaDateTime(t)}</td>
      <td>${convertTemp(raw, 'C')} °C</td>
      <td>${convertTemp(raw, 'K')} K</td>
      <td>${convertTemp(raw, 'F')} °F</td>
      <td><span class="badge ${tempState.badge}">${tempState.label}</span></td>
    </tr>`;
  }).join('');
}

/* ===== HUMEDAD ===== */
let currentHumUnit = 'RH';
let humChartInst   = null;

function initHumedad() {
  const cfg  = loadConfig();
  const unit = cfg.humUnit || 'RH';
  currentHumUnit = unit;

  startArgentinaClock('last-update');
  renderHumValues(unit);
  renderHumChart(unit);
  const tbody = document.getElementById('table-body-hum');
  if (tbody) tbody.innerHTML = makeHumRows();

  startDataAutoRefresh(refreshHumedad);
}

function refreshHumedad() {
  appendMeasurement();
  updateTimestamp('last-update');
  renderHumValues(currentHumUnit);
  renderHumChart(currentHumUnit);
  const tbody = document.getElementById('table-body-hum');
  if (tbody) tbody.innerHTML = makeHumRows();
  if (typeof updateHumPointer === 'function') updateHumPointer(currentHumUnit);
  if (typeof updateHumStatus === 'function') updateHumStatus();
  if (typeof updateHumEquiv === 'function') updateHumEquiv();
}

function selectHumUnit(unit) {
  currentHumUnit = unit;
  saveConfig({ humUnit: unit });
  document.querySelectorAll('.unit-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.unit === unit);
  });
  renderHumValues(unit);
  renderHumChart(unit);
}

function renderHumValues(unit) {
  const last  = HUM_DATA[HUM_DATA.length - 1];
  const lastT = TEMP_DATA[TEMP_DATA.length - 1];
  const el    = id => document.getElementById(id);
  let display, unitLabel, minVal, maxVal, avgVal;

  if (unit === 'RH') {
    display   = last.toFixed(1);
    unitLabel = '%HR';
    minVal    = Math.min(...HUM_DATA).toFixed(1) + ' %HR';
    maxVal    = Math.max(...HUM_DATA).toFixed(1) + ' %HR';
    avgVal    = (HUM_DATA.reduce((a, b) => a + b, 0) / HUM_DATA.length).toFixed(1) + ' %HR';
  } else {
    const abs    = toAbsoluteHumidity(last, lastT);
    const absArr = HUM_DATA.map((rh, i) => toAbsoluteHumidity(rh, TEMP_DATA[i] ?? lastT));
    display   = abs.toFixed(2);
    unitLabel = 'g/m³';
    minVal    = Math.min(...absArr).toFixed(2) + ' g/m³';
    maxVal    = Math.max(...absArr).toFixed(2) + ' g/m³';
    avgVal    = (absArr.reduce((a, b) => a + b, 0) / absArr.length).toFixed(2) + ' g/m³';
  }

  if (el('hum-current'))    el('hum-current').textContent    = display;
  if (el('hum-unit-label')) el('hum-unit-label').textContent = unitLabel;
  if (el('hum-min'))  el('hum-min').textContent  = minVal;
  if (el('hum-max'))  el('hum-max').textContent  = maxVal;
  if (el('hum-avg'))  el('hum-avg').textContent  = avgVal;
}

function renderHumChart(unit) {
  const lastT = TEMP_DATA[TEMP_DATA.length - 1];
  const data  = unit === 'RH'
    ? HUM_DATA
    : HUM_DATA.map((rh, i) => toAbsoluteHumidity(rh, TEMP_DATA[i] ?? lastT));
  const label = unit === 'RH' ? 'Humedad (%HR)' : 'Humedad Absoluta (g/m³)';
  const ctx   = document.getElementById('humChart');
  if (!ctx) return;
  if (humChartInst) humChartInst.destroy();
  humChartInst = new Chart(ctx, {
    type: 'line',
    data: { labels: HOUR_LABELS, datasets: [{ label, data, borderColor: '#0078d4', backgroundColor: 'rgba(0,120,212,.1)', fill: true, tension: .4 }] },
    options: { ...CHART_DEFAULTS }
  });
}

function makeHumRows() {
  const interval = getSamplingIntervalMs();
  const now = getCurrentSampleTime(interval).getTime();
  return Array.from({ length: 8 }, (_, i) => {
    const t  = new Date(now - i * interval);
    const rh = HUM_DATA[HUM_DATA.length - 1 - i] ?? 62;
    const tc = TEMP_DATA[TEMP_DATA.length - 1 - i] ?? 24;
    const ab = toAbsoluteHumidity(rh, tc);
    return `<tr>
      <td>${formatArgentinaDateTime(t)}</td>
      <td>${rh.toFixed(1)} %HR</td>
      <td>${ab.toFixed(2)} g/m³</td>
      <td>${tc} °C</td>
      <td><span class="badge ok">Normal</span></td>
    </tr>`;
  }).join('');
}

/* ===== PRESION ===== */
let presChartInst = null;

function convertPressure(pa, unit = 'Pa') {
  if (unit === 'hPa') return (pa / 100).toFixed(1);
  if (unit === 'atm') return (pa / 101325).toFixed(4);
  if (unit === 'mmHg') return (pa * 0.00750062).toFixed(1);
  return Math.round(pa).toLocaleString('es-AR');
}

function selectPresUnit(unit) {
  if (!['Pa', 'hPa', 'atm', 'mmHg'].includes(unit)) return;
  saveConfig({ presUnit: unit });
  _renderPresValues();
  _buildPresChart();
}

function initPresion() {
  startArgentinaClock('last-update');
  _renderPresValues();
  const tbody = document.getElementById('table-body-pres');
  if (tbody) tbody.innerHTML = makePresRows();
  _buildPresChart();
  startDataAutoRefresh(refreshPresion);
}

function refreshPresion() {
  appendMeasurement();
  updateTimestamp('last-update');
  _renderPresValues();
  const tbody = document.getElementById('table-body-pres');
  if (tbody) tbody.innerHTML = makePresRows();
  _buildPresChart();
}

function _renderPresValues() {
  const last = PRES_DATA[PRES_DATA.length - 1];
  const avg  = PRES_DATA.reduce((a, b) => a + b, 0) / PRES_DATA.length;
  const el   = id => document.getElementById(id);
  const unit = loadConfig().presUnit || 'Pa';
  if (el('pres-current')) el('pres-current').textContent = convertPressure(last, unit);
  const unitLabel = el('pres-current')?.parentElement.querySelector('.unit');
  if (unitLabel) unitLabel.textContent = unit;
  if (el('pres-min')) el('pres-min').textContent = convertPressure(Math.min(...PRES_DATA), unit) + ' ' + unit;
  if (el('pres-max')) el('pres-max').textContent = convertPressure(Math.max(...PRES_DATA), unit) + ' ' + unit;
  if (el('pres-avg')) el('pres-avg').textContent = convertPressure(avg, unit) + ' ' + unit;
  if (el('pres-pa-display')) el('pres-pa-display').textContent = last.toLocaleString('es-AR') + ' Pa';
  if (el('pres-hpa'))      el('pres-hpa').textContent      = (last / 100).toFixed(1) + ' hPa';
  if (el('pres-atm'))      el('pres-atm').textContent      = (last / 101325).toFixed(4) + ' atm';
  if (el('pres-mmhg'))     el('pres-mmhg').textContent     = (last * 0.00750062).toFixed(1) + ' mmHg';
}

function _buildPresChart() {
  const ctx = document.getElementById('presionChart');
  if (!ctx) return;
  if (presChartInst) presChartInst.destroy();
  const unit = loadConfig().presUnit || 'Pa';
  const divisor = { Pa: 1, hPa: 100, atm: 101325, mmHg: 1 / 0.00750062 }[unit];
  presChartInst = new Chart(ctx, {
    type: 'line',
    data: { labels: HOUR_LABELS, datasets: [{ label: `Presión (${unit})`, data: PRES_DATA.map(value => value / divisor), borderColor: '#559cdb', backgroundColor: 'rgba(85,156,219,.1)', fill: true, tension: .4 }] },
    options: { ...CHART_DEFAULTS }
  });
}

function makePresRows() {
  const interval = getSamplingIntervalMs();
  const now = getCurrentSampleTime(interval).getTime();
  return Array.from({ length: 8 }, (_, i) => {
    const t  = new Date(now - i * interval);
    const pa = PRES_DATA[PRES_DATA.length - 1 - i] ?? 101325;
    return `<tr>
      <td>${formatArgentinaDateTime(t)}</td>
      <td>${pa.toLocaleString('es-AR')} Pa</td>
      <td>${(pa / 100).toFixed(1)} hPa</td>
      <td>${(pa / 101325).toFixed(4)} atm</td>
      <td><span class="badge ok">Normal</span></td>
    </tr>`;
  }).join('');
}

/* ===== HISTORIAL ===== */
let histChartInst = null;
let historyPage = 0;

function initHistorial() {
  startArgentinaClock('last-update');
  applyHistoryFilters();
  startDataAutoRefresh(refreshHistorial);
}

function refreshHistorial() {
  appendMeasurement();
  updateTimestamp('last-update');
  renderHistorialTable();
  renderHistorialChart();
}

function getHistoryRows() {
  const sampleInterval = getSamplingIntervalMs();
  const now = getCurrentSampleTime(sampleInterval).getTime();
  const fromValue = document.getElementById('filter-from')?.value;
  const toValue = document.getElementById('filter-to')?.value;
  const from = fromValue ? new Date(fromValue).getTime() : -Infinity;
  const to = toValue ? new Date(toValue).getTime() + 59999 : Infinity;
  const displayInterval = parseSamplingInterval(document.getElementById('filter-interval')?.value || '1 minuto');
  let bucket = null;
  return TEMP_DATA.map((tc, i) => ({
    timestamp: new Date(now - (TEMP_DATA.length - 1 - i) * sampleInterval),
    temperatura: tc,
    humedad: HUM_DATA[i],
    presion: PRES_DATA[i]
  })).filter(row => {
    const time = row.timestamp.getTime();
    if (time < from || time > to) return false;
    const current = Math.floor(time / displayInterval);
    if (current === bucket) return false;
    bucket = current;
    return true;
  });
}

function applyHistoryFilters() {
  historyPage = 0;
  renderHistorialTable();
  renderHistorialChart();
}

function changeHistoryPage(direction) {
  const lastPage = Math.max(0, Math.ceil(getHistoryRows().length / 20) - 1);
  historyPage = Math.max(0, Math.min(lastPage, historyPage + direction));
  renderHistorialTable();
}

function renderHistorialTable() {
  const tbody = document.getElementById('table-hist');
  if (!tbody) return;
  const all = getHistoryRows().reverse();
  const lastPage = Math.max(0, Math.ceil(all.length / 20) - 1);
  historyPage = Math.min(historyPage, lastPage);
  const offset = historyPage * 20;
  const rows = all.slice(offset, offset + 20);
  tbody.innerHTML = rows.map(row => {
    const state = getTempAlertState(row.temperatura);
    return `<tr>
      <td>${formatArgentinaDateTime(row.timestamp)}</td>
      <td>${row.temperatura.toFixed(1)} °C</td>
      <td>${row.humedad.toFixed(1)} %HR</td>
      <td>${row.presion.toLocaleString('es-AR')} Pa</td>
      <td><span class="badge ${state.badge}">${state.label}</span></td>
    </tr>`;
  }).join('') || '<tr><td colspan="5">No hay lecturas disponibles para estos filtros.</td></tr>';
  const count = document.getElementById('history-count');
  if (count) count.textContent = `${all.length} registros disponibles`;
  const pageCount = document.getElementById('history-page-count');
  if (pageCount) pageCount.textContent = all.length ? `Mostrando ${offset + 1}–${offset + rows.length} de ${all.length} registros` : 'Sin registros';
  const prev = document.getElementById('history-prev');
  const next = document.getElementById('history-next');
  if (prev) prev.disabled = historyPage === 0;
  if (next) next.disabled = historyPage === lastPage;
}

function renderHistorialChart() {
  const ctx = document.getElementById('histChart');
  if (!ctx) return;
  if (histChartInst) histChartInst.destroy();
  const rows = getHistoryRows();
  const selected = document.getElementById('filter-var')?.value || 'all';
  const datasets = [];
  const scales = { x: CHART_DEFAULTS.scales.x };
  const add = (label, field, axis, color, position) => {
    datasets.push({ label, data: rows.map(row => row[field]), backgroundColor: color, yAxisID: axis, borderRadius: 3 });
    scales[axis] = { type: 'linear', position, grid: { drawOnChartArea: position !== 'right' }, ticks: { font: { size: 11, family: 'DataLogger UI' }, color } };
  };
  if (selected === 'all' || selected === 'temp') add('Temperatura (°C)', 'temperatura', 'yTemp', '#4f7fac', 'left');
  if (selected === 'all' || selected === 'hum') add('Humedad (%HR)', 'humedad', 'yHum', '#81bfe7', 'right');
  if (selected === 'pres') add('Presión (Pa)', 'presion', 'yPres', '#4f7fac', 'left');
  const legend = document.querySelector('.chart-header .legend');
  if (legend) legend.innerHTML = datasets.map(dataset => `<span class="legend-dot" style="background:${dataset.backgroundColor}"></span>${dataset.label}`).join(' ');
  histChartInst = new Chart(ctx, {
    type: 'bar',
    data: { labels: rows.map(row => formatArgentinaTime(row.timestamp)), datasets },
    options: { ...CHART_DEFAULTS, plugins: { legend: { display: false } }, scales }
  });
}

function exportHistorialCSV() {
  const rows = getHistoryRows();
  if (!rows.length) return;
  const csv = ['timestamp,temperatura,humedad,presion', ...rows.map(row => [
    row.timestamp.toISOString(), row.temperatura, row.humedad, row.presion
  ].join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'datalogger-historial.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
