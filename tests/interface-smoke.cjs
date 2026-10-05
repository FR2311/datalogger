/* Prueba de interfaz con sesión y respuestas de Supabase controladas, sin escribir en servicios externos. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const root = path.resolve(__dirname, '..');
const screenshots = path.join(__dirname, 'previews');
const rows = Array.from({ length: 24 }, (_, i) => ({
  created_at: new Date(Date.now() - (23 - i) * 60000).toISOString(),
  temperatura: +(24 + Math.sin(i / 2) * 2).toFixed(1),
  humedad: +(60 + Math.sin(i / 3) * 3).toFixed(1),
  presion: Math.round(101000 + Math.sin(i / 3) * 300), estado: 'Normal'
}));
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, `.${url.pathname === '/' ? '/index.html' : url.pathname}`);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.ttf': 'font/ttf' })[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  fs.mkdirSync(screenshots, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await puppeteer.launch({ ...(fs.existsSync(chromePath) ? { executablePath: chromePath } : {}), headless: true });
  const failures = [];
  try {
    for (const name of ['index', 'temperatura', 'humedad', 'presion', 'historial', 'bd', 'configuracion', 'reportes', 'documentos', 'login']) {
      if (!fs.existsSync(path.join(root, `${name}.html`))) continue;
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewport({ width: 1600, height: 900 });
      await page.evaluateOnNewDocument(() => sessionStorage.setItem('datalogger_tab_session', '1'));
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('@supabase/supabase-js')) {
          return request.respond({ contentType: 'application/javascript', body: 'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:"test-session",user:{email:"test@example.com"}}},error:null}),signOut:async()=>({error:null})}})};' });
        }
        if (request.url().includes('.supabase.co/rest/v1/')) return request.respond({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,apikey,accept', 'Access-Control-Allow-Methods': 'GET,OPTIONS' }, body: request.method() === 'OPTIONS' ? '' : JSON.stringify(rows) });
        return request.continue();
      });
      await page.goto(`${origin}/${name}.html`, { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts.ready);
      if (name !== 'login') {
        await page.waitForSelector('.global-header');
        const structure = await page.evaluate(() => ({
          nav: document.querySelectorAll('.global-nav a').length,
          rail: document.querySelectorAll('.sidebar .nav-item').length,
          overflow: document.documentElement.scrollWidth > innerWidth,
          details: document.querySelectorAll('.detail-grid > .stat-box').length
        }));
        assert.equal(structure.nav, 6, `${name}: navegación superior`);
        assert.equal(structure.overflow, false, `${name}: desborde en escritorio`);
        if (['temperatura','humedad','presion'].includes(name)) assert.equal(structure.details, 2, `${name}: tres tarjetas de detalle`);
        await page.click('[data-dialog="search"]');
        await page.type('#navigation-search', 'humedad');
        assert.equal(await page.$eval('.search-results a', a => a.getAttribute('href')), 'humedad.html');
        await page.click('.ui-dialog .icon-button');
        if (['temperatura','humedad','presion'].includes(name)) {
          const value = ({ temperatura: 'F', humedad: 'ABS', presion: 'hPa' })[name];
          await page.select('.unit-dropdown', value);
          await page.select('.unit-dropdown', ({ temperatura: 'C', humedad: 'RH', presion: 'Pa' })[name]);
        }
        if (name === 'configuracion') {
          await page.select('#cfg-temp-unit', 'K');
          await page.click('[onclick="saveConfigForm()"]');
          assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('datalogger_config')).tempUnit), 'K');
          await page.select('#cfg-temp-unit', 'C');
          await page.click('[onclick="saveConfigForm()"]');
          await page.evaluate(() => document.getElementById('toast').style.display = 'none');
        }
        if (name === 'bd') assert.equal(await page.$eval('#errorBox', node => getComputedStyle(node).display), 'none', 'BD: respuestas del servicio consumidas');
        if (name === 'reportes') assert.equal(await page.$eval('#report-count', node => node.textContent), '24', 'Reportes: estadísticas de registros recibidos');
        if (name === 'historial') {
          await page.select('#filter-var', 'pres');
          await page.click('.filter-bar .btn-primary');
          assert.equal(await page.evaluate(() => Chart.getChart(document.getElementById('histChart')).data.datasets[0].label), 'Presión (Pa)');
          await page.select('#filter-var', 'all');
          await page.click('.filter-bar .btn-primary');
          await page.click('#history-next');
          assert.ok((await page.$eval('#history-page-count', node => node.textContent)).includes('21'), 'Historial: paginación');
          await page.click('#history-prev');
          await page.$eval('#filter-from', input => { input.value = '2099-01-01T00:00'; });
          await page.click('.filter-bar .btn-primary');
          assert.ok((await page.$eval('#table-hist', node => node.textContent)).includes('No hay lecturas'), 'Historial: sin resultados');
          await page.$eval('#filter-from', input => { input.value = ''; });
          await page.click('.filter-bar .btn-primary');
        }
        const darkButton = await page.$('#dark-toggle-btn');
        if (darkButton) {
          await darkButton.click();
          assert.equal(await page.evaluate(() => document.body.classList.contains('dark')), true, `${name}: modo oscuro`);
          await page.screenshot({ path: path.join(screenshots, `${name}-dark.png`) });
          await darkButton.click();
        }
      }
      await new Promise(resolve => setTimeout(resolve, 750));
      await page.screenshot({ path: path.join(screenshots, `${name}-desktop.png`) });
      await page.setViewport({ width: 390, height: 844 });
      await new Promise(resolve => setTimeout(resolve, 180));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: desborde móvil`);
      await page.screenshot({ path: path.join(screenshots, `${name}-mobile.png`) });
      if (errors.length) failures.push({ name, errors });
      console.log(`${name}: escritorio y móvil comprobados${errors.length ? ' (errores de JS)' : ''}`);
      await page.close();
    }
    assert.deepEqual(failures, [], 'No debe haber errores de JavaScript');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
