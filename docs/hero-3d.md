# Evolución del portfolio — hero 3D

## Lo que se conservó

El sitio sigue siendo HTML, CSS y JavaScript sin framework. Se reutilizan las secciones, navegación, tipografía Inter/system, H1, mensaje profesional, retrato, botones, CV, imágenes, nueve proyectos en JSON, publicaciones, experiencia, formación, certificaciones y contacto. No se inventaron proyectos ni antecedentes. Las páginas de proyectos conservan sus metadatos, enlaces canónicos y datos estructurados; solo cambia el color del navegador.

La referencia se utilizó para color, iluminación y narrativa física/digital, sin reproducir su layout ni usar la imagen como fondo. El contenido principal nunca está dentro del canvas.

## Archivos y cambios

| Archivo | Responsabilidad / cambio |
| --- | --- |
| `index.html` | Contenedor del hero, escena decorativa, alternativa HTML, etiquetas y enlace a los proyectos; carga diferida del módulo. Mantiene los textos y el retrato. |
| `css/portfolio.css` | Tokens oscuros centralizados y sustitución de colores claros en superficies, textos, enlaces, botones, menú, cards, avisos y páginas interiores. Retira las reglas de entrada del retrato que dejaron de utilizarse. |
| `css/hero-3d.css` | Integración de la escena, encuadre del retrato, sticky de escritorio, tamaño móvil y alternativa sin movimiento. |
| `js/portfolio.js` | El hero deja de participar en animaciones de entrada; corrección de devolución de foco y carrera al abrir/cerrar el menú móvil en Safari. |
| `js/hero-3d.js` | Carga diferida, scroll, visibilidad, preferencias, adaptación, recuperación por fallback y ciclo de vida. |
| `js/hero/scene.js` | Cinco estaciones de geometría original, iluminación, conexiones, etiquetas y liberación de GPU. |
| `js/hero/camera-rig.js` | Cámara de perspectiva con FOV constante y recorrido suave por scroll. |
| `js/hero/scene.bundle.js` | Salida minificada generada, lista para hosting estático. |
| `js/hero/THREE-LICENSE.txt` | Licencia MIT de Three.js, copiada por el build. |
| `scripts/build-hero.mjs` | Compilación y minificación con esbuild, conservación de licencia y medición de tamaño. |
| `scripts/build-site.mjs` | Actualización de `theme-color` en el generador. |
| `proyectos/index.html` y nueve `proyectos/*/index.html` | Salida regenerada: únicamente el nuevo `theme-color`. |
| `scripts/build-sites-worker.mjs` | Incluye y verifica el módulo diferido y sus recursos en la distribución del worker. |
| `scripts/validate-site.mjs` | Comprueba sintaxis de los módulos nuevos y excluye salidas temporales. |
| `package.json`, `package-lock.json` | Versiones fijadas de Three.js, esbuild y Playwright; comandos de compilación y pruebas. |
| `playwright.config.js`, `tests/hero.spec.js`, `tests/rendering.spec.js` | Pruebas de navegador, fallbacks, accesibilidad, contraste y presupuesto de renderizado. |
| `.gitignore` | Excluye capturas y resultados temporales. |
| `README.md`, `docs/hero-3d.md` | Instrucciones reproducibles y documentación de la entrega. |

## Paleta final

| Uso | Color |
| --- | --- |
| Fondo continuo | `#07111F` |
| Cards y superficies | `#0D1B2A` |
| Superficie elevada | `#112233` |
| Datos y acciones principales | `#16B8E6` |
| Enlaces y digital luminoso | `#3BD6FF` |
| Hardware e industria | `#F59E42` |
| Texto principal | `#F3F7FA` |
| Texto secundario | `#9AAABD` |
| Bordes discretos | `rgba(255,255,255,0.08)` |
| Bordes interactivos | `#385069` |

Los botones cian tienen texto oscuro para mantener contraste. El ámbar se reserva para hardware, índices y el pequeño subrayado del hero. La insignia de autor mantiene un significado independiente: verde `#91D8B0` sobre `#102D28`. Los materiales de la escena añaden grises de acero, PCB verde oscuro y latón.

## Arquitectura y traveling

`hero-3d.js` importa `scene.bundle.js` después de cargar el documento y sus imágenes prioritarias, cuando la escena está cerca del viewport. No hay React, GSAP, ScrollTrigger ni controles orbitales. El scroll sigue siendo nativo: no se interceptan wheel, touch ni teclado.

En escritorio, un contenedor sticky mantiene la composición durante 90svh adicionales. La zona completa ocupa aproximadamente 180–200vh en tamaños habituales. En ventanas bajas o con texto aumentado puede ser mayor para no cortar contenido. El límite superior del sticky se calcula desde la altura real, permitiendo que el texto alto se desplace normalmente antes de fijar la escena. Al salir del hero se llega directamente a Proyectos destacados.

El progreso normalizado dirige la cámara con FOV fijo de 34°, dolly corto y desplazamiento lateral; un suavizado de 75ms evita saltos y no crea una animación de entrada. Los tramos de transmisión se activan progresivamente, la muñeca del robot gira unos pocos grados y el gemelo digital gana contraste al final. Las etiquetas son HTML proyectado; el canvas y sus etiquetas decorativas se excluyen del árbol accesible.

## Rendimiento y recursos

- Módulo diferido: aproximadamente 493.5 KiB sin comprimir / 126.2 KiB gzip. El tamaño transferido depende de la compresión del hosting.
- Medición automatizada en Chrome de escritorio: máximo 22 draw calls y 2.704 triángulos por frame durante el recorrido probado.
- La geometría estática se fusiona por material, incluidos los pines de la placa.
- Sin modelos externos, texturas, HDR, sombras, bloom, partículas ni postprocesado.
- DPR máximo 1.5 en escritorio y 1 en móvil. Antialias solo en escritorio. Móvil usa menos segmentos, pines y luces, y elimina estructura ambiental.
- Renderizado bajo demanda: se detiene al converger el progreso, fuera del viewport o en una pestaña oculta. La pausa en reposo y fuera de pantalla está comprobada por instrumentación de WebGL.
- Si el tiempo de envío de frames supera repetidamente 32ms, reduce resolución a DPR 0.85; si persiste, usa fallback. Es una heurística de CPU/envío, no una medición completa del tiempo de GPU.
- Desconecta observers y libera geometrías, materiales, renderer y contexto al salir. Soporta restauración de página mediante bfcache y cambios de preferencia en vivo.
- Three.js usa licencia MIT. Las formas fueron creadas en código; no se descargaron modelos de terceros.

## Móvil, movimiento reducido y fallback

Hasta 900px usa escena compacta y cámara adaptada. No fija el hero ni añade longitud de scroll; el traveling se calcula mientras la escena cruza la pantalla. En teléfonos se muestra solo la etiqueta de la estación activa para evitar solapamientos. El retrato se convierte en una firma compacta bajo el texto.

Con `prefers-reduced-motion: reduce`, ahorro de datos, memoria reportada inferior a 4GB o menos de cuatro núcleos reportados, no se descarga Three.js. Se conserva una composición HTML estática ESP32 → Sensores → LoRa → Robótica → Gemelo digital sobre gradientes tenues. El movimiento reducido no añade espacio de scroll.

El mismo fallback cubre WebGL2 no disponible, pérdida de contexto, fallo de importación o dispositivo persistentemente lento. Sin soporte de observers se conserva directamente el HTML. Los datos de potencia no están disponibles en todos los navegadores; son indicios conservadores, no una clasificación exacta del dispositivo.

## Verificación y límites

Se comprueban los 11 HTML y los nueve proyectos, enlaces locales, metadata, schema, sintaxis y empaquetado. Las pruebas de navegador cubren Chrome de escritorio, tablet, Pixel 7 emulado y WebKit con viewport de iPhone 13: recorrido, anclas, detalle de proyecto, menú, Escape/foco, movimiento reducido en vivo, fallo/pérdida de WebGL, modo de bajo consumo, contenido sin JavaScript y contraste de texto. También se prueba viewport de 1280×720, texto al 200%, reposo y render fuera de pantalla.

No se observaron errores de consola ni excepciones en los recorridos normales automatizados. Los fallos controlados de WebGL se verifican por separado. La comprobación de contraste analiza colores computados; no constituye una auditoría completa de accesibilidad ni mide todos los posibles fondos de imagen.

WebKit en Windows y los perfiles móviles son emulación: falta validación sobre iPhone/Safari y Android físicos, incluyendo temperatura, batería y rendimiento de GPU real. No se afirma una tasa de FPS universal ni se dispone de mediciones de Core Web Vitals de usuarios reales.

Las cinco estaciones son representaciones estilizadas, no modelos CAD exactos de ESP32, sensores, LoRa o UFACTORY. Pueden sustituirse individualmente en `scene.js` por modelos autorizados de bajo peso si se necesita fidelidad de producto. No hay assets pendientes de descarga, código experimental comentado ni módulos nuevos sin uso. Los recursos heredados de `bower_components/` se conservan porque no forman parte del cambio y no se cargan en el sitio actual.
