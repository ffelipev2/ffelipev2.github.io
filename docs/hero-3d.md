# Animación Mundo físico → Mundo digital

Actualización del 9 de septiembre sobre la escena aprobada. Se conservan textos, fotografía, composición general, sombras de contacto y disposición de las cinco estaciones. En móvil se amplía el tramo de scroll con la escena visible. El robot recoge el cubo y tiene superficies más suaves; LoRa incorpora una pantalla y la ESP32 un LED más contrastado. No se añaden dependencias.

## Funcionamiento actual

El scroll controla toda la secuencia, sin reproducción automática ni reinicio por tiempo. El primer 20% es reposo. Un paquete cyan recorre el circuito existente de ESP32 a sensores, LoRa, robótica y gemelo digital según el desplazamiento de la página. Cada llegada activa el indicador y la etiqueta correspondiente; al subir se recorre la secuencia en sentido inverso.

El LED de la ESP32 es rojo, más grande y está al otro lado de la placa para diferenciarlo de los pines dorados; mantiene brillo de reposo, halo localizado y doble pulso claro. LoRa muestra una pantalla con nombre, estado TX, barras y progreso de transmisión. Es decorativa y se dibuja en una textura de 160×224, actualizada solo cuando cambia uno de sus 25 estados, no cada frame. Las ondas LoRa, los anillos del sensor y el paquete cyan son más visibles.

El brazo conserva el agarre y traslado: llega con la pinza abierta, cierra los dedos, eleva la pieza, gira hasta el otro lado de la base, la deposita, abre la pinza y vuelve a reposo. Sus esferas pasan a 24×16 segmentos, las tapas a 32 y los enlaces a cilindros de 24 segmentos, con material satinado propio. La cinemática conserva las longitudes de los tres enlaces; la muñeca mantiene la pinza vertical y los dedos no atraviesan la plataforma.

El gemelo dejó de ser una caja con líneas: ahora muestra una réplica holográfica reconocible del brazo y del cubo, con superficies cyan translúcidas, articulaciones iluminadas, contornos y anillos de proyección. Comparte los mismos buffers de geometría y la misma pose que el robot físico, por lo que reproduce exactamente el agarre, traslado y depósito. Es visible desde el inicio y gana intensidad durante la sincronización. Se mantienen el escáner vertical, hasta 12 puntos que llegan a vértices de la réplica articulada y la flecha de «Mundo físico → Mundo digital» sincronizada. No hay partículas aleatorias ni bloom.

Las etiquetas mantienen sus textos 01–05. En escritorio pueden mostrar brevemente estados decorativos como `TX / ACTIVE` o `SYNC / ACTIVE`; no son lecturas reales. Se omiten en tamaños pequeños y con movimiento reducido. La cuadrícula CAD tiene opacidad 0,085 y queda debajo/detrás de la plataforma.

## Scroll y cursor

La flecha «Volver al inicio» reinicia inmediatamente la fase, los pulsos y la pose de la escena. Durante el regreso suave se conserva ese estado inicial, de modo que la siguiente bajada no arrastra una reproducción inversa pendiente. Un gesto del usuario puede interrumpir el regreso; subir manualmente sigue recorriendo la secuencia en sentido inverso. Se reutiliza el mismo canvas y se respeta movimiento reducido. `tests/hero-return.spec.js` comprueba el retorno y el avance posterior en los cuatro perfiles de navegador.

| Progreso | Actividad principal |
| --- | --- |
| 0–20% | Reposo |
| 20–35% | ESP32 y salida del paquete |
| 35–50% | Sensor y muestreo |
| 50–65% | Transmisión LoRa |
| 65–80% | Respuesta mecánica del robot |
| 80–100% | Escaneo, transferencia y sincronización del gemelo |

El traslado del robot se superpone con el escaneo: 63,5–70% acercamiento; 70–73% cierre de pinza; 73–78% elevación; 78–85% giro con la pieza elevada; 85–90% descenso; 90–92,5% liberación; 92,5–100% retirada y retorno. La pieza parte de `(1.18, .19, .48)` y termina en `(-.95, .19, .72)`, en coordenadas locales de la estación. El estado se calcula directamente desde la fase, sin eventos de attach/detach: avanzar, retroceder o saltar de posición produce el mismo resultado, sin teletransportar el cubo.

La cámara, el texto y la página mantienen su respuesta directa al scroll nativo. Hasta 768px, `.hero-visual` permanece sticky mientras `.hero-track` ofrece `clamp(480px, 70svh, 660px)` de recorrido adicional, pensado para unos 2–3 deslizamientos ordinarios desde el inicio del pinning. Entre 769 y 900px se conservan los 1.200–1.800px anteriores (180svh); escritorio conserva su recorrido y diseño. La altura del bloque visual se suma por separado: los anteriores 180svh eran distancia adicional, no altura total. El cambio reduce distancia física y no modifica la secuencia, los materiales ni los tiempos internos. El rango se mide desde el contenedor estable, no desde el canvas que se desplaza con sticky. El texto introductorio no queda fijado. Se usa el viewport pequeño estable para que la barra del navegador no cambie el progreso.

El recorrido corto se verificó con tres gestos táctiles de 260px en Chrome con perfil Android y el desplazamiento equivalente en WebKit con perfil iPhone (Playwright no ofrece swipes nativos para WebKit). Se comprueban progreso de 0 a 100%, secuencia completa y reversible, continuidad al liberar el sticky y ausencia de espacio residual entre el hero y Proyectos. La matriz en vivo incluye 768/769px y confirma las distancias anteriores de tablet/escritorio. Pasan 46 pruebas aplicables de hero, recorrido y móvil, además del build; son perfiles emulados, no una medición en teléfonos físicos. El número de gestos real depende de su longitud e inercia.

Los efectos avanzan como máximo a 0,35 de progreso por segundo en móvil y 0,55 en escritorio; el tramo del robot baja a 0,15 y 0,22 respectivamente. La respuesta móvil es un 25% más rápida que en el ajuste anterior; el recorrido completo del robot sigue durando aproximadamente 2,4 segundos tras un gesto rápido. Al alcanzar el destino del scroll, la escena queda en esa fase; esperar no cambia de objeto ni reinicia la secuencia. No se interceptan gestos; el enlace a proyectos sigue disponible.

El parallax se aplica solo a ratón con puntero fino y viewport de escritorio. Usa interpolación suave y offsets de cámara menores a medio grado, con una diferencia adicional máxima de 2px en las etiquetas. La profundidad produce desplazamientos ligeramente diferentes entre plataforma, objetos y cuadrícula. Al salir del hero vuelve al centro. No hay parallax táctil ni controles orbitales.

## Rendimiento, móvil y limpieza

La revisión de recursos del 10 de septiembre conserva geometría, resolución, antialias, materiales, iluminación y tiempos. Antes de la fase 0,635, el robot y su holograma reutilizan los buffers de su pose inicial; solo se transforman y vuelven a transferir cuando el brazo cambia de postura. Al retroceder, se restaura esa pose una vez. Los desplazamientos fuera del rango y el regreso al inicio tampoco fuerzan frames idénticos; durante el recorrido se conserva la respuesta inmediata al scroll.

La cabecera, la barra de lectura y la sección activa comparten un único callback de scroll. Las dimensiones se leen juntas y se conservan hasta que cambia el layout, observado también al expandir contenido o preparar el hero. Los enlaces solo cambian sus atributos al pasar a otra sección. `tests/scroll-resources.spec.js` comprueba las transferencias, la navegación, las alturas variables y la preferencia de movimiento; `scripts/measure-scroll.mjs` permite comparar los archivos de HEAD con el trabajo local sin modificar el checkout.

En tres comparaciones locales por tamaño, las medianas de transferencia CPU→GPU durante el recorrido bajan de 70,36 a 36,86 MB en escritorio y de 71,47 a 37,97 MB en teléfono emulado: alrededor del 47% menos, con 252→253 y 257→256 frames respectivamente. El tiempo de JavaScript del recorrido disminuye aproximadamente un 10% y un 14%; son resultados de laboratorio con instrumentación, no promesas de FPS o batería en hardware real. En 30 frames de desplazamiento dentro de Proyectos, las mutaciones de atributos de navegación pasan de 60 a 0. Se mantienen cero frames en 600 ms de reposo, tanto con el hero visible como fuera de pantalla. Los contadores seleccionados están en `docs/scroll-resource-metrics.json`.

Las ocho capturas comparadas (fases 0,24, 0,54, 0,78 y 0,90, a 1440px y 393px) son idénticas en PNG y píxeles RGB. Pasan 37 pruebas aplicables entre escritorio, tablet, Android y WebKit/iPhone, además del build. El helper espera dos frames para medir la posición nativa final: Chrome móvil puede corregir unos píxeles después de `scrollTo`; se mantiene la tolerancia estricta de fase. La prueba que detectó esa lectura prematura pasó tres repeticiones después del ajuste.

- El módulo 3D empieza a descargarse y prepara la escena en cuanto se ejecuta el JavaScript del hero, sin esperar al primer scroll, a que la sección entre en pantalla ni a que terminen las imágenes. Se deja un frame inicial listo; fuera de pantalla no se mantiene un bucle de animación. Se conservan las excepciones de ahorro de datos y dispositivos limitados.
- Se reutiliza el RAF existente. Durante la interpolación se limita el dibujo a 60 fps en escritorio y 30 en tablet/móvil; los eventos de scroll conservan su respuesta directa. Son límites de cadencia, no FPS garantizados.
- El RAF se detiene al alcanzar el destino del scroll y finalizar el parallax, fuera de pantalla o con la pestaña oculta. Se eliminaron el reloj de reproducción automática y su temporizador de despertar.
- En teléfonos: cuatro puntos de transferencia, dos puntos sobre el wireframe, dos ondas LoRa, dos anillos de sensor y escáner sin plano transparente. Etiquetas de 12px, antialias y resolución adaptativa.
- La estructura estática se fusiona por material. El robot articulado y su cubo usan tres lotes dinámicos; la réplica holográfica reutiliza sus buffers y añade un lote de contornos. Posiciones, normales, matrices y geometrías se reservan una vez. Los buffers del robot solo se actualizan cuando cambia la fase, no durante el parallax de una pose inmóvil.
- Si el envío de frames resulta costoso, se reducen efectos secundarios y resolución. Si ya se alcanzó la resolución mínima, se reduce la cadencia de interpolación a 20 fps en vez de eliminar la escena. Tras una reducción de resolución se vuelve a dibujar en el mismo frame para no mostrar un buffer vacío. Se mantienen los fallbacks de dispositivo limitado, WebGL no disponible y pérdida de contexto.
- Los cambios de calidad de red ya no destruyen/recrean el canvas: solo se reconsidera la carga si cambia la condición efectiva de ahorro de datos/dispositivo limitado. Esto elimina una causa concreta de desaparición y reaparición durante el uso móvil.
- `prefers-reduced-motion` muestra la escena final estática: cubo depositado, brazo en reposo y holograma visible, sin pulsos, escáneres, HUD, parallax ni reproducción automática.
- `pagehide` libera geometrías, materiales, textura/entorno, renderer y contexto, y cancela los relojes. Se comprueban restauración de bfcache y cambios de preferencias sin duplicar canvas ni listeners de interacción.

Las superficies redondeadas del brazo y su réplica elevan el máximo medido a 9.922 triángulos y 34 draw calls. Se conserva un presupuesto de menos de 42 calls y 12.000 triángulos por frame. El bundle ocupa 519,9 KiB; gzip, 134,9 KiB. No se añaden dependencias, sombras dinámicas, postprocesado ni luces al sistema existente. No se miden aquí temperatura, batería ni tiempo real de GPU en teléfonos físicos.

## Archivos de esta actualización

| Archivo | Cambio |
| --- | --- |
| `js/hero/animation-sequence.js` | Fases, llegadas y pulsos controlados solo por scroll, con interpolación acotada y reposo al alcanzar el destino. |
| `js/hero/narrative-effects.js` | Ondas, anillos, scanners, cuadrícula y puntos que siguen los vértices móviles del holograma. |
| `js/hero/robot-motion.js` | Cinemática inversa y fases deterministas de agarre, elevación, traslado y depósito. |
| `js/hero/robot-assembly.js` | Articulaciones con buffers reutilizables, tres lotes por material y réplica holográfica compartida. |
| `js/hero/scene.js` | Integra el robot articulado, cubo transportable, holograma, circuito, indicadores y etiquetas. |
| `js/hero/radio-display.js` | Pantalla LoRa procedural con TX, barras y progreso; textura reutilizable. |
| `js/hero/camera-rig.js` | Offset de cursor acotado sin cambiar el traveling existente. |
| `js/hero-3d.js` | Único RAF, cadencia, puntero, visibilidad, reduced-motion y cleanup; sin temporizador de reproducción. |
| `index.html`, `css/hero-3d.css` | Contenedores del recorrido móvil, escena sticky, etiquetas y flecha. |
| `js/hero/scene.bundle.js` | Módulo de producción regenerado. |
| `scripts/validate-site.mjs` | Valida la sintaxis de todos los módulos del hero, incluidos los del robot. |
| `tests/narrative.spec.js`, `tests/rendering.spec.js` | Avance y retroceso por scroll, ausencia de autoplay al esperar, puntos, parallax, presupuesto y limpieza. |
| `tests/robot.spec.js` | Comprueba longitudes, contacto con pinza, altura sobre la plataforma, continuidad, reversibilidad y capturas de las etapas en cada navegador. |
| `tests/mobile-hero.spec.js`, `tests/hero-helpers.js` | Regresiones de red, rendimiento degradado, permanencia de la escena durante el scroll, velocidad y medición compartida del recorrido. |
| `tests/hero-preload.spec.js` | Comprueba en Android y WebKit/iPhone que el canvas esté preparado antes del scroll y con la foto todavía cargando, permanezca en reposo fuera de pantalla y se reutilice al llegar. |
| `docs/hero-3d.md` | Comportamiento actual e historial de refinamientos previos. |

Se conservan las pruebas de integración, contraste, resize, densidad, gestos táctiles y fallback, con perfiles Chrome de escritorio, tablet, Android emulado y WebKit/iPhone. Se prueban cambios de red sin recreación del canvas, coste simulado de frames, velocidad del traslado y persistencia de la escena al salir/volver. Las pruebas de secuencia esperan sin scroll para detectar cualquier reinicio automático. La cinemática se verifica en 1.001 posiciones, en ambos sentidos. El build valida 11 páginas y nueve proyectos. La emulación no sustituye una revisión en dispositivos físicos.

---

# Historial de refinamientos anteriores

Los apartados siguientes describen versiones previas, antes del ciclo automático solicitado el 8 de septiembre. Sus medidas de reposo y porcentajes de activación son históricos; el comportamiento actual es el descrito arriba.


# Refinamiento del hero existente

Se conservan la implementación HTML/CSS/JavaScript, header, navegación, textos, botones, fotografía, bloques 01/02/03 y cinco estaciones originales. `index.html`, proyectos y dependencias no cambian. La paleta sigue siendo azul petróleo, ámbar para hardware y cian para datos.

## Archivos de esta pasada

| Archivo | Cambio |
| --- | --- |
| `css/hero-3d.css` | Compacta espacios, reserva el primer viewport para evitar saltos de carga, añade guías de labels y refuerza la conexión físico/digital y la transición a Proyectos. |
| `js/hero-3d.js` | Sincroniza scroll, foto y transición directamente, con rango estable ante cambios de la barra móvil y estado final fijo con movimiento reducido. |
| `css/portfolio.css` | En pantallas táctiles, los elementos aparecen por opacidad sin desplazamiento adicional durante el scroll. |
| `js/hero/camera-rig.js` | Traveling contenido, encuadre completo y estabilización antes del final. Actualiza la matriz de proyección solo cuando cambia la proporción del viewport. |
| `js/hero/scene.js` | Unifica activaciones, corrige el pivote de muñeca, construye el wireframe por altura, adapta la disposición móvil y distribuye labels sin solapamientos. Incluye materiales de estudio, biseles y sombras de contacto. |
| `js/hero/scene.bundle.js` | Bundle minificado regenerado. |
| `tests/hero.spec.js` | Comprueba escena final inmóvil y cambio de preferencias en vivo; mantiene navegación, fallback y comprobación de consola. |
| `tests/narrative.spec.js` | Orden y reversibilidad, construcción real de líneas, límites de cámara, separación de labels y cambios de tamaño en vivo. |
| `tests/scroll-quality.spec.js` | Seguimiento directo del scroll, barra móvil, gestos táctiles nativos, densidades de pantalla, antialias y geometría uniforme. |
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

Los indicadores originales usan materiales por estación. Solo un pulso de transmisión puede ser visible a la vez. Se conservan las cinco estaciones sin partículas ambientales, bloom, modelos externos, controles manuales ni postprocesado. Las reflexiones y sombras de contacto se generan localmente al inicializar, como se detalla debajo.

## Materiales, luz y profundidad

El acabado elegido por el usuario prioriza realismo y profundidad, manteniendo la composición, los objetos, el recorrido y la paleta:

- Acero y latón reciben reflejos de estudio. Las superficies pintadas y plataformas tienen menos reflectividad para dar protagonismo al hardware.
- `RoomEnvironment` y `PMREMGenerator`, incluidos en la dependencia existente Three.js, calculan una pequeña textura de reflexión al iniciar: caras de 128 px en todas las pantallas. El estudio y su generador se liberan inmediatamente; la textura resultante se reutiliza durante todo el recorrido. No hay descarga de HDR ni cámaras de reflexión por frame.
- Las bases, la carcasa LoRa, el blindaje ESP32 y los eslabones del brazo usan biseles de un segmento. La geometría se comparte y se indexa antes de fusionar las mallas; pines, antenas y detalles pequeños mantienen sus geometrías ligeras.
- Una textura alfa de 64×64, creada una sola vez, simula sombras de contacto bajo las cuatro estaciones físicas y bajo las cinco plataformas. Las nueve superficies se fusionan en un único lote. Son aproximaciones estáticas de contacto; no mapas de sombras dinámicas.
- Una luz principal, un contraluz cian y un relleno ámbar definen los volúmenes en todas las pantallas. Al construirse el gemelo, una luz puntual cian ilumina gradualmente su base y se estabiliza con él. No añade animación en reposo ni bloom.

Con movimiento reducido, la iluminación aparece directamente en su estado final. Se usa densidad nativa hasta DPR 4, antialias y límites por píxeles/capacidad de GPU, con reducción adaptativa de resolución. Las nuevas texturas y geometrías forman parte de la liberación de recursos existente.

La comparación alternada contra `ff28215` se guarda en `surfaceRealism` dentro de `hero-refinement-metrics.json`. Los máximos pasan de 21 a 23 draw calls y de 2.704/1.552 a 3.682/2.530 triángulos (escritorio/móvil). El bundle gzip aumenta 3.734 bytes, unos 3,6 KiB. La cadencia mediana se mantiene en 6,9 ms/frame y el CLS en 0, sin frames en reposo. FCP/LCP medianos: escritorio 300→336 ms, móvil 284→284 ms; son tres repeticiones locales con variación de carga, no una medición de usuarios reales ni consumo de GPU en teléfonos físicos.

Las 37 pruebas aplicables pasan en escritorio, tablet, Android emulado y WebKit con perfil iPhone. Tras el ajuste final de reflectividad se volvieron a comprobar las siete pruebas de escritorio y se inspeccionó la captura móvil, sin errores de consola.

## Composición y cámara

Se compactan ligeramente márgenes y padding de los bloques. El texto queda fuera del canvas. El retrato comienza al 100% de opacidad y llega al 90%; con movimiento reducido permanece al 100%.

El FOV sigue fijo en 34°. En escritorio, el target recorre 0,9 unidades laterales y el dolly acerca la cámara un 2,5%. El movimiento es proporcional al scroll hasta detenerse al 90%. El sticky conserva sus 90svh adicionales y calcula su límite desde la altura real del contenido, incluyendo ventanas bajas y texto ampliado.

Los labels usan anclajes proyectados y guías de 12 px con separación de 14 px. Sus dimensiones se miden tras cambiar el tamaño. Una distribución por filas resuelve colisiones horizontales manteniendo las guías en los anclajes originales. El activo recibe el contraste principal; los completados conservan un borde discreto.

“Mundo físico → Mundo digital” gana algo de peso y tamaño. La flecha, la línea de progreso y el borde superior de Proyectos responden al mismo scroll. El contenido de Proyectos conserva su visibilidad y navegación ordinarias.

## Móvil y movimiento reducido

- Hasta 600 px, el recorrido se pliega: ESP32 → Sensores → LoRa atrás, Robótica → Gemelo digital delante. La cámara muestra las cinco estaciones con 0,2 unidades de movimiento lateral y 0,8% de dolly. Los labels delanteros quedan bajo las plataformas.
- Entre 601–900 px se conserva la fila horizontal con encuadre completo. Todas las pantallas usan los mismos pines, segmentos, biseles, materiales, luces y reflexiones. Solo cambia la disposición: la fila horizontal añade siete vigas de fondo que no caben en la composición plegada. Hasta 900 px el scroll es nativo, sin sticky ni longitud artificial.
- El progreso móvil comienza en cero aunque la escena ya esté visible al cargar una tablet alta; finaliza con la escena todavía dentro de pantalla.
- Con `prefers-reduced-motion: reduce`, el módulo se carga diferido y dibuja el final: gemelo completo, todos los labels activos, cámara fija, muñeca en reposo y sin pulsos. El scroll no solicita frames. Solo se redibuja al cambiar tamaño o reactivar visibilidad. No hay recorrido adicional.
- Ahorro de datos, menos de 4 GB de memoria reportada o menos de cuatro núcleos mantienen el fallback HTML sin descargar Three.js. El fallback también cubre WebGL no disponible, pérdida de contexto, fallo del módulo o rendimiento persistentemente bajo. Sin JavaScript permanece el contenido profesional.

## Rendimiento

Se conservan carga diferida, fusión de mallas estáticas y reutilización de geometrías. No se crean objetos Three.js por frame; se reutilizan cámara, vectores, rangos de líneas y buffers de labels. Las actualizaciones HTML de posiciones siguen generando pequeñas cadenas de texto.

El render se solicita solo cuando cambia el scroll, el tamaño, la densidad o la visibilidad; se detiene en reposo, fuera de pantalla y en pestañas ocultas. La resolución usa la densidad nativa hasta DPR 4, un máximo de cuatro millones de píxeles y las dimensiones máximas del renderbuffer/textura de la GPU. Un móvil de 393×340 CSS a DPR 2,75 pasa de 786×680 a 1080×935 píxeles. El mismo criterio se aplica en escritorio y al mover la ventana a otra pantalla.

Si el envío de frames resulta repetidamente costoso, la densidad baja un 20% por etapa hasta DPR 1 y, si persiste, se usa fallback. La geometría y la iluminación no se simplifican. Un cambio real de tamaño o densidad reevalúa la resolución máxima; un resize redundante conserva el buffer y cualquier reducción vigente. Cada reducción solicita un nuevo frame porque redimensionar borra el canvas. Esta heurística mide CPU/envío, no tiempo físico de GPU. Se conserva liberación de recursos y restauración mediante bfcache.

## Respuesta al deslizamiento y calidad uniforme

No se interceptan los gestos verticales ni se sustituye la inercia del navegador. Se retiró el desplazamiento de 14–18 px de las animaciones de aparición en dispositivos con puntero táctil: sumaba movimiento ascendente al de la página. Se mantiene un fundido de 240 ms sin escalado ni retrasos escalonados.

El recorrido se mide con `100svh`, estable cuando se oculta o aparece la barra del navegador. Se cachean el inicio y la longitud fuera del bucle de scroll; `ResizeObserver` los actualiza ante cambios reales de contenido o viewport. El estado de la escena sigue la posición nativa directamente, sin el anterior suavizado de 90 ms. La cámara tampoco añade aceleración intermedia. Los pequeños pulsos de las estaciones conservan sus curvas originales.

Las pruebas emulan la señal de resize y el cambio de `innerHeight` de una barra móvil, conservando `svh`, y comprueban que no cambie el progreso ni se reasigne el buffer. Chrome recibe además gestos táctiles nativos mediante CDP, en ambos sentidos sobre la escena y los proyectos. La matriz visual cubre densidades 1, 2, 2,75, 3 y 4, incluyendo una pantalla de 3840 px y un cambio de densidad en vivo. Los perfiles móviles y WebKit son emulación; no equivalen a mediciones de FPS, temperatura o batería en teléfonos físicos. La calidad de materiales y modelos es uniforme; la resolución efectiva y el rendimiento siguen sujetos al dispositivo.

La comparación alternada contra `26df05d` está en `scrollAndScreenQuality` de `hero-refinement-metrics.json`: 23 draw calls máximos, 3.682 triángulos en escritorio y 3.598 en móvil (antes 2.530), CLS 0, cero frames en reposo y ningún error de consola o desbordamiento. La cadencia mediana local permanece en aproximadamente 6,9 ms. FCP/LCP medianos pasan de 388/400 a 304/304 ms en escritorio y de 264/264 a 276/276 ms en móvil; son tres muestras por variante, sin atribuir a ellas mejoras de rendimiento real. El bundle gzip aumenta 33 bytes, hasta 134.137 bytes.

Verificación de esta pasada: 46 pruebas aplicables aprobadas entre los cuatro perfiles, con 22 omisiones de comprobaciones específicas de otra plataforma. Se repitieron las pruebas de recorrido y calidad tras corregir la simulación del cambio de pantalla: CDP cambia el DPR, pero no emite el evento de media query de una pantalla real, por lo que el test entrega esa señal explícitamente. Build y `git diff --check` correctos.

Las cifras de la pasada de narrativa, anteriores a la corrección de nitidez móvil, están en `hero-refinement-metrics.json`: tres contextos nuevos de Chrome por viewport (1440×900 y 393×851), servidor local, sin throttling y recorrido sintético de 2,4 segundos. La cadencia observada depende del equipo y pantalla; no representa FPS universales. FCP/LCP y desplazamientos son datos de laboratorio, no Core Web Vitals de usuarios reales.

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

### Corrección de nitidez móvil

La captura de un teléfono real mostró bordes escalonados por el límite DPR 1 y la ausencia de antialias. Se separó la geometría ligera de la resolución: ahora se conserva el detalle reducido, pero se solicita antialias nativo y hasta DPR 2. En Chrome emulado se verificó un buffer de 786×680 para 393×340 CSS y antialias con cuatro muestras. También se comprobó la reducción progresiva 2 → 1,5 → 1, sin volver a renderizar por debajo de DPR 1.

La comparación alternada contra `592e875` mantiene 21 draw calls, 1.552 triángulos móviles, CLS 0 y ningún frame en reposo. La mediana móvil permanece en 6,9 ms/frame; FCP/LCP pasan de 260/260 a 268/268 ms. El bundle gzip aumenta 22 bytes. Las 37 pruebas aplicables vuelven a pasar sin errores de consola. Los datos se conservan en `mobileSharpnessCorrection` dentro de `hero-refinement-metrics.json`.

DPR 2 dibuja cuatro veces más píxeles que DPR 1 y el antialias añade trabajo de GPU; la mejora visual tiene ese coste. Estas mediciones locales no cuantifican consumo, temperatura ni FPS en el teléfono físico del usuario.

La versión anterior calculaba labels con cinco intervalos, conexiones con cuatro y gemelo con otro intervalo. El gemelo solo cambiaba de opacidad. La muñeca pivotaba bajo la articulación; en teléfonos se recortaban estaciones y se ocultaban cuatro labels. En tablets altas, el recorrido podía empezar con LoRa activo. Esta pasada corrige esos comportamientos reutilizando la escena.

El build valida 11 HTML, nueve proyectos, enlaces, metadatos, sintaxis y distribución estática. Las pruebas cubren escritorio, tablet, Pixel 7 emulado, WebKit con perfil iPhone 13, ventana 1280×720, texto al 200%, anchos desde 320 px y cambios de breakpoint en vivo. La instrumentación comprueba construcción/reversibilidad del gemelo, presupuesto de render y pausa en reposo/fuera de pantalla.

Resultado de la pasada original de narrativa: 37 pruebas aprobadas; 15 omisiones corresponden a controles de geometría/presupuesto que se ejecutan solo una vez en escritorio y no se repiten en cada perfil. `git diff --check` pasa. La verificación actual de scroll y calidad se detalla arriba.

Los recorridos normales comprobados no registran errores de consola ni excepciones. Los fallos de WebGL se provocan y verifican por separado. WebKit en Windows y los perfiles móviles son emulación: no se midieron temperatura, batería ni uso de GPU en teléfonos físicos.
