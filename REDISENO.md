# DataLogger — interfaz web

Diseño adaptado a las referencias: cabecera horizontal, navegación lateral de iconos, superficies claras, tarjetas azules de lectura, gráficos de líneas y barras, resumen lateral del panel y configuración en cuatro columnas en escritorio. En móviles, la navegación de variables aparece como una barra inferior.

## Pantallas

Panel Principal, Temperatura, Humedad, Presión, Historial, Base de Datos, Configuración, Reportes, Documentos e inicio de sesión. Las páginas comparten `interface.css` e `interface.js`; conservan sus identificadores y funciones de `app.js` y la sesión de `supabase-api.js`.

Reportes consulta las últimas 24 horas disponibles en Supabase y exporta CSV. Documentos incluye el manual y ayuda de uso. La lupa busca apartados, el selector de fecha abre el historial y el menú de cuenta permite cerrar sesión. Los selectores de unidades, filtros, paginación, exportación CSV y modo oscuro están conectados a la interfaz existente.

## Abrir la interfaz

Desde esta carpeta, ejecutar `python -m http.server 8080` y abrir `http://localhost:8080/login.html`. Usar las credenciales existentes de Supabase. Si había una página abierta antes del cambio, recargar con Ctrl+F5.

Las mediciones del panel, las variables y el historial conservan la demostración que tenía este proyecto. Base de Datos conserva su consulta a Supabase y su fallback simulado; Reportes muestra los registros disponibles sin generar reemplazos. El firmware y la carpeta `DATALOGGER_LISTO_PARA_ESP32` no se modificaron en este rediseño.

## Verificación de interfaz

`npm install` y `npm run test:ui` ejecutan la revisión en Chromium con Puppeteer. Se verifican las diez páginas en escritorio (1600×900) y móvil (390×844), errores JavaScript, búsqueda, unidades, filtros, paginación, preferencias y modo oscuro. Las pruebas usan una sesión y respuestas de Supabase controladas; no escriben en servicios externos ni validan el hardware. Las capturas se generan en `tests/previews/`.

La tipografía Plus Jakarta Sans se incluye localmente en `assets/fonts`, junto a su licencia OFL.
