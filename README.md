# Campeonato Powerlifting 2026 — Mesa de Control

Aplicación web estática para gestionar un campeonato escolar de powerlifting. Lista para **GitHub Pages**. No necesita instalación ni servidor.

## Funciones

- Inscripción de deportistas con peso corporal, grupo y sexo.
- **Escolar Menor y Escolar Mayor:** divisiones Ligero/Pesado (umbrales editables) y podios por sexo; clasificación por suma de mejores intentos válidos.
- **Exalumnos:** categoría **abierta mixta**, sin divisiones de peso; podio único por **rendimiento relativo = total válido / peso corporal**.
- Orden de levantamiento por carga declarada de cada intento en sentadilla, press banca y peso muerto.
- Tres jueces con votos `V`, `F` o sin decisión. **Dos o más V = válido; dos o más F = nulo; de otro modo pendiente.**
- Tres intentos por movimiento, resultados, podios, exportación de listados/acta CSV.
- Respaldo integral JSON para guardar e importar datos.
- Inicio vacío con botón opcional para cargar **35 participantes ficticios**.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `campeonato-powerlifting-2026`).
2. Sube los archivos `index.html`, `styles.css`, `app.js` y `README.md` a la rama `main`.
3. Ve a **Settings → Pages → Build and deployment** y elige **Deploy from a branch**, `main`, carpeta `/ (root)`.
4. Abre la URL que GitHub Pages indique para el repositorio.

También puedes abrir `index.html` directamente en un navegador para uso local.

## Muy importante: datos

La aplicación es completamente estática y usa `localStorage` del navegador. Los registros **no se sincronizan** entre computadoras ni se almacenan en GitHub. Al cambiar de equipo, navegador o borrar datos del navegador, podrías perder los datos si no exportaste un respaldo JSON. Idealmente usa **un solo equipo en la mesa de control** y exporta respaldos periódicos.

## Reglas y supuestos

- Se exige al menos un intento válido en cada uno de los 3 movimientos para registrar un total clasificable.
- Los empates se resuelven provisionalmente por menor peso corporal y, después, por nombre. Debes confirmar las bases oficiales antes del campeonato.
- El indicador relativo implementado es **total / peso corporal**, no IPF GL Points ni otra fórmula de coeficientes oficiales.
- Los límites de peso iniciales son **referenciales** y deben ajustarse en Configuración.
- El orden de salida considera cargas declaradas por intento; no implementa automáticamente todos los criterios de orden de una federación.
- La aplicación está pensada como prototipo operativo; confirmar con jueces/bases las reglas oficiales antes de su uso competitivo.

## Archivos

- `index.html`: estructura principal.
- `styles.css`: interfaz responsive.
- `app.js`: lógica de competencia, persistencia y exportación.
- `README.md`: instrucciones y reglas.

Sin dependencias, frameworks, conexiones externas ni cookies de terceros.