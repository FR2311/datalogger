# Manual de Usuario

Este apartado explica cómo utilizar la interfaz web del sistema DataLogger.

## 1. Inicio de sesión

Al ingresar al sistema se muestra la pantalla de inicio de sesión.

El usuario debe:

1. Ingresar su correo electrónico.
2. Ingresar su contraseña.
3. Opcionalmente marcar **"Recordar sesión en este dispositivo"**.
4. Presionar **"Iniciar sesión"**.

Si los datos son correctos, el sistema redirige automáticamente al Panel Principal.

La autenticación se realiza mediante Supabase Auth.

---

## 2. Panel Principal

El Panel Principal funciona como resumen general del DataLogger.

Desde esta pantalla se pueden consultar rápidamente:

- Temperatura actual.
- Humedad actual.
- Presión actual.
- Cantidad de registros.
- Evolución de las variables mediante gráficos.
- Últimas mediciones registradas.
- Estado general del dispositivo.

También se encuentra disponible un botón **Actualizar** para refrescar la información mostrada.

---

## 3. Menú de navegación

El menú lateral permite acceder a las diferentes áreas del sistema:

- Panel Principal
- Temperatura
- Humedad
- Presión
- Historial
- Base de Datos
- Configuración

Desde cualquier pantalla es posible utilizar este menú para cambiar de sección.

---

## 4. Temperatura

La sección **Temperatura** permite analizar específicamente esta variable.

El usuario puede visualizar:

- Temperatura actual.
- Valor mínimo de las últimas 24 horas.
- Valor máximo de las últimas 24 horas.
- Promedio de las últimas 24 horas.
- Gráfico de evolución.
- Últimas lecturas.

También se muestran equivalencias entre:

- Celsius (°C)
- Kelvin (K)
- Fahrenheit (°F)

Esto permite consultar la misma medición utilizando distintas unidades.

---

## 5. Humedad

La sección **Humedad** permite visualizar:

- Humedad actual.
- Mínimo registrado.
- Máximo registrado.
- Promedio.
- Evolución durante las últimas horas.
- Estado aproximado del ambiente.

El sistema contempla dos formas de representar la humedad:

- Humedad Relativa (%HR)
- Humedad Absoluta (g/m³)

También se incluye una escala visual para facilitar la interpretación de los valores.

---

## 6. Presión

La sección **Presión** muestra:

- Presión actual.
- Valor mínimo.
- Valor máximo.
- Valor promedio.
- Gráfico histórico.
- Últimas mediciones.

El sistema permite consultar equivalencias entre diferentes unidades:

- Pascales (Pa)
- Hectopascales (hPa)
- Atmósferas (atm)
- mmHg

---

## 7. Historial

La pantalla **Historial** permite consultar las mediciones anteriores almacenadas por el sistema.

El usuario puede aplicar filtros según:

- Fecha y hora inicial.
- Fecha y hora final.
- Variable.
- Intervalo de tiempo.

Las variables disponibles son:

- Temperatura.
- Humedad.
- Presión.

El historial también presenta las mediciones mediante gráficos y tablas para facilitar su análisis.

---

## 8. Base de Datos

La sección **Base de Datos** permite visualizar la información almacenada en Supabase.

Se muestran:

- Temperatura.
- Humedad.
- Presión.
- Estado.
- Fecha y hora de cada medición.

También se presenta una tabla con los registros más recientes.

En la etapa actual del proyecto pueden coexistir datos provenientes de Supabase y datos simulados utilizados durante las pruebas del sistema.

---

## 9. Configuración

Desde la sección **Configuración** el usuario puede modificar diferentes parámetros del DataLogger.

### Unidades de medida

Se puede seleccionar la unidad utilizada para cada variable.

Temperatura:

- Celsius.
- Kelvin.
- Fahrenheit.

Humedad:

- Humedad Relativa.
- Humedad Absoluta.

Presión:

- Pa.
- hPa.
- atm.
- mmHg.

### Intervalo de adquisición

El usuario puede seleccionar cada cuánto tiempo debe actualizarse la información.

Actualmente la interfaz contempla intervalos como:

- 10 segundos.
- 1 minuto.
- 5 minutos.
- 15 minutos.
- 1 hora.

### Retención de información

También puede configurarse durante cuánto tiempo conservar los datos.

Opciones disponibles:

- 7 días.
- 30 días.
- 90 días.
- 1 año.
- Sin límite.

### Alertas

Es posible definir límites mínimos y máximos para:

- Temperatura.
- Humedad.
- Presión.

Cuando una medición se encuentre fuera de los valores configurados, el sistema podrá identificarla como una situación fuera del rango esperado.

Una vez realizadas las modificaciones se debe presionar **Guardar cambios**.

---

## 10. Modo claro y oscuro

La interfaz permite cambiar entre:

- Modo claro.
- Modo oscuro.

El botón se encuentra en la parte superior de las diferentes pantallas.

La preferencia queda almacenada localmente en el navegador.

---

## 11. Actualización de datos

La información mostrada en la aplicación puede actualizarse automáticamente dependiendo del intervalo configurado.

También existen botones de actualización manual en diferentes pantallas.

El sistema utiliza la zona horaria:

`America/Argentina/Buenos_Aires`

para representar correctamente las fechas y horarios.

---

## 12. Cerrar sesión

Para salir del sistema:

1. Presionar **Cerrar sesión**.
2. La sesión activa se elimina.
3. El sistema redirige nuevamente a la pantalla de inicio de sesión.

Si el usuario había seleccionado la opción de recordar sesión, dicha preferencia también se elimina al cerrar sesión.

---

## 13. Estado actual del sistema

Actualmente la interfaz web se encuentra en desarrollo.

Ya se encuentran implementadas funcionalidades como:

- Inicio de sesión.
- Panel principal.
- Visualización de temperatura.
- Visualización de humedad.
- Visualización de presión.
- Historial.
- Configuración.
- Conexión con Supabase.
- Gráficos.
- Modo oscuro.

Parte de las mediciones utilizadas durante las pruebas todavía pueden ser simuladas.

En futuras etapas se integrarán completamente las mediciones provenientes del hardware real del DataLogger.
