/* Navegación y presentación compartidas. La adquisición y la sesión siguen en app.js/Supabase. */
(function () {
  'use strict';
  const page = location.pathname.split('/').pop() || 'index.html';
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-8h6v8"/>',
    temp: '<path d="M9 14.5V5a3 3 0 0 1 6 0v9.5a5 5 0 1 1-6 0Z"/><path d="M12 7v10"/><circle cx="12" cy="18" r="1.5"/>',
    hum: '<path d="M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M8 15a4 4 0 0 0 3 3"/>',
    pres: '<circle cx="12" cy="12" r="9"/><path d="m12 12 4-4M6 12h1m10 0h1M12 6v1M8 8l1 1"/><circle cx="12" cy="12" r="1"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
    db: '<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v14c0 4 14 4 14 0V5M5 10c0 4 14 4 14 0M5 15c0 4 14 4 14 0"/>',
    settings: '<path d="m9 3 1-1h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1Z"/><circle cx="12" cy="12" r="3"/>',
    chart: '<path d="M4 4v16h17M7 14l4-4 4 2 5-6M16 6h4v4"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4M18 9h4m-4 6h4"/>',
    swap: '<path d="M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 8 3 8 3 9H3c0-1 3-1 3-9ZM10 21h4"/>',
    chevron: '<path d="m8 10 4 4 4-4"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    save: '<path d="M4 3h13l4 4v14H3V3ZM7 3v6h10V3M7 21v-8h10v8"/>',
    refresh: '<path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6"/>',
    filter: '<path d="M3 4h18l-7 8v8l-4-2v-6Z"/>',
    file: '<path d="M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8m-8 4h8"/>',
    expand: '<path d="M14 3h7v7M21 3l-7 7M10 21H3v-7m0 7 7-7"/>'
  };
  const icon = name => `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
  const mark = () => `<svg class="brand-mark" viewBox="0 0 54 54" aria-hidden="true"><defs><pattern id="brand-grid" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="2.7" height="2.7" fill="currentColor"/></pattern></defs><circle cx="27" cy="27" r="25" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="12" y="11" width="30" height="32" fill="url(#brand-grid)"/></svg>`;
  const routes = [
    ['index.html', 'Panel Principal', 'home'], ['temperatura.html', 'Temperatura', 'temp'],
    ['humedad.html', 'Humedad', 'hum'], ['presion.html', 'Presión', 'pres'],
    ['historial.html', 'Historial', 'clock'], ['bd.html', 'Base de Datos', 'db'],
    ['configuracion.html', 'Configuración', 'settings'], ['reportes.html', 'Reportes', 'chart'],
    ['documentos.html', 'Documentos', 'file']
  ];
  const element = (tag, className, html) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };
  const headingIcon = (name, tone = '') => `<span class="heading-icon ${tone}">${icon(name)}</span>`;

  function addShell() {
    const header = element('header', 'global-header', `
      <a class="brand" href="index.html" aria-label="DataLogger, inicio">${mark()}<span>DataLogger</span></a>
      <nav class="global-nav" aria-label="Navegación principal">
        ${[['index.html','Inicio'],['index.html','Panel Principal'],['reportes.html','Reportes'],['documentos.html','Documentos'],['historial.html','Historial'],['configuracion.html','Configuración']].map(([href,label], i) => `<a href="${href}" ${((page === href && i !== 1) || (page === 'bd.html' && i === 0)) ? 'class="active" aria-current="page"' : ''}>${label}</a>`).join('')}
      </nav>
      <div class="header-tools">
        <button class="icon-button" data-dialog="search" aria-label="Buscar apartado">${icon('search')}</button>
        <button class="icon-button" data-dialog="alerts" aria-label="Ver alertas">${icon('bell')}</button>
        <button class="icon-button profile-button" data-dialog="profile" aria-label="Abrir menú de cuenta"><span class="profile-avatar"></span>${icon('chevron')}</button>
      </div>`);
    document.body.prepend(header);
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.setAttribute('aria-label', 'Variables y herramientas');
      if (!sidebar.querySelector('.sidebar-nav')) sidebar.innerHTML = `<nav class="sidebar-nav">${routes.slice(0, 7).map(([href, title]) => `<a href="${href}" class="nav-item${page === href ? ' active' : ''}">${title}</a>`).join('')}</nav>`;
      sidebar.querySelectorAll('.nav-item').forEach(link => {
        const route = routes.find(item => item[0] === link.getAttribute('href'));
        if (!route) return;
        link.innerHTML = `${icon(route[2])}<span class="nav-text">${route[1]}</span>`;
        link.title = route[1];
        link.setAttribute('aria-label', route[1]);
        if (link.classList.contains('active')) link.setAttribute('aria-current', 'page');
      });
    }
    const pageTitle = document.querySelector('.page-title');
    const titleGroup = pageTitle?.parentElement;
    if (titleGroup) {
      const icons = { 'temperatura.html': 'temp', 'humedad.html': 'hum', 'presion.html': 'pres', 'historial.html': 'chart', 'configuracion.html': 'settings', 'reportes.html': 'chart', 'documentos.html': 'file' };
      if (icons[page]) {
        const group = element('div', 'page-heading');
        titleGroup.replaceWith(group);
        group.append(element('span', 'page-emblem', icon(icons[page])), titleGroup);
      }
    }
    const actions = document.querySelector('.topbar-right');
    const badge = actions?.querySelector('.update-badge');
    if (badge) actions.prepend(badge);
    if (actions && ['index.html','historial.html','bd.html'].includes(page)) addDateControl(actions);
    document.querySelectorAll('.btn-primary, .btn-outline').forEach(button => {
      const label = button.textContent.trim();
      const glyph = /Actualizar|Sincronizar/.test(label) ? 'refresh' : /Guardar/.test(label) ? 'save' : /Restablecer/.test(label) ? 'calendar' : /Filtrar/.test(label) ? 'filter' : null;
      if (glyph) button.innerHTML = `${icon(glyph)}<span>${label.replace(/^[↻💾\s]+/u, '')}</span>`;
    });
    document.querySelectorAll('input, select').forEach(input => {
      if (!input.id) return;
      const label = input.closest('.form-group')?.querySelector('label');
      if (label) label.htmlFor = input.id;
    });
    document.querySelectorAll('.cards-grid .card').forEach((card, index) => {
      const glyph = ['temp', 'hum', 'pres', 'db'][index];
      if (!glyph) return;
      let cardIcon = card.querySelector('.card-icon');
      if (!cardIcon) {
        cardIcon = element('span', 'card-icon');
        card.querySelector('.card-header')?.append(cardIcon);
      }
      cardIcon.innerHTML = icon(glyph);
    });
  }

  function addDateControl(actions) {
    const date = element('label', 'date-control', `<span class="date-button">${icon('calendar')}<span class="date-label"></span>${icon('chevron')}</span><input type="date" aria-label="Elegir fecha de consulta">`);
    const input = date.querySelector('input');
    input.value = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });
    const update = () => {
      date.querySelector('.date-label').textContent = new Date(`${input.value}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
    };
    input.addEventListener('change', () => {
      update();
      if (page !== 'historial.html') {
        location.href = `historial.html?date=${encodeURIComponent(input.value)}`;
        return;
      }
      document.getElementById('filter-from').value = `${input.value}T00:00`;
      document.getElementById('filter-to').value = `${input.value}T23:59`;
      window.applyHistoryFilters?.();
    });
    actions.append(date);
    const queryDate = new URLSearchParams(location.search).get('date');
    if (page === 'historial.html' && /^\d{4}-\d{2}-\d{2}$/.test(queryDate || '')) {
      input.value = queryDate;
      document.getElementById('filter-from').value = `${queryDate}T00:00`;
      document.getElementById('filter-to').value = `${queryDate}T23:59`;
    }
    update();
    if (page === 'historial.html') window.applyHistoryFilters?.();
  }

  function arrangeDetail() {
    const grid = document.querySelector('.detail-grid');
    if (!grid) return;
    document.body.classList.add('detail-page');
    const extras = element('details', 'extra-detail', '<summary>Ver últimas lecturas y referencias</summary>');
    const wrapper = grid.children[1];
    [...wrapper.querySelectorAll('.stat-box')].forEach(box => {
      const label = box.querySelector('.stat-label');
      if (/Equivalencias/.test(label.textContent)) {
        label.innerHTML = `${headingIcon('swap')}Equivalencias actuales`;
        label.nextElementSibling?.classList.add('equivalence-rows');
        grid.append(box);
      } else if (/Información del sensor/.test(label.textContent)) {
        box.classList.add('sensor-box');
        label.innerHTML = `${headingIcon('chip', 'green')}Información del sensor`;
        const rows = label.nextElementSibling;
        rows.classList.add('sensor-rows');
        rows.querySelectorAll(':scope > div').forEach(row => {
          const key = row.querySelector('strong');
          const text = row.textContent.replace(key.textContent, '').trim();
          key.textContent = key.textContent.replace(':', '');
          const value = element('span', 'sensor-value');
          value.textContent = text;
          row.replaceChildren(key, value);
        });
        grid.append(box);
      } else extras.append(box);
    });
    wrapper.remove();
    const table = document.querySelector('.main > .table-section');
    if (table) extras.append(table);
    document.querySelector('.main').append(extras);
    const chartHeader = document.querySelector('.chart-header');
    const h2 = chartHeader.querySelector('h2');
    h2.innerHTML = `${headingIcon('chart')}<span>Evolución últimas 24 horas</span>`;
    h2.classList.add('chart-heading');
    const values = page === 'temperatura.html' ? [['C','°C'],['K','K'],['F','°F']] : page === 'humedad.html' ? [['RH','%HR'],['ABS','g/m³']] : [['Pa','Pa'],['hPa','hPa'],['atm','atm'],['mmHg','mmHg']];
    const select = element('select', 'unit-dropdown', values.map(([value, label]) => `<option value="${value}">${label}</option>`).join(''));
    select.setAttribute('aria-label', 'Unidad de visualización');
    const cfg = window.loadConfig?.() || {};
    select.value = page === 'temperatura.html' ? cfg.tempUnit || 'C' : page === 'humedad.html' ? cfg.humUnit || 'RH' : cfg.presUnit || 'Pa';
    select.addEventListener('change', () => {
      if (page === 'temperatura.html') window.selectTempUnit(select.value);
      else if (page === 'humedad.html') window.selectHumUnit(select.value);
      else window.selectPresUnit(select.value);
    });
    chartHeader.append(select);
    [...chartHeader.children].filter(child => child !== h2 && child !== select).forEach(child => child.hidden = true);
    document.querySelector('.topbar-right .btn-primary')?.remove();
  }

  function arrangeConfig() {
    if (page !== 'configuracion.html') return;
    document.body.classList.add('config-page');
    const icons = [['temp','green'],['calendar',''],['temp','red'],['hum',''],['pres','red'],['db','green']];
    document.querySelectorAll('.config-card h3').forEach((heading, index) => {
      const label = heading.textContent;
      heading.innerHTML = `${headingIcon(...icons[index])}<span>${label}</span>`;
    });
    document.getElementById('last-sync')?.closest('.config-card')?.querySelector('h3 + div')?.classList.add('device-info');
  }

  function arrangeDashboard() {
    if (page !== 'index.html') return;
    document.body.classList.add('dashboard-page');
    const main = document.querySelector('.main');
    const layout = element('div', 'dashboard-layout');
    const content = element('div', 'dashboard-body');
    const aside = element('aside', 'dashboard-aside');
    const cards = main.querySelector('.cards-grid');
    const chart = main.querySelector('.chart-card');
    const table = main.querySelector('.table-section');
    layout.append(content, aside);
    main.insertBefore(layout, cards);
    content.append(cards, chart);
    const cardNodes = [...cards.children];
    const summary = element('section', 'summary-card', '<h2>Resumen</h2>');
    const bindPairs = [];
    cardNodes.forEach((card, index) => {
      const row = element('div', 'summary-row', `${card.querySelector('.card-icon').outerHTML}<div><span class="summary-label">${card.querySelector('.card-label').textContent}</span><div class="summary-value"><span>--</span> <small></small></div></div>`);
      summary.append(row);
      bindPairs.push([card.querySelector('.card-value'), row.querySelector('.summary-value > span')]);
      bindPairs.push([card.querySelector('.card-unit'), row.querySelector('small')]);
      if (index === 0) {
        const badge = element('span', 'badge ok', 'Normal');
        row.append(badge);
        bindPairs.push([card.querySelector('.trend'), badge]);
      }
    });
    const progress = element('section', 'progress-card', `<h2>Progreso</h2><div class="progress-data"><p>Registros del día</p><strong id="progress-count">--</strong><small>muestras</small><hr><p>Intervalo</p><span id="progress-interval">--</span></div>`);
    aside.append(summary, progress);
    bindPairs.push([cardNodes[3].querySelector('.card-value'), progress.querySelector('#progress-count')]);
    bindPairs.push([cardNodes[3].querySelector('.trend'), progress.querySelector('#progress-interval')]);
    const sync = () => bindPairs.forEach(([source, target]) => { if (source && target) target.textContent = source.textContent; });
    sync();
    new MutationObserver(sync).observe(cards, { childList: true, subtree: true, characterData: true });
    const strip = element('div', 'device-strip', '<span class="status-dot online"></span><span>Dispositivo conectado</span>');
    content.append(strip);
    if (table) {
      const details = element('details', 'extra-detail', '<summary>Ver últimas lecturas</summary>');
      details.append(table);
      content.append(details);
    }
    const controls = chart.querySelector('.ds-controls');
    if (controls) {
      const details = element('details', 'chart-settings', '<summary>Personalizar series y colores</summary>');
      details.append(controls);
      chart.append(details);
    }
    const expand = element('button', 'icon-button', icon('expand'));
    expand.setAttribute('aria-label', 'Ampliar gráfico');
    expand.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else chart.requestFullscreen?.();
    });
    chart.querySelector('.chart-header').append(expand);
    const sessionButton = main.querySelector('[onclick="cerrarSesion()"]');
    if (sessionButton) sessionButton.hidden = true;
  }

  function arrangeHistory() {
    if (page !== 'historial.html') return;
    document.body.classList.add('history-page');
    const actions = element('div', 'history-actions');
    const section = document.querySelector('.table-section .section-header');
    document.querySelectorAll('.topbar-right button:not(.dark-toggle)').forEach(button => actions.append(button));
    section.append(actions);
    document.querySelectorAll('.legend-dot').forEach((dot, index) => dot.style.background = index ? '#81bfe7' : '#4f7fac');
  }

  function addDialogs() {
    const dialog = element('dialog', 'ui-dialog');
    document.body.append(dialog);
    const close = () => dialog.close();
    const show = (title, content) => {
      dialog.innerHTML = `<div class="dialog-heading"><h2>${title}</h2><button class="icon-button" aria-label="Cerrar ventana">${icon('close')}</button></div>${content}`;
      dialog.querySelector('.icon-button').addEventListener('click', close);
      dialog.showModal();
    };
    document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => {
      const kind = button.dataset.dialog;
      if (kind === 'search') {
        show('Buscar en DataLogger', '<div class="form-group"><label for="navigation-search">Nombre del apartado</label><input id="navigation-search" type="search" placeholder="Temperatura, historial, configuración…"></div><nav class="search-results" aria-label="Resultados de búsqueda"></nav>');
        const input = dialog.querySelector('input');
        const render = () => {
          const needle = input.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          const matches = routes.filter(route => route[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(needle));
          dialog.querySelector('.search-results').innerHTML = matches.map(([href, title, glyph]) => `<a href="${href}">${icon(glyph)}${title}</a>`).join('') || '<p>No se encontraron apartados.</p>';
        };
        input.addEventListener('input', render);
        render();
        input.focus();
      } else if (kind === 'alerts') {
        show('Estado y alertas', '<div id="dialog-alert-content"></div><div class="search-results"><a href="configuracion.html">Configurar límites de alerta</a></div>');
        const text = element('p');
        const status = document.getElementById('estado')?.textContent || document.querySelector('.card .trend')?.textContent || '';
        text.textContent = status ? `Estado actual: ${status}. Los límites se pueden modificar en Configuración.` : 'Las alertas visuales se muestran junto a las lecturas. Consultá las mediciones y los límites en Configuración.';
        dialog.querySelector('#dialog-alert-content').append(text);
      } else {
        show('Tu cuenta', `<nav class="search-results"><a href="configuracion.html">${icon('settings')}Preferencias y configuración</a><a href="documentos.html">${icon('file')}Ayuda y documentos</a><a href="#" id="profile-signout">Cerrar sesión</a></nav>`);
        dialog.querySelector('#profile-signout').addEventListener('click', async event => {
          event.preventDefault();
          try { await window.cerrarSesion(); } catch { dialog.querySelector('#profile-signout').textContent = 'No se pudo cerrar la sesión. Reintentá.'; }
        });
      }
    }));
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
    });
  }

  function styleCharts() {
    if (!window.Chart) return;
    Chart.defaults.font.family = 'DataLogger UI, Segoe UI, sans-serif';
    Chart.register({
      id: 'referenceDesign',
      beforeUpdate(chart) {
        chart.options.maintainAspectRatio = false;
        const dark = document.body.classList.contains('dark');
        Object.values(chart.options.scales || {}).forEach(scale => {
          if (scale.grid) scale.grid.color = dark ? '#ffffff0c' : '#edf3f7';
          if (scale.border) scale.border.display = false;
          if (scale.ticks) {
            scale.ticks.color = dark ? '#a1b1c1' : '#8fa0ae';
            scale.ticks.font = { ...(scale.ticks.font || {}), family: 'DataLogger UI', size: 11 };
            scale.ticks.maxTicksLimit = scale.axis === 'x' ? 12 : 7;
          }
        });
        if (chart.canvas.id === 'mainChart') {
          chart.options.scales.y.min = 0;
          chart.options.scales.y.max = 100;
          chart.options.scales.y.ticks.callback = value => value;
          chart.options.scales.y.ticks.stepSize = 25;
        }
        chart.data.datasets.forEach((dataset, index) => {
          if (chart.config.type === 'bar') {
            dataset.backgroundColor = index ? '#81bfe7' : '#4f7fac';
            dataset.borderRadius = 3;
          } else {
            if (chart.canvas.id !== 'mainChart') dataset.borderColor = '#559cdb';
            dataset.borderWidth = 2;
            dataset.pointRadius = 0;
            const gradient = chart.ctx.createLinearGradient(0, 0, 0, chart.height || 250);
            gradient.addColorStop(0, `${dataset.borderColor}32`);
            gradient.addColorStop(1, `${dataset.borderColor}04`);
            dataset.backgroundColor = gradient;
          }
        });
        if (chart.canvas.id === 'histChart') chart.options.plugins.legend.display = false;
      }
    });
    document.querySelectorAll('.chart-card canvas').forEach(canvas => {
      const chart = Chart.getChart(canvas);
      if (chart) { chart.resize(); chart.update('none'); }
    });
    window.addEventListener('datalogger:configchange', () => Object.values(Chart.instances).forEach(chart => chart.update('none')));
  }

  function init() {
    if (page === 'login.html') {
      document.querySelector('.login-brand .logo-icon')?.replaceWith(element('span', '', mark()));
      return;
    }
    if (!document.querySelector('.main')) return;
    addShell();
    arrangeDetail();
    arrangeConfig();
    arrangeDashboard();
    arrangeHistory();
    document.querySelectorAll('.chart-card > canvas').forEach(canvas => {
      const frame = element('div', 'chart-frame');
      canvas.replaceWith(frame);
      frame.append(canvas);
    });
    addDialogs();
    styleCharts();
    document.dispatchEvent(new CustomEvent('datalogger:interface-ready'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
