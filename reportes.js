(function () {
  let rows = [];
  let chart = null;
  const getNumber = (row, keys) => {
    const value = keys.map(key => row[key]).find(value => value !== null && value !== undefined && value !== '');
    return Number(value);
  };

  function render() {
    const vars = [['temp', 'temperatura', '°C'], ['hum', 'humedad', '%HR'], ['pres', 'presion', 'Pa']];
    vars.forEach(([key, field, unit]) => {
      const values = rows.map(row => row[field]);
      const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
      const format = value => field === 'presion' ? Math.round(value).toLocaleString('es-AR') : value.toFixed(1);
      document.getElementById(`report-${key}`).textContent = values.length ? format(avg) : '--';
      document.getElementById(`report-${key}-range`).textContent = values.length ? `${format(Math.min(...values))} – ${format(Math.max(...values))} ${unit}` : 'Sin datos';
    });
    document.getElementById('report-count').textContent = rows.length.toLocaleString('es-AR');
    document.getElementById('report-table-count').textContent = `${Math.min(20, rows.length)} de ${rows.length} registros`;
    document.getElementById('report-table').innerHTML = rows.slice(-20).reverse().map(row => `<tr><td>${formatArgentinaDateTime(new Date(row.created_at))}</td><td>${row.temperatura.toFixed(1)} °C</td><td>${row.humedad.toFixed(1)} %HR</td><td>${Math.round(row.presion).toLocaleString('es-AR')} Pa</td><td><span class="badge ok">Registrado</span></td></tr>`).join('') || '<tr><td colspan="5">No hay registros disponibles en las últimas 24 horas.</td></tr>';
    if (chart) chart.destroy();
    const step = Math.max(1, Math.ceil(rows.length / 144));
    const series = rows.filter((_, i) => i % step === 0);
    chart = new Chart(document.getElementById('reportChart'), {
      type: 'line',
      data: {
        labels: series.map(row => formatArgentinaTime(new Date(row.created_at))),
        datasets: [
          { label: 'Temperatura (°C)', data: series.map(row => row.temperatura), yAxisID: 'temp', borderColor: '#559cdb', fill: true, tension: .35 },
          { label: 'Humedad (%HR)', data: series.map(row => row.humedad), yAxisID: 'hum', borderColor: '#30B77E', fill: false, tension: .35 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true } }, scales: { x: { ticks: { maxTicksLimit: 12 } }, temp: { position: 'left' }, hum: { position: 'right', grid: { drawOnChartArea: false } } } }
    });
  }

  async function load() {
    const button = document.getElementById('report-refresh');
    button.disabled = true;
    try {
      const data = await window.obtenerLecturas24h();
      rows = data.map(item => ({
        created_at: item.created_at || item.fecha_hora || item.timestamp || item.fecha,
        temperatura: getNumber(item, ['temperatura', 'temp', 'temperature']),
        humedad: getNumber(item, ['humedad', 'hum', 'humidity']),
        presion: getNumber(item, ['presion', 'presion_pa', 'pressure'])
      })).filter(row => row.created_at && Number.isFinite(new Date(row.created_at).getTime()) && ['temperatura', 'humedad', 'presion'].every(key => Number.isFinite(row[key]))).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      render();
      document.getElementById('report-message').textContent = rows.length ? 'Reporte de las lecturas disponibles en Supabase durante las últimas 24 horas.' : 'No hay mediciones almacenadas para este período.';
      document.getElementById('report-export').disabled = !rows.length;
      updateTimestamp('last-update');
    } catch (error) {
      document.getElementById('report-message').textContent = `No se pudo cargar el reporte: ${error.message}`;
    } finally { button.disabled = false; }
  }

  document.getElementById('report-refresh').addEventListener('click', load);
  document.getElementById('report-export').addEventListener('click', () => {
    if (!rows.length) return;
    const csv = ['timestamp,temperatura,humedad,presion', ...rows.map(row => [row.created_at, row.temperatura, row.humedad, row.presion].join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'datalogger-reporte.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  (async () => { if (await window.protegerPagina()) await load(); })();
})();
