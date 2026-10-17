# Auditoría técnica SEO del 17 de octubre de 2026

Base revisada: `2b73228`. Sitio: <https://felipeflores.tech/>. Las solicitudes de producción se hicieron antes de la optimización local. No se publicó ningún cambio ni se modificó Search Console.

## Diagnóstico

**No se encontró un bloqueo técnico que explique «Descubierta: actualmente sin indexar» en las diez páginas prioritarias.** Las 17 URLs del sitemap entregan HTTP 200, HTML con contenido, canonical propia y directivas que permiten indexación. El HTML publicado de esas 17 páginas coincidía con los archivos locales de la base revisada. Las cifras de Search Console comunicadas en la solicitud no se han verificado mediante una sesión autenticada.

Según [la documentación de Google sobre indexación](https://support.google.com/webmasters/answer/7440203?hl=es), ese estado significa que Google conoce la URL y todavía no la ha rastreado para indexarla. No identifica por sí solo un fallo del código. Que una página sea técnicamente indexable no garantiza que Google la indexe o mejore su posición.

La evidencia reproducible de esta revisión pública está en [seo-production-audit-2026-10-17.json](seo-production-audit-2026-10-17.json): cadenas HTTP, cabeceras, títulos, descripciones, H1, canonical, hashes del HTML, DNS y comprobaciones de recursos. Es una captura de esta fecha, no un monitor permanente.

| Prioridad | Hallazgo comprobado | Acción |
| --- | --- | --- |
| Alta | Ningún bloqueo de rastreo o indexación detectado en las URLs prioritarias. | Conservar las señales correctas. Verificar el rastreo y la canonical elegida dentro de Search Console. |
| Media | La ficha de calidad del aire descarga una foto de 5.159.136 bytes para mostrarla a unos 664 × 498 píxeles en escritorio. La imagen de conexiones de su galería pesa 2.638.174 bytes. | Servir versiones WebP para visualización y conservar los enlaces a los originales. Mejora de transferencia; no se ha demostrado una relación causal con la falta de indexación. |
| Media, editorial | Siete fichas explican brevemente sus proyectos y repiten parte de la descripción en el objetivo. No aportan aún conexiones, desarrollo o resultados detallados. | Ampliar con información y evidencia reales del propietario. No inventar componentes, cifras, fechas o experiencias. |
| Baja, fuera de este despliegue | La política pública de la app carece de canonical y robots, mientras que la copia local declara `noindex, follow`. | Revisar la fuente del repositorio independiente si sigue siendo esa la intención. No bloquea las páginas prioritarias ni debe resolverse editando esta copia. |
| Baja, documentación | Los informes de septiembre describían 16 URLs y nueve proyectos. Actualmente hay 17 URLs y diez proyectos. | Identificar esos informes como históricos y enlazar esta revisión actual. |

## Arquitectura y despliegue

El sitio usa HTML, CSS y JavaScript estáticos; no tiene un framework de aplicación ni enrutamiento del lado del cliente. Cada ruta pública tiene su propio `index.html`. La portada se mantiene como HTML y `scripts/build-site.mjs` genera el índice, diez fichas, cuatro páginas temáticas, publicaciones y sitemap desde `data/projects.json`, `data/publications.json` y `scripts/site-config.mjs`.

`npm run build` compila además la escena Three.js con esbuild y ejecuta el validador. La animación complementa el contenido HTML: los buscadores y los usuarios sin JavaScript reciben los textos y enlaces. No hace falta migrar, añadir SSR ni introducir otro prerenderizador.

`CNAME` contiene `felipeflores.tech`. La respuesta pública indica `Server: GitHub.com`; el DNS del dominio raíz devuelve las cuatro direcciones de GitHub Pages y WWW apunta a `ffelipev2.github.io`. No hay reglas de firewall, CDN, reescritura SPA ni workflows de despliegue en este repositorio. Esto identifica el servicio público, pero no confirma la configuración privada de Settings → Pages, su rama/directorio ni sus registros internos.

## Las diez rutas prioritarias

Todas se solicitaron directamente, sin visitar antes la portada y sin ejecutar JavaScript. En cada caso se comprobó un título y una descripción únicos, un único H1, canonical absoluta igual a la URL solicitada y `index, follow`, sin `X-Robots-Tag` de bloqueo.

| Ruta | HTTP | Canonical | Contenido inicial | Enlaces desde inicio |
| --- | --- | --- | --- | --- |
| `/esp32/` | 200 | Propia | Sí | 1 salto |
| `/industria-4-0/` | 200 | Propia | Sí | 1 salto |
| `/iot/` | 200 | Propia | Sí | 1 salto |
| `/proyectos/` | 200 | Propia | Sí | 1 salto |
| `/proyectos/arduino-bluetooth-rele/` | 200 | Propia | Sí | 2 saltos |
| `/proyectos/calidad-aire-esp32-s3/` | 200 | Propia | Sí | 1 salto |
| `/proyectos/huskylens-esp32/` | 200 | Propia | Sí | 2 saltos |
| `/proyectos/robot-otto-arduino-3d/` | 200 | Propia | Sí | 2 saltos |
| `/publicaciones/` | 200 | Propia | Sí | 1 salto |
| `/robotica/` | 200 | Propia | Sí | 1 salto |

Los saltos proceden del grafo de elementos `<a href>` del HTML público, sin enlaces `nofollow`. Las 17 URLs del sitemap son alcanzables en un máximo de dos saltos. Las páginas temáticas ya se enlazan entre sí y las fichas enlazan sus áreas y proyectos relacionados. No se añadieron enlaces redundantes ni texto con palabras clave artificiales.

## Robots, sitemap, canonical y errores

- `robots.txt`: HTTP 200, permite `/` para todos los agentes y anuncia `https://felipeflores.tech/sitemap.xml`. Coincide con el archivo local.
- `sitemap.xml`: HTTP 200, namespace Sitemap correcto y 17 URLs canónicas únicas, coincidentes con los datos y las rutas indexables. El XML se valida también con `DOMParser` en las pruebas. No contiene redirecciones, errores, política, parámetros ni fechas `lastmod` inventadas. Su generación ya estaba automatizada y se conserva.
- Las 17 páginas tienen títulos y metadescripciones distintos, un H1 descriptivo, idioma `es-CL`, Open Graph, Twitter Cards y JSON-LD. Se conservan `Person`/`ProfilePage`, colecciones, trabajos y migas de pan existentes; no se añaden afirmaciones ni marcado de resultados enriquecidos sin fundamento.
- Las solicitudes con un User-Agent de Googlebot recibieron HTTP 200 y exactamente el mismo HTML que el agente ordinario en las 17 páginas. No equivalen a solicitudes desde las IP verificadas de Google ni descartan restricciones intermitentes; esas comprobaciones requieren la prueba publicada de Search Console y registros del proveedor.
- Las 32 referencias locales adicionales encontradas en el HTML público respondieron HTTP 200 a solicitudes HEAD. La validación local revisa además destinos y fragmentos. No se encontraron enlaces internos rotos entre las páginas y recursos comprobados.
- `/auditoria-seo-ruta-inexistente-20261017/` y `/proyectos/auditoria-inexistente-20261017/` devolvieron HTTP 404 real, sin mostrar la portada con estado 200.

| Variante probada | Resultado público |
| --- | --- |
| `http://felipeflores.tech/` y `/esp32/` | 301 → equivalente HTTPS → 200 |
| `http://www.felipeflores.tech/` y `/esp32/` | 301 → equivalente HTTPS sin WWW → 200 |
| `https://www.felipeflores.tech/` y `/esp32/` | 301 → equivalente sin WWW → 200 |
| `https://ffelipev2.github.io/` y `/esp32/` | 301 → dominio oficial conservando ruta → 200 |
| `https://felipeflores.tech/esp32` | 301 → `/esp32/` → 200 |
| `/index.html` y `/esp32/index.html` | 200 con canonical hacia la URL de directorio correspondiente |

Las variantes de dominio llegan en una sola redirección a la URL oficial. La referencia HTTP que muestra Search Console llega correctamente a HTTPS; no demuestra un fallo. Las URLs explícitas `index.html` son alias del hosting y no aparecen en sitemap ni en enlaces internos. Su canonical es consistente con [las señales de consolidación de Google](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls). No se añadieron redirecciones JavaScript ni reglas de otros proveedores que GitHub Pages no ejecutaría.

## Corrección de rendimiento

La fotografía se visualiza mediante una copia WebP de 1600 × 1200; la imagen de conexiones mantiene 1448 × 1086 en WebP. Se mantienen proporción, estilos, texto alternativo, prioridad de la imagen principal, carga diferida de galería y los originales JPG/PNG accesibles al abrir las imágenes.

| Imagen | Antes | Visualización optimizada | Reducción |
| --- | ---: | ---: | ---: |
| Foto principal | 5.159.136 bytes | 467.616 bytes | 90,9 % |
| Conexiones | 2.638.174 bytes | 514.570 bytes | 80,5 % |
| Ambas, cuando se solicitan | 7.797.310 bytes | 982.186 bytes | 87,4 % |

La reducción corresponde a los archivos de imagen, no al peso total de la página ni a una medición de Core Web Vitals. La foto original se descargaba desde el HTML inicial; la segunda imagen conserva `loading="lazy"` y solo pesa en la transferencia cuando el navegador la solicita. No se cambian el hero 3D, sus animaciones, componentes o estilos.

## Archivos del cambio

| Archivo | Motivo |
| --- | --- |
| `data/projects.json` | Seleccionar las dos imágenes optimizadas y declarar sus enlaces originales mediante `originalSrc` opcional. |
| `scripts/build-site.mjs` | Permitir que las imágenes de visualización y las que se abren a tamaño completo tengan archivos distintos, con el comportamiento anterior como valor por defecto. |
| `images/calidad-aire-esp32-s3/montaje-prototipo-esp32-s3-1600.webp` | Copia de visualización comprimida de la foto; el JPG original se conserva. |
| `images/calidad-aire-esp32-s3/montaje-componentes.webp` | Copia comprimida de la imagen de conexiones; el PNG original se conserva. |
| `proyectos/calidad-aire-esp32-s3/index.html` | Resultado de regenerar esa ficha. |
| `tests/project-layout.spec.js` | Comprobar tamaño responsive, imágenes optimizadas, transferencia y apertura de originales. |
| `README.md` | Documentar el campo opcional y enlazar la revisión actual. |
| `docs/AUDITORIA-SEO-2026-10-17.md` | Diagnóstico actual, decisiones, archivos, validaciones y límites. |
| `docs/seo-production-audit-2026-10-17.json` | Evidencias públicas anteriores a los cambios locales. |
| `docs/AUDITORIA-SEO.md`, `docs/PENDIENTES-SEO.md` | Identificar el informe histórico y actualizar el seguimiento actual. |

## Validación de esta revisión

- `npm run build`: correcto después del cambio. Genera diez fichas, cuatro páginas temáticas, índice, publicaciones y sitemap; valida 18 HTML, diez proyectos y 17 URLs canónicas. El bundle 3D se conserva sin diferencias.
- `npm test`: correcto después del cambio. Comprueba metadatos, enlaces y fragmentos locales, imágenes, accesibilidad básica, JSON-LD, alcance desde inicio y sintaxis JavaScript.
- Suite completa sobre el HTML de la base, antes de regenerar la ficha: `npm run test:browser -- --reporter=line`, **108 aprobadas, 48 omitidas por condiciones de plataforma y cero fallidas**, en 5,9 minutos. Incluye navegación, menú, vídeo, animación 3D, scroll, teclado, reducción de movimiento, contraste y disponibilidad sin JavaScript.
- Después del cambio: `npm run test:browser -- tests/seo-pages.spec.js tests/project-layout.spec.js --reporter=line`, **27 aprobadas, nueve omitidas y cero fallidas**, en 44,7 segundos. Las nueve omisiones corresponden a repetir en tres plataformas los tres controles que solo necesitan escritorio: XML/HTTP, grafo del HTML y generación en una copia temporal.
- Los controles posteriores se ejecutaron en `desktop-chrome`, `tablet-chrome`, `android-chrome` e `ios-webkit`: metadatos y contenido inicial de las 17 rutas con y sin JavaScript, navegación HTML, proyectos temáticos, publicaciones y presentación responsive. Son perfiles emulados, no pruebas en dispositivos físicos.
- La ficha modificada se comprobó a 1878, 1440, 820 y 390 píxeles de ancho en los cuatro perfiles. Las pruebas verifican ausencia de desbordes, alturas consistentes de galería, descarga de las copias optimizadas sin solicitar los originales, tamaño conjunto inferior a 1 MiB y apertura de la foto original de 4096 × 3072 en otra pestaña.
- Comparación visual de la foto a 1440 × 900: antes y después ocupa exactamente `x=694,59375`, `y=226`, `ancho=664,40625`, `alto=498,296875`. Se revisaron las capturas de la foto y de la imagen anotada de conexiones. Los WebP usan compresión con pérdida; los originales se conservan íntegros.
- La descarga local real confirmó HTTP 200 y 467.616/514.570 bytes para los WebP. Solo esa ficha cambia entre los HTML generados; robots, sitemap, otros HTML, CSS y JavaScript de producción no tienen diferencias.
- `git diff --check`: correcto. No se añadieron dependencias, configuración de hosting ni cambios de rutas.

La revisión de accesibilidad cubre los controles existentes y las imágenes afectadas; no certifica conformidad completa con WCAG. El JSON-LD se analizó localmente y se comprobaron sus contratos existentes; no se ejecutó una validación remota de resultados enriquecidos de Google.

## Comprobaciones pendientes y Search Console

Las comprobaciones de Search Console pueden hacerse ahora: las señales de indexación correctas ya están en producción. La mejora local de imágenes no es un requisito para inspeccionar esas páginas.

1. Revisar este cambio local y autorizar su publicación cuando corresponda. No se ha desplegado.
2. Después de publicar, repetir GET de las diez URLs prioritarias y de los nuevos WebP; comprobar contenido, cabeceras, canonical, robots y sitemap realmente servidos. Confirmar que los enlaces siguen abriendo los originales.
3. En Search Console, abrir la propiedad de dominio y comprobar en Sitemaps la lectura correcta del archivo y las **17** URLs actuales. Si el sitemap ya está enviado y se lee bien, no hace falta retirarlo ni generar otro.
4. Inspeccionar primero `/esp32/` y después las otras nueve URLs. Ejecutar «Probar URL publicada» y revisar acceso, permiso de indexación, HTML y captura. Solicitar indexación de las páginas prioritarias cuando proceda y respetar las cuotas, sin repetir solicitudes continuamente.
5. Revisar en el informe de indexación la última fecha de rastreo y, cuando esté disponible, la canonical seleccionada por Google. Las tres versiones excluidas por redirección son esperables si apuntan a la versión oficial; no necesitan indexarse por separado.
6. Revisar Estadísticas de rastreo, disponibilidad del host, acciones manuales y problemas de seguridad. No se tuvo acceso a esos informes, a registros de Googlebot ni a la configuración privada del hosting/CDN.
7. Revisar Core Web Vitals con datos reales de usuarios, si hay muestras suficientes. Las medidas locales de transferencia y las pruebas de navegador no sustituyen esos datos.
8. Aportar contenido real para las siete fichas breves y decidir por separado qué hacer con la política de la app en su repositorio de publicación.

No se ha comprobado la indexación actual mediante una cuenta autenticada, la canonical elegida por Google, el rendimiento real de usuarios, la elegibilidad de cada tipo de resultado enriquecido con herramientas de Google ni la ausencia global de bloqueos por IP o intermitentes. No hay garantía de indexación ni de posiciones.
