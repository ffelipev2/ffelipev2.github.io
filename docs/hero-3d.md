# Refinamiento del hero existente

Se conservan la implementación HTML/CSS/JavaScript, header, navegación, textos, botones, fotografía, bloques 01/02/03 y cinco estaciones originales. `index.html`, `css/portfolio.css`, proyectos y dependencias no cambian. La paleta sigue siendo azul petróleo, ámbar para hardware y cian para datos.

## Archivos de esta pasada

| Archivo | Cambio |
| --- | --- |
| `css/hero-3d.css` | Compacta espacios, reserva el primer viewport para evitar saltos de carga, añade guías de labels y refuerza la conexión físico/digital y la transición a Proyectos. |
| `js/hero-3d.js` | Sincroniza scroll, foto y transición. Suavizado de 90 ms, progreso móvil desde ESP32 incluso en tablets altas y estado final fijo con movimiento reducido. |
| `js/hero/camera-rig.js` | Traveling contenido, encuadre completo y estabilización antes del final. Actualiza la matriz de proyección solo cuando cambia la proporción del viewport. |
| `js/hero/scene.js` | Unifica activaciones, corrige el pivote de muñeca, construye el wireframe por altura, adapta la disposición móvil y distribuye labels sin solapamientos. |
| `js/hero/scene.bundle.js` | Bundle minificado regenerado. |
| `tests/hero.spec.js` | Comprueba escena final inmóvil y cambio de preferencias en vivo; mantiene navegación, fallback y comprobación de consola. |
| `tests/narrative.spec.js` | Orden y reversibilidad, construcción real de líneas, límites de cámara, separación de labels y cambios de tamaño en vivo. |
| `scripts/measure-hero.mjs` | Medición reproducible de FCP, LCP, desplazamientos, cadencia de render, draw calls, triángulos, reposo, bundle y consola. |
| `docs/hero-refinement-metrics.json` | Resultados de laboratorio antes/después. |
| `docs/hero-3d.md` | Documentación de esta pasada. |

## Secuencia de scroll

Los porcentajes corresponden al recorrido del hero. Una misma posición produce el mismo estado al avanzar o retroceder, sin temporizadores independientes.

| Progreso | Comportamiento |
| --- | --- |
| 0–18% | ESP32: indicador y label ámbar. La conexión existente envía un único pulso entre 8–18%. |
| 18–38% | Sensores: un pulso de intensidad entre 18–27%. Entre 27–38%, una señal cian avanza hacia LoRa. |
| 38–58% | LoRa: indicador cian; transmite hacia Robótica entre 47–58%. |
| 58–78% | Robótica: excursión de muñeca de unos seis grados y retorno a reposo entre 58–67%, sobre la articulación existente. Entre 67–78%, el flujo llega al gemelo. |
| 78–92% | Gemelo digital: las líneas existentes se iluminan desde abajo hacia arriba; label e indicador ganan protagonismo. |
| 92–100% | Gemelo completo y cámara estable antes de liberar el sticky hacia Proyectos destacados. |

El gemelo conserva un contorno tenue desde el inicio. Sus siete grupos originales se fusionan en una geometría y sus aristas se ordenan por la altura del extremo superior al inicializar. Dos grupos de material delimitan la parte activa y la pendiente; cambian sus rangos sin crear geometrías ni materiales durante el recorrido. Al terminar se desactiva el material tenue para evitar un draw call vacío.

Los indicadores originales usan materiales por estación. Solo un pulso de transmisión puede ser visible a la vez. No se añaden estaciones, partículas ambientales, bloom, sombras, texturas, modelos externos, controles manuales ni postprocesado.

## Composición y cámara

Se compactan ligeramente márgenes y padding de los bloques. El texto queda fuera del canvas. El retrato comienza al 100% de opacidad y llega al 90%; con movimiento reducido permanece al 100%.

El FOV sigue fijo en 34°. En escritorio, el target recorre 0,9 unidades laterales y el dolly acerca la cámara un 2,5%. La curva se estabiliza al 90%. El sticky conserva sus 90svh adicionales y calcula su límite desde la altura real del contenido, incluyendo ventanas bajas y texto ampliado.

Los labels usan anclajes proyectados y guías de 12 px con separación de 14 px. Sus dimensiones se miden tras cambiar el tamaño. Una distribución por filas resuelve colisiones horizontales manteniendo las guías en los anclajes originales. El activo recibe el contraste principal; los completados conservan un borde discreto.

“Mundo físico → Mundo digital” gana algo de peso y tamaño. La flecha, la línea de progreso y el borde superior de Proyectos responden al mismo scroll. El contenido de Proyectos conserva su visibilidad y navegación ordinarias.

## Móvil y movimiento reducido

- Hasta 600 px, el recorrido se pliega: ESP32 → Sensores → LoRa atrás, Robótica → Gemelo digital delante. La cámara muestra las cinco estaciones con 0,2 unidades de movimiento lateral y 0,8% de dolly. Los labels delanteros quedan bajo las plataformas.
- Entre 601–900 px se conserva la fila horizontal con encuadre completo. Hasta 900 px se usa DPR 1, menos pines/segmentos, una luz direccional y ningún antialias. El scroll es nativo, sin sticky ni longitud artificial.
- El progreso móvil comienza en cero aunque la escena ya esté visible al cargar una tablet alta; finaliza con la escena todavía dentro de pantalla.
- Con `prefers-reduced-motion: reduce`, el módulo se carga diferido y dibuja el final: gemelo completo, todos los labels activos, cámara fija, muñeca en reposo y sin pulsos. El scroll no solicita frames. Solo se redibuja al cambiar tamaño o reactivar visibilidad. No hay recorrido adicional.
- Ahorro de datos, menos de 4 GB de memoria reportada o menos de cuatro núcleos mantienen el fallback HTML sin descargar Three.js. El fallback también cubre WebGL no disponible, pérdida de contexto, fallo del módulo o rendimiento persistentemente bajo. Sin JavaScript permanece el contenido profesional.

## Rendimiento

Se conservan carga diferida, fusión de mallas estáticas y reutilización de geometrías. No se crean objetos Three.js por frame; se reutilizan cámara, vectores, rangos de líneas y buffers de labels. Las actualizaciones HTML de posiciones siguen generando pequeñas cadenas de texto.

El render se detiene al converger el scroll, fuera de pantalla y en pestañas ocultas. DPR máximo 1,5 en escritorio; si el envío de frames resulta repetidamente costoso se reduce a 0,85 y, si persiste, se usa fallback. Esta heurística mide CPU/envío, no tiempo físico de GPU. Se conserva liberación de recursos y restauración mediante bfcache.

Las cifras comparativas están en `hero-refinement-metrics.json`: tres contextos nuevos de Chrome por viewport (1440×900 y 393×851), servidor local, sin throttling y recorrido sintético de 2,4 segundos. La cadencia observada depende del equipo y pantalla; no representa FPS universales. FCP/LCP y desplazamientos son datos de laboratorio, no Core Web Vitals de usuarios reales.

La primera medición separada mostró variación en FCP/LCP (medianas de 252→356 ms en escritorio y 228→348 ms en móvil). Se conservaron esos resultados y se repitió la comparación alternando ambas versiones en la misma sesión, con idéntica interceptación de recursos:

| Medida | Antes | Después |
| --- | --- | --- |
| FCP / LCP, mediana escritorio | 312 / 312 ms | 304 / 304 ms |
| FCP / LCP, mediana móvil | 260 / 260 ms | 280 / 280 ms |
| Intervalo mediano de frames, ambos tamaños | 6,9 ms | 6,9 ms |
| CLS observado, ambos tamaños | 0 | 0 |
| Draw calls máximos | 22 | 21 |
| Triángulos máximos, escritorio / móvil | 2.704 / 1.552 | 2.704 / 1.552 |
| Frames en reposo | 0 | 0 |
| Bundle diferido sin comprimir | 493,6 KiB | 496,0 KiB |
| Bundle diferido gzip | 126,2 KiB | 127,3 KiB |

La cadencia y la complejidad geométrica se mantienen; gzip aumenta aproximadamente 1,0 KiB (0,83%). El contraste pareado no reproduce el aumento inicial de pintura en escritorio y reduce la diferencia móvil a 20 ms. Tres repeticiones locales no permiten afirmar una mejora de Core Web Vitals ni equivalencia estadística.

Para repetir, con el servidor iniciado mediante `npm run dev`:

```powershell
node scripts/measure-hero.mjs ../hero-review/current
# Comparar el árbol actual con los recursos del commit HEAD sin modificar archivos:
node scripts/measure-hero.mjs ../hero-review/paired --compare
npm run test:browser
```

Primero deben ejecutarse `npm ci` y `npm run build`. WebKit requiere `npx playwright install webkit`. En esta sesión se instaló dentro del workspace y se indicó `PLAYWRIGHT_BROWSERS_PATH` al ejecutar las pruebas.

## Problemas previos y verificación

La versión anterior calculaba labels con cinco intervalos, conexiones con cuatro y gemelo con otro intervalo. El gemelo solo cambiaba de opacidad. La muñeca pivotaba bajo la articulación; en teléfonos se recortaban estaciones y se ocultaban cuatro labels. En tablets altas, el recorrido podía empezar con LoRa activo. Esta pasada corrige esos comportamientos reutilizando la escena.

El build valida 11 HTML, nueve proyectos, enlaces, metadatos, sintaxis y distribución estática. Las pruebas cubren escritorio, tablet, Pixel 7 emulado, WebKit con perfil iPhone 13, ventana 1280×720, texto al 200%, anchos desde 320 px y cambios de breakpoint en vivo. La instrumentación comprueba construcción/reversibilidad del gemelo, presupuesto de render y pausa en reposo/fuera de pantalla.

Resultado final: 37 pruebas aprobadas; 15 omisiones corresponden a controles de geometría/presupuesto que se ejecutan solo una vez en escritorio y no se repiten en cada perfil. `git diff --check` pasa.

Los recorridos normales comprobados no registran errores de consola ni excepciones. Los fallos de WebGL se provocan y verifican por separado. WebKit en Windows y los perfiles móviles son emulación: no se midieron temperatura, batería ni uso de GPU en teléfonos físicos.
