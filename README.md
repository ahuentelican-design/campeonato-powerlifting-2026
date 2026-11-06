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

## Configuración de barra e inventario

- Desde **Inventario de discos**, en el menú lateral, se configura para cada peso la **cantidad de pares** y su **color**.
- La **Mesa de levantamientos** muestra una representación de los discos de un lado de una barra fija de **20 kg**. Se debe cargar el otro lado de forma simétrica.
- Se puede seleccionar manualmente al deportista que está en plataforma desde la columna **En plataforma**; de lo contrario se presenta el primer intento pendiente con una carga declarada, de menor a mayor peso.
- El panel funciona en sentadilla, press banca y peso muerto, para las tres rondas.
- El cálculo respeta los pares disponibles en el inventario y avisa cuando la carga no puede componerse exactamente. No incluye el peso de los collarines.
- Las preferencias de discos quedan en el mismo almacenamiento local y se exportan con el respaldo JSON.

## Jueces configurables

En **Configuración → Jueces de la competencia** se seleccionan de 1 a 7 jueces y se ingresan nombres y apellidos. En la mesa se muestran sus iniciales, por ejemplo **J. A.H.** (Alejandro Huentelican), con botones circulares verdes (válido) y rojos (nulo). La mayoría necesaria es `floor(número de jueces / 2) + 1`. Si se configura un número par y los votos empatan, el resultado es **Empate**, no válido. Cambiar la cantidad de jueces puede recalcular resultados anteriores; los votos se conservan en el respaldo JSON.

## Distribución posterior a inscripción — grupos A y B

Después de registrar los deportistas y sus cargas iniciales de sentadilla (SQ) y press banca (BP), utiliza **Inscripciones → Distribuir automáticamente A/B**. El algoritmo ordena por SQ+BP, reparte de dos en dos y elige entre A y B buscando reducir las diferencias de carga total inicial en ambos ejercicios. No cambia las cargas ni los votos. Permite ajustar manualmente la asignación desde la columna **Grupo A/B** antes de confirmarla.

Al seleccionar **Confirmar y cerrar nómina**, se desactivan inscripciones, edición de deportistas y cambios de grupo, y se habilita **Exportar nómina CSV**. El archivo contiene solamente ID estable, nombre, categoría, sexo, peso, división, grupo y cargas iniciales de SQ/BP/DL; no incluye decisiones de jueces ni resultados.

**Importante:** este paso prepara la nómina maestra, pero la importación CSV especializada por tarima y la posterior consolidación de resultados todavía no están implementadas. Se mantiene por separado el respaldo JSON completo de cada navegador.

## Tarimas SQ y BP: selección de grupo y revisión en Configuración

- **Configuración → Tarimas SQ / BP · Revisión de grupos** muestra la distribución fija: etapa 1 (SQ/A y BP/B), etapa 2 (SQ/B y BP/A) y etapa 3 (peso muerto conjunto). Incluye nóminas, identificadores y cargas iniciales de SQ y BP por grupo. Para cambiar asignaciones, se utiliza Inscripciones antes de cerrar la nómina o tras reabrirla.
- **Mesa de levantamientos:** en SQ y BP aparece un selector `Grupo A / Grupo B / Todos`. Los filtros de SQ y BP son independientes, se restablecen al recargar la página y comienzan respectivamente en A y B, correspondientes a la primera rotación. La selección solo filtra la vista y el orden; **no borra ni modifica los intentos** del otro grupo.
- **Peso muerto** siempre muestra todos los deportistas, sin filtro por grupo.
- Si aún no se han asignado grupos, la mesa muestra todos los participantes y señala que falta distribución.

**Nota:** la elección de grupo es local a este navegador, no una configuración compartida entre computadores. No incluye aún importación CSV entre tarimas ni consolidación de resultados.
