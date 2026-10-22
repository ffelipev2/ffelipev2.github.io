# Implementación SEO y marca personal: fase 1

Fecha: **17 de octubre de 2026**. Base: `27f05d3`.

**Estado: publicada y verificada el 17 de octubre de 2026 (America/Santiago), commit `48b6d2b`.** Se leyeron completos [PLAN-SEO-CONTENIDOS.md](PLAN-SEO-CONTENIDOS.md) y [PROPUESTA-MARCA-PERSONAL.md](PROPUESTA-MARCA-PERSONAL.md). Se aplicó la autorización de esta fase, con prioridad al objetivo y tono de marca y al mensaje de referencia aportado por Felipe.

## Cambios realizados

### Inicio

- El H1 sigue siendo **Felipe Flores**. Se conserva la identidad **Felipe Flores Valdebenito · Ingeniero Civil Informático**, el magíster, las áreas de trabajo y las referencias a laboratorios, docencia e Industria 4.0.
- La apertura adopta la voz de una persona que explora tecnología mediante proyectos y comparte su funcionamiento. Se evita repetir el título profesional, que aparece inmediatamente encima.
- Se alinean título, metadescripción, Open Graph y Twitter. Se mantiene la ubicación profesional en Chile dentro de la descripción.
- Se actualizan los encabezados de proyectos y perfil, y la invitación de contacto pasa a centrarse en preguntas e intercambio de ideas. Los botones y sus destinos se conservan.
- Se mantienen exactamente las tres tarjetas, su orden, títulos, imágenes y enlaces. Solo cambia la descripción de UFACTORY.
- Se conservan los tres apoyos actuales de áreas de trabajo. La alternativa «Construir / Entender / Compartir» del documento de marca no se aplica en esta fase, para mantener esas referencias visibles junto a la nueva presentación.

### UFACTORY

H1 y título SEO explican la clasificación por QR. La arquitectura sigue una secuencia legible: cámara USB → detección y decodificación con OpenCV → asociación de etiqueta a destino en Python → órdenes de movimiento mediante xArm → supervisión Flask.

Se conservan la metadescripción, el propósito educativo y el resto del caso, incluidas sus limitaciones: recogida y destinos predefinidos, bloqueo de rutinas simultáneas y contadores que registran rutinas iniciadas sin verificar el depósito correcto. No se añaden cifras, pruebas o experiencias personales.

### Gemelo Digital

Se concreta el H1 y se aclara qué hace el sensor, qué transmite el ESP32-C3 y qué reproduce Android. El título SEO y la metadescripción se conservan.

El recurso **Firmware del ESP32-C3** apunta ahora a:

<https://github.com/ffelipev2/GemeloDigitalEsp32/blob/main/GemeloDigitalEsp32/GemeloDigitalEsp32.ino>

Se comprobó HTTP 200 tanto en esa página de GitHub como en su archivo raw **antes de editar el dato**. También se comprobaron de nuevo los seis recursos enlazados de UFACTORY y Gemelo tras el cambio: todos respondieron HTTP 200.

No se cambian fotografías, vídeo, leyendas ni la distinción existente entre demostración original y firmware actual. Se conservan calibración, retorno a cero y las explicaciones sobre pruebas simuladas y parámetros configurados.

### ESP32, IoT y Robótica

Se aplican literalmente las tres introducciones propuestas en el documento de marca. Diferencian los casos por sus aplicaciones y por relaciones documentadas entre sensores, comunicación, software y movimiento.

Los tres temas conservan título SEO, metadescripción, H1, tarjetas, rutas y navegación. No se asigna un transporte no documentado a HiGrow ni se incorpora LoRa a nuevas áreas.

## Antes y después

| Elemento | Antes | Después |
| --- | --- | --- |
| Inicio: título SEO y títulos sociales | Felipe Flores \| IoT, Industria 4.0, ESP32 y Robótica | Felipe Flores \| Proyectos de IoT, ESP32 y robótica |
| Inicio: metadescripción | Felipe Flores Valdebenito, Ingeniero Civil Informático en Chile. Explora proyectos de IoT, ESP32, robótica y automatización, además de su experiencia en Industria 4.0 y educación tecnológica. | Soy Felipe Flores, Ingeniero Civil Informático en Chile. Comparto proyectos de IoT, ESP32, robótica y automatización y explico cómo funcionan. |
| Apertura | Diseño laboratorios, cursos y proyectos aplicados que integran IoT, automatización, fabricación digital e innovación educativa con desafíos reales. | Me gusta explorar la tecnología llevándola a la práctica. Aquí comparto proyectos de IoT, ESP32, robótica y automatización, explicando cómo funcionan y lo que aprendo al desarrollarlos. |
| Encabezado de proyectos | Soluciones tecnológicas que enseñan, conectan e innovan. | Ingeniería, tecnología y proyectos reales. |
| Encabezado del perfil | Tecnología aplicada para enseñar, innovar y construir. | Ingeniería, curiosidad y aprendizaje. |
| Tarjeta UFACTORY | Clasificación automatizada de objetos mediante visión artificial. | Un brazo UFACTORY Lite 6 clasifica piezas identificadas con QR. OpenCV lee las etiquetas y un panel Flask muestra el proceso. |
| UFACTORY: H1 | Brazo robótico UFACTORY LITE 6 | Brazo UFACTORY Lite 6: clasificación de objetos por QR |
| UFACTORY: título SEO | UFACTORY Lite 6 con visión artificial \| Felipe Flores | UFACTORY Lite 6: clasificación QR con OpenCV \| Felipe Flores |
| Gemelo: H1 | Gemelo Digital | Gemelo digital con ESP32-C3, BNO08x y Android |
| Gemelo: firmware | Archivo `.ino` en la raíz del repositorio, destino roto registrado en el plan | Archivo `.ino` dentro de la subcarpeta `GemeloDigitalEsp32/`, destino verificado |

Las introducciones completas están en `scripts/site-config.mjs`; coinciden con las propuestas de la sección 6 del documento de marca.

## Archivos modificados

| Fuente | Motivo |
| --- | --- |
| `index.html` | Portada mantenida manualmente: presentación, metadatos, dos encabezados, descripción de la tarjeta UFACTORY y párrafo de contacto. |
| `data/projects.json` | H1, descripción, arquitectura y recurso de Gemelo; H1, título SEO y arquitectura de UFACTORY. |
| `scripts/site-config.mjs` | Únicamente las introducciones de ESP32, IoT y Robótica. |
| `tests/hero.spec.js` | Actualizar la expectativa del H1 de Gemelo al texto autorizado; conservar la prueba de navegación, escena, menú y ausencia de errores. |
| `docs/IMPLEMENTACION-SEO-MARCA-FASE-1.md` | Registro de implementación, comparación, validación y pendientes. |

El build regenera estos doce HTML; no se editaron directamente:

- `esp32/index.html`
- `iot/index.html`
- `robotica/index.html`
- `industria-4-0/index.html`
- `proyectos/index.html`
- `proyectos/gemelo-digital/index.html`
- `proyectos/ufactory-lite-6/index.html`
- `proyectos/calidad-aire-esp32-s3/index.html`
- `proyectos/ethernet-sensor-biometrico/index.html`
- `proyectos/huskylens-esp32/index.html`
- `proyectos/robot-otto-arduino-3d/index.html`
- `proyectos/sensor-higrow-esp32-app/index.html`

La propagación adicional corresponde a nombres, resúmenes y referencias estructuradas de UFACTORY o Gemelo usados en tarjetas y proyectos relacionados. El HTML de HiGrow cambia por su referencia a Gemelo; **su contenido técnico y sus datos fuente no se amplían**. El HTML de Chat LoRa no cambia.

## Validación

- `npm run build`: correcto. Genera desde las fuentes y valida 18 HTML, diez proyectos y 17 URLs del sitemap.
- `npm test`: correcto. Valida metadatos, enlaces internos, fragmentos, recursos, alcance desde inicio, accesibilidad básica y sintaxis JavaScript.
- `npm run test:browser -- --reporter=line`: **108 aprobadas, 48 omitidas por condiciones de plataforma y cero fallidas**, en 6,0 minutos. Se ejecutó después de los cambios en escritorio Chrome, tablet Chrome, Android Chrome e iOS WebKit emulados. Incluye navegación, menú, vídeo, escena 3D, scroll, reducción de movimiento, contraste y SEO con/sin JavaScript. No se deshabilitó ninguna prueba.
- Revisión adicional de doce vistas: inicio, UFACTORY, Gemelo y los tres temas, a **1440 × 900** y **390 × 844**. HTTP 200, un H1, canonical esperada, metadatos sociales alineados y ausencia de desbordes horizontales.
- Se revisaron visualmente las capturas de portada, UFACTORY y Gemelo en ambas anchuras. La longitud de los nuevos H1 modifica sus saltos de línea y la altura del texto, conservando tipografía, columnas, botones e imágenes. No fue necesario modificar CSS.
- Se compararon las **17 canonical**, todas las etiquetas de imagen y los destinos de enlaces con la base. Solo cambia el destino externo autorizado del firmware. El número de enlaces se conserva.
- Únicamente cambian título y descripción SEO de inicio y título SEO de UFACTORY. Los metadatos de Gemelo y de los temas se mantienen.
- Se compararon hashes SHA-256: sitemap, robots, CNAME, CV, imágenes, CSS y JavaScript conservan sus bytes, incluido el bundle 3D recompilado. No se añadieron dependencias ni se modificó el generador.
- La experiencia, formación/publicaciones, tecnologías, identidad profesional y los apoyos de áreas de la portada se compararon por su HTML y permanecen iguales.
- Los objetos de datos de LoRa y HiGrow se compararon con la base y permanecen iguales.
- `git diff --check`: correcto.

Las capturas y comprobaciones locales están en `dist/seo-marca-fase1/`, excluido de Git. Incluyen `before/`, `after/`, `baseline.json`, `validation.json`, `integrity.json` y `external-links.json`. Las pruebas de navegador conservan sus artefactos en `test-results/`.

## Publicación verificada

Felipe autorizó la publicación el 17 de octubre de 2026 con la instrucción «publicalo». El commit `48b6d2b611041a411c26b1c5adc37807c4ffdfb5` se subió a `main` y el [despliegue de GitHub Pages](https://github.com/ffelipev2/ffelipev2.github.io/actions/runs/39091572852) terminó con estado `completed` y conclusión `success`.

Las comprobaciones de producción quedaron registradas con fecha **23:53 del 17 de octubre, America/Santiago** (`2026-10-18T02:53:02.783Z`):

- Las 17 páginas del sitemap respondieron HTTP 200 por HTTPS, sin redirecciones, y coincidieron byte por byte con los HTML locales validados.
- Se confirmaron la nueva presentación de inicio, los encabezados y títulos publicados y el enlace correcto al firmware de Gemelo, cuyo destino respondió HTTP 200.
- `robots.txt`, `sitemap.xml` y el CV PDF respondieron HTTP 200 y coincidieron con sus archivos locales, conservados sin cambios.

El resultado local está en `dist/seo-marca-fase1/deployment.json`, excluido de Git. **T0 para la medición editorial de 30/60 días es el 17 de octubre de 2026.** No se ha obtenido una nueva exportación de Search Console.

## Pendientes del propietario y límites de esta fase

- **LoRa, estado al cierre de esta fase:** faltaban placas, módulos, interfaz, configuración, conexiones y código. Este pendiente técnico se resolvió posteriormente con la ampliación publicada el 21 de octubre de 2026 (`7e6773f`); su publicación verificada, fuentes y ampliaciones opcionales están en la sección 6.5 del [plan SEO](PLAN-SEO-CONTENIDOS.md). La fase 1 no supuso ESP32, LoRaWAN, malla, cifrado ni alcance.
- **HiGrow, estado al cierre de esta fase:** faltaban revisión, variables, sensores, transporte, app, conexiones, capturas y código. La ampliación publicada el 22 de octubre de 2026 (`41cc62c`) los incorpora desde HiGrow-ESP32-BLE; su publicación verificada y las fuentes están en la sección 6.4 del [plan SEO](PLAN-SEO-CONTENIDOS.md). La fase 1 no supuso riego, plataforma o protocolo.
- **Decisiones y aprendizajes:** relato de Felipe sobre motivaciones, dificultades realmente encontradas y qué haría distinto. No se añadió ningún campo de aprendizajes ni nuevas historias personales.
- **CV y EQA:** el plan registra **2021–2020** en el texto extraído del PDF frente a **2020–2021** en la web. Confirmar el rango correcto y aportar el editable cuando se retome ese trabajo. No se corrigió ninguna fecha ni se editó el PDF.

Las comprobaciones de interfaz usan navegadores y dispositivos emulados; no sustituyen pruebas en teléfonos físicos. Este registro no verifica variaciones de CTR ni posiciones en Google: documenta el cambio publicado y su punto de partida para la medición. Los demás pendientes documentales y de mantenimiento están en la sección 8 del plan SEO.
