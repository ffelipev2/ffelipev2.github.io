# Plan SEO de contenidos del portafolio de Felipe Flores

Fecha: **17 de octubre de 2026**. Base del sitio revisada: `27f05d3`.

**Estado: propuesta para revisión.** Este documento no aplica cambios editoriales ni autoriza una publicación. Se mantienen el diseño, las rutas, canonical, robots y sitemap. El propietario confirma que Google Search Console ya ha verificado individualmente la indexación de las diez páginas prioritarias; el trabajo siguiente se centra en visibilidad, CTR y visitas relevantes.

## 1. Evidencia y límites del diagnóstico

Los datos de rendimiento que siguen fueron aportados por el propietario para el período **16 de julio–15 de octubre de 2026**. No proceden de una nueva consulta autenticada a Search Console.

| Métrica global del informe | Valor |
| --- | ---: |
| Clics | 16 |
| Impresiones | 408 |
| CTR | 3,92 % |
| Posición media aproximada | 6,6 |

| Página del informe por URL | Clics | Impresiones | CTR de esa fila | Posición media de esa fila |
| --- | ---: | ---: | ---: | ---: |
| Inicio | 9 | 260 | 3,46 % | 6,55 |
| CV PDF | 2 | 95 | 2,11 % | 6,38 |
| Chat LoRa | 3 | 30 | 10,00 % | 6,57 |
| Gemelo Digital | 2 | 18 | 11,11 % | 4,72 |
| UFACTORY Lite 6 | 0 | 15 | 0,00 % | 4,87 |
| HiGrow ESP32 | 0 | 9 | 0,00 % | 6,22 |
| Vehículo Arduino WiFi | 0 | 6 | 0,00 % | 7,50 |
| Sensor biométrico Ethernet | 0 | 5 | 0,00 % | 8,40 |

Cada CTR de página se calcula exclusivamente con clics e impresiones de su propia fila. **No se suman estas filas para reconstruir los totales globales ni se mezclan ambas agregaciones para calcular cuotas.** Para ESP32, IoT, Robótica y el índice de proyectos no se aportaron métricas individuales: eso no equivale a cero impresiones.

Las consultas visibles son `felipe flores`, `higrow`, `ufactory lite 6` y `lora chat`. El listado es incompleto y no incluye aquí métricas ni un cruce consulta–página. No permite atribuir todos los clics de una ficha a una consulta, cuantificar la proporción de búsquedas de marca ni conocer el volumen de búsqueda del mercado.

La posición media 6,6 no significa que todas las páginas o consultas estén en esa posición. Tampoco la posición 4,87 de UFACTORY demuestra que aparezca cuarta o quinta para `ufactory lite 6`. La media depende de las impresiones observadas y de la dimensión del informe. [Definiciones y agregaciones de Search Console](https://support.google.com/webmasters/answer/7576553?hl=es).

### Lectura de negocio y contenido

- Hay poca exposición observada en el período, pero sin una serie anterior comparable no se puede afirmar crecimiento, caída o estancamiento. Inicio y CV merecen atención por las impresiones aportadas para esas URLs, sin convertirlas en porcentajes del total global.
- LoRa y Gemelo Digital ya reciben clics. Sus CTR son señales exploratorias positivas, con muestras pequeñas; conviene conservar lo que funciona y desarrollar respuestas técnicas útiles.
- Cero clics en 15 o nueve impresiones no prueba un mal título. No se propone una campaña de reescritura masiva por ese motivo.
- La principal oportunidad de contenido está en explicar mejor **qué se hizo, cómo funciona, qué puede consultar el lector y cuáles son sus límites**. En UFACTORY y Gemelo hay material real disponible; en LoRa y HiGrow faltan datos básicos.
- Las intenciones descritas en este plan son hipótesis editoriales. Las consultas nuevas propuestas no tienen demanda demostrada en los datos entregados.

El tráfico relevante se entiende provisionalmente como visitas interesadas en los proyectos de ingeniería y en la trayectoria profesional. Antes de redactar la portada, confirmar si se priorizan colaboración técnica, docencia, oportunidades laborales o divulgación. No se presupone disponibilidad para empleo, servicios comerciales ni consultoría.

## 2. Fuentes revisadas y dónde se editaría después

Se revisaron los archivos fuente, sus HTML de salida y el PDF local. Las ocho páginas HTML principales de este plan —inicio, cuatro fichas y tres temas— respondieron 200 y coincidieron byte por byte con producción. El PDF público también coincidió con el archivo local. Para este diagnóstico no se utilizaron como versión vigente las extracciones antiguas de la caché del buscador.

| Contenido | Fuente de una futura edición autorizada | Alcance y cuidado |
| --- | --- | --- |
| Portada, metadatos y tarjetas destacadas | [index.html](../index.html) | Es HTML mantenido manualmente. El build solo actualiza aquí la versión del CSS; no regenera los textos desde los datos de proyectos. |
| Fichas, tarjetas del catálogo y de temas | [data/projects.json](../data/projects.json) | `seoTitle`, `seoDescription`, `title`, `cardTitle`, `description`, campos técnicos, `resources`, `topics` y `relatedProjects`. Un cambio puede aparecer en varias páginas. |
| Temas ESP32, IoT y Robótica | [scripts/site-config.mjs](../scripts/site-config.mjs) | `seoTitle`, `description`, `title` e `intro`. El filtro de proyectos depende de `topics` en los datos. |
| Renderizado compartido | [scripts/build-site.mjs](../scripts/build-site.mjs) | Ya admite objetivos, arquitectura, funcionamiento, desarrollo, dificultades, resultados, materiales, software, galería y recursos. No hace falta cambiar la arquitectura. |
| Índice de proyectos | `projectsIndexPage()` en el generador | Sus metadatos y texto introductorio están en la plantilla. |
| Currículum | [docs/Felipe-CV.pdf](Felipe-CV.pdf) y su original editable, no incluido | Reexportar desde el original para mantener la presentación. Conservar `/docs/Felipe-CV.pdf`. |

Las fichas y páginas temáticas generadas no se editarían directamente. `title` de proyecto alimenta el H1 y otros nombres visibles o estructurados; `seoTitle` alimenta el título SEO. El generador deriva Open Graph y Twitter de los campos SEO; la portada mantiene esos valores por separado. No se deben modificar todos los campos de nombre como si fueran equivalentes.

También se contrastaron README y código público de [UFACTORY, revisión f253407](https://github.com/ffelipev2/BrazoRoboticoUfactory/tree/f253407c2c9fd95b4a1cde4fab316232bf51171d) y [Gemelo Digital, revisión 9fdf6e3](https://github.com/ffelipev2/GemeloDigitalEsp32/tree/9fdf6e34e9ef291a935150202f7e14ae70cdc026). La consulta de repositorios públicos devuelta por GitHub no aportó un repositorio claramente identificado de HiGrow o LoRa. Esto no demuestra que no existan: hace falta que el propietario identifique sus fuentes.

## 3. Oportunidades ordenadas

El impacto es **relativo y esperado**, no una predicción de clics o posiciones. El orden combina exposición observada, claridad para el visitante, material verificable y esfuerzo. No se han estimado volúmenes de búsqueda.

| Orden | Mejora | Fundamento | Impacto esperado | Esfuerzo | Información adicional |
| --- | --- | --- | --- | --- | --- |
| 1 | Afinar título, descripción y contexto profesional de inicio | 260 impresiones; el título enumera tecnologías pero no identifica la profesión | Alto relativo: mayor superficie observada para probar un mensaje claro | Bajo | Confirmar público y objetivo profesional prioritario; los hechos básicos ya están documentados |
| 2 | Mejorar título del PDF y el recorrido entre CV y portafolio | 95 impresiones; faltan título y autor en los metadatos del archivo y un enlace al portafolio | Medio–alto relativo para búsquedas profesionales | Bajo–medio, según acceso al editable | Editable del CV, fechas de EQA y vigencia de cargos |
| 3 | Mostrar la tarea concreta de UFACTORY en título y H1 | El caso ya documenta QR, OpenCV, Python y Flask; 15 impresiones permiten una hipótesis, no un diagnóstico de CTR | Medio, especialmente por precisión de intención | Bajo | Ninguna para proponer el texto basado en lo publicado; mediciones solo si se desea añadirlas |
| 4 | Actualizar los recursos y la identificación técnica de Gemelo Digital | 18 impresiones y dos clics; enlace externo al firmware comprobado con 404 | Medio para utilidad y confianza; efecto en CTR no demostrado | Bajo–medio | No hace falta información nueva para ubicar el código; confirmar correspondencia de las fotos con cada versión |
| 5 | Completar Chat LoRa a partir del prototipo real | 30 impresiones, tres clics y consulta visible relacionada; casi no explica implementación | Medio, condicionado a la calidad del material recibido | Medio–alto | Placas, módulos, interfaz, protocolo, conexiones, código y pruebas |
| 6 | Completar HiGrow antes de prometer prestaciones en el snippet | Consulta `higrow`; nueve impresiones; componentes y app poco especificados | Exploratorio: puede responder búsquedas más concretas si existen datos | Medio–alto | Revisión de placa, variables, sensores, transporte, app, código y resultados |
| 7 | Diferenciar ESP32, IoT y Robótica como páginas de orientación | Hoy predominan introducción corta y tarjetas; no hay métricas por URL aportadas | Medio exploratorio, sin demanda cuantificada | Medio | Preferencias de audiencia; datos de proyectos para ampliaciones específicas |
| 8 | Ampliar vehículo y biometría cuando haya documentación | Seis y cinco impresiones; modelos, código y funcionamiento insuficientes | Bajo con la evidencia actual | Medio–alto | Cámara, control y alimentación; sensor biométrico, shield y flujo de registro/acceso |

La recogida de documentación de LoRa y HiGrow puede comenzar en paralelo a los primeros cambios, aunque su publicación dependa de recibirla. La corrección del enlace de Gemelo puede ejecutarse como una tarea breve dentro de una fase editorial autorizada, manteniendo la URL pública de la ficha.

## 4. Títulos actuales frente a propuesta

Son candidatos para revisión, no textos aplicados. **Conservar un título también es una decisión** cuando ya describe bien el contenido o faltan datos para mejorarlo. La página y el encabezado visible deben respaldar la promesa del título. Google puede elegir otro texto para el resultado; no existe garantía de que muestre el propuesto ni un límite universal de caracteres que deba forzarse. [Orientaciones sobre títulos](https://developers.google.com/search/docs/appearance/title-link).

| Página | Título actual | Propuesta o decisión inicial |
| --- | --- | --- |
| Inicio | Felipe Flores \| IoT, Industria 4.0, ESP32 y Robótica | **Felipe Flores \| Ingeniero Civil Informático e IoT**. Prioriza identidad y profesión; la descripción aporta el resto de contexto. |
| UFACTORY | UFACTORY Lite 6 con visión artificial \| Felipe Flores | **UFACTORY Lite 6: clasificación QR con OpenCV \| Felipe Flores**. Describe una demostración concreta, no una ficha comercial del fabricante. |
| HiGrow | Sensor HiGrow con ESP32 y app móvil \| Felipe Flores | **Conservar inicialmente.** Tras documentar el prototipo, valorar una versión que nombre la variable y la aplicación reales. No prometer riego, Wi-Fi o una guía de montaje sin pruebas. |
| Chat LoRa | Chat con LoRa \| Mensajería entre dispositivos \| Felipe Flores | **Conservar inicialmente.** Ya identifica el caso y tiene clics; priorizar contenido antes que una modificación cosmética. |
| Gemelo Digital | Gemelo Digital con ESP32-C3 y Android \| Felipe Flores | **Conservar inicialmente.** Es específico; mejorar primero el H1 y los recursos. |
| ESP32 | Proyectos con ESP32: IoT, sensores y automatización \| Felipe Flores | **Conservar.** Su función es orientar entre varios proyectos con la misma familia de hardware. |
| IoT | Proyectos de IoT con ESP32 y sensores \| Felipe Flores | **Conservar.** Diferenciar el contenido por flujo de datos y uso, sin duplicar el tema ESP32. |
| Robótica | Proyectos de robótica: UFACTORY y Robot Otto \| Felipe Flores | **Robótica con UFACTORY Lite 6 y Arduino \| Felipe Flores**. Añade el modelo completo y una plataforma presente en Otto. Prioridad posterior a las fichas. |
| Índice de proyectos | Proyectos de IoT, ESP32 y robótica \| Felipe Flores | **Conservar.** Catálogo general, distinto de los casos individuales. |
| Vehículo | Vehículo Arduino MEGA con cámara Wi-Fi \| Felipe Flores | **Conservar.** No confundir la cámara Wi-Fi con el método de control del vehículo. |
| Biometría | Sensor biométrico con Ethernet \| Control de acceso \| Felipe Flores | **Conservar** hasta verificar los modelos y poder aportar una precisión útil. |

### Caso distinto: título del PDF

El CV no tiene una etiqueta HTML `title`: sus metadatos PDF no incluyen `/Title` ni `/Author`. Propuesta de propiedad **Title**: **Felipe Flores Valdebenito — Currículum de Ingeniero Civil Informático**. Propuesta de **Author**: **Felipe Igor Flores Valdebenito**, nombre que aparece en el documento. Confirmar la forma pública preferida y conservar coherencia con las variantes ya reconocidas en la web.

Google ha documentado el uso del título del archivo y del texto de los enlaces para la presentación de PDFs. Es una orientación específica publicada en 2011, no una promesa sobre la apariencia actual del resultado. [Referencia de Google sobre PDFs](https://developers.google.com/search/blog/2011/09/pdfs-in-google-search-results).

## 5. Metadescripciones actuales frente a propuesta

Las descripciones describen contenido real. Google puede construir el snippet con el cuerpo de la página y adaptarlo a la consulta; no debe evaluarse un cambio suponiendo que siempre se mostrará la metadescripción. [Cómo se generan los snippets](https://developers.google.com/search/docs/appearance/snippet).

| Página | Descripción actual | Propuesta o decisión inicial |
| --- | --- | --- |
| Inicio | Felipe Flores Valdebenito, Ingeniero Civil Informático en Chile. Explora proyectos de IoT, ESP32, robótica y automatización, además de su experiencia en Industria 4.0 y educación tecnológica. | **Ingeniero Civil Informático en Santiago, Chile. Proyectos de IoT, ESP32 y robótica, laboratorios de Industria 4.0 y docencia universitaria.** |
| UFACTORY | Demostración educativa con UFACTORY LITE 6, cámara USB y OpenCV para clasificar objetos por códigos QR, con supervisión desde un panel web Flask. | **Clasificación por códigos QR con UFACTORY Lite 6 y OpenCV. Demostración educativa con cámara USB, código Python y supervisión web en Flask.** La actual también es pertinente; probar esta variante junto a la tarea explícita del título. |
| HiGrow | Monitoreo de variables ambientales con sensor HiGrow, ESP32 y una aplicación móvil. | **Conservar por ahora.** La versión posterior debería nombrar las variables realmente medidas y qué permite hacer la app. Esos datos aún no están documentados. |
| Chat LoRa | Chat entre dispositivos que utiliza comunicación LoRa para intercambiar mensajes en tiempo real. | **Conservar por ahora.** Tras ampliar la ficha, incorporar componentes e interacción reales. No añadir alcance en kilómetros ni ausencia de Internet sin verificarlos. |
| Gemelo Digital | Gemelo digital de orientación con ESP32-C3, BNO08x y Bluetooth Low Energy. App Android con visor 3D, calibración y retorno a cero. | **Conservar.** Ya distingue orientación, sensor, transporte y aplicación. |
| ESP32 | Proyectos de Felipe Flores con ESP32: gemelo digital, monitor de calidad del aire, reconocimiento de colores con HuskyLens y sensor HiGrow. | **Conservar.** Lista los cuatro casos presentes; ampliar primero los criterios para explorarlos dentro de la página. |
| IoT | Conoce proyectos de IoT de Felipe Flores: monitor de calidad del aire con ESP32-S3, sensor HiGrow, gemelo digital y control de acceso por Ethernet. | **Conservar.** La promesa coincide con los cuatro casos enlazados. |
| Robótica | Explora proyectos de robótica de Felipe Flores: clasificación de objetos con UFACTORY LITE 6 y un robot Otto con Arduino e impresión 3D. | **Casos de robótica educativa: clasificación por QR con UFACTORY Lite 6, Python y OpenCV, y Robot Otto con Arduino e impresión 3D.** |
| Índice de proyectos | Proyectos de Felipe Flores en IoT, ESP32, LoRa, robótica, automatización, visión artificial, Arduino e impresión 3D. | **Conservar.** Es un índice; la especificidad de implementación pertenece a las fichas. |
| Vehículo | Vehículo radiocontrolado con Arduino MEGA y cámara Wi-Fi para explorar a distancia. | **Conservar** hasta disponer de detalles del control, la cámara y las pruebas. |
| Biometría | Control de acceso y registro biométrico con sensor, shield Ethernet e integración IoT. | **Conservar** hasta poder indicar modelos y funcionamiento documentado. |

El PDF **no admite una metadescripción HTML**. Se propone mejorar su párrafo de perfil y, de forma complementaria, la propiedad PDF Subject: **Experiencia de Felipe Flores en laboratorios de Industria 4.0, proyectos IoT y docencia universitaria.** Subject no equivale a `meta name="description"` ni garantiza un snippet concreto.

## 6. Recomendaciones por página

### 6.1. Inicio y presentación profesional

**Intención probable:** identificar a Felipe Flores, conocer su especialidad y trayectoria, revisar proyectos o iniciar un contacto profesional. `felipe flores` es una consulta ambigua fuera del contexto del portafolio; profesión y ubicación ayudan a que el lector reconozca a la persona adecuada.

El H1 actual es **Felipe Flores** y la línea inmediata ya incluye el nombre completo y **Ingeniero Civil Informático**. No hace falta convertirlo en una enumeración de tecnologías. La formación, cargos, experiencia en laboratorios y proyectos ya aportan sustancia; evitar ampliar títulos profesionales o afirmar resultados comerciales no documentados.

Propuestas para una fase autorizada:

- Probar el título y la descripción de las tablas. Mantener alineados el texto visible y los metadatos sociales de la portada.
- Sustituir los H2 generales por rótulos claros en las secciones existentes: **Proyectos de ingeniería aplicada** y **Perfil profesional y áreas de trabajo**, en lugar de los actuales lemas. Conservar el tono personal en los párrafos; mantener la jerarquía H2 de sección y H3 de proyecto.
- Hacer más concreto el resumen de UFACTORY ya destacado: clasificación por etiquetas QR, OpenCV y supervisión Flask. Los datos existen; no hace falta atribuirle reconocimiento general de objetos.
- Dar contexto al CV dentro del perfil y enlazar LoRa desde el texto existente de tecnologías. La portada ya enlaza a proyectos, temas y contacto; la mejora es contextual, no resolver páginas huérfanas.

**Falta confirmar:** público profesional prioritario y vigencia de las actividades descritas como actuales. No presentar nuevos servicios, disponibilidad laboral o una localización distinta por suposición.

### 6.2. Currículum PDF y su relación con la web

**Intención probable:** descargar el currículum, comprobar formación y experiencia. Las 95 impresiones y dos clics justifican revisar su presentación, sin considerar su CTR un fallo demostrado.

El PDF tiene una página y texto extraíble. Incluye perfil, experiencia, educación, certificaciones y habilidades; su estructura es documental, no una jerarquía HTML de H1/H2. La lectura de metadatos confirmó título y autor ausentes e idioma declarado `en-US`, pese al contenido español. Solo se detectó un enlace URI, al correo, y los botones de la web dicen **Descargar CV**.

Proponer, conservando el archivo indexable y su URL:

- Completar Title y Author como se indica arriba y declarar el idioma real al reexportar; es una mejora de identificación y accesibilidad, sin atribuirle un aumento de CTR demostrado.
- Añadir un enlace contextual **Currículum de Felipe Flores (PDF)** en el perfil HTML. Mantener los botones existentes y comprobar que su presentación siga funcionando.
- Añadir al CV una referencia visible y clicable a `https://felipeflores.tech/` dentro de la composición actual, si el editable lo permite; facilita continuar hacia los proyectos desde una visita directa al PDF.
- Validar el rango de EQA: el texto extraído del PDF muestra **2021–2020**, mientras que la web muestra **2020–2021**. Confirmar las fechas en el original antes de corregir nada; no resolver la discrepancia por deducción.

**Falta:** original editable del CV —los metadatos identifican FlowCV como creador—, fechas correctas y confirmación de cargos vigentes. No hay datos consulta–URL suficientes para afirmar que CV e inicio estén compitiendo de forma perjudicial.

### 6.3. UFACTORY Lite 6

**Intención probable:** conocer el brazo y, para el público adecuado, ver cómo integrarlo con visión y programación. La consulta visible del modelo también podría corresponder a compra, especificaciones o soporte del fabricante; esta página debe presentarse como un **caso educativo de clasificación por QR**.

El H1 actual, **Brazo robótico UFACTORY LITE 6**, puede concretarse como **Brazo UFACTORY Lite 6: clasificación de objetos por QR**. La ficha ya tiene objetivos, arquitectura, flujo, desarrollo, dificultades, resultados, materiales, software, galería y enlaces a código. No se propone volver a crear esas secciones.

- Probar el título y snippet propuestos, respaldados por contenido y código existentes.
- Hacer más identificables los H2 técnicos dentro de la estructura actual: **Arquitectura: cámara, OpenCV y control xArm** y **Clasificación por QR y secuencia del brazo**. Reorganizar la explicación desde la lectura de `caja1`, `caja2` y `caja3` hasta los destinos predefinidos.
- Acercar al flujo explicado los enlaces al código y a su configuración. El README ya documenta requisitos, cámara, conexión de red y ejecución; trasladar solo un resumen útil, con enlace a la fuente.
- Conservar el límite que ya publica la ficha: los contadores reflejan rutinas iniciadas y no verifican el depósito correcto. No convertirlos en precisión, productividad o tasa de éxito. Las posiciones son predefinidas, no localización general de objetos por visión.

**Fuentes disponibles:** [README](https://github.com/ffelipev2/BrazoRoboticoUfactory/blob/f253407c2c9fd95b4a1cde4fab316232bf51171d/README.md) y [aplicación Python](https://github.com/ffelipev2/BrazoRoboticoUfactory/blob/f253407c2c9fd95b4a1cde4fab316232bf51171d/brazoCamara2.0.py). Para este primer ajuste no hace falta inventar ni solicitar la arquitectura. Para publicar tiempos de ciclo, errores, repetibilidad o resultados con estudiantes sí hacen falta registros reales del propietario.

### 6.4. HiGrow ESP32

**Intención probable:** identificar una placa HiGrow o aprender a utilizarla en un proyecto con sensores y una app. La consulta `higrow` por sí sola no acredita que el visitante busque exactamente esta implementación.

El H1 **Sensor HiGrow (ESP32) + App** y los metadatos identifican el equipo, pero el contenido solo aporta objetivo general, hardware genérico, app móvil y vídeo. No describe variables exactas, modelo/revisión, transporte, conexiones, pantalla de la app o código.

- Cuando existan datos, hacer el H1 más explicativo, por ejemplo **Monitoreo ambiental con HiGrow ESP32 y app móvil**, sin añadir prestaciones no confirmadas.
- Completar materiales con la revisión real y desarrollar arquitectura y flujo: qué mide, cómo se lee, cómo llega a la app y qué ve el usuario. Esas respuestas deben preceder a una metadescripción más específica.
- Añadir conexiones, recursos, capturas y resultados únicamente cuando correspondan al montaje mostrado. Una fotografía de una maceta no prueba medición de humedad del suelo ni riego automático.
- Mantener los enlaces actuales a ESP32, IoT y Gemelo; explicar la relación por monitoreo y aplicaciones de visualización, sin atribuirle el mismo protocolo BLE de Gemelo.

**No afirmar todavía:** variables o unidades, sensores integrados, revisión de placa, Bluetooth/Wi-Fi/MQTT, Android, riego, alimentación o duración de batería. La ficha no los confirma y las capacidades de una placa comercial no prueban que se hayan usado en este proyecto.

### 6.5. Chat LoRa

**Intención probable:** ver un chat basado en LoRa y entender o reproducir la comunicación entre dispositivos. También podría buscar un producto o software concreto; el cruce consulta–página permitirá afinarlo.

El H1 **Chat con LoRa** es claro. La ficha contiene objetivo, flujo y hardware, pero los dos primeros reiteran la descripción y el hardware solo dice **Dispositivos con comunicación LoRa**. La imagen principal está identificada como ilustración; no debe presentarse como fotografía del montaje.

- Conservar al principio título y descripción; ampliar primero con una lista real de materiales, forma de escribir/leer mensajes, arquitectura, protocolo, conexiones y código si está disponible.
- Sustituir la repetición por respuestas concretas: qué acciona el usuario, qué transmite cada equipo, cómo se recibe y muestra el mensaje, qué errores se observaron y cómo se resolvieron.
- Añadir capturas o fotos reales y describir la prueba mostrada. El alcance medido debe incluir condiciones y registros; el alcance teórico de LoRa no sirve como resultado del prototipo.
- Conservar el vínculo con el vehículo cuando se explique como otro proyecto de comunicación remota; no sugerir que ambos implementan el mismo enlace.

**Falta:** placas y módulos, banda/configuración usada, número de equipos, interfaz, topología, formato de mensajes, conexiones, repositorio, pruebas y contexto. No afirmar ESP32, malla, LoRaWAN, cifrado, ausencia de Internet o kilómetros de alcance por el nombre LoRa. Actualmente no tiene `topics`; asignarlo a ESP32 o IoT requiere verificar su implementación, no solo su comunicación inalámbrica.

### 6.6. Gemelo Digital

**Intención probable:** implementar o comprender un gemelo digital de orientación con ESP32, sensor inercial, BLE y Android. No es una plataforma general de gemelos digitales de fábrica.

El título y la descripción SEO ya son específicos. El H1 actual **Gemelo Digital** puede desarrollarse como **Gemelo digital con ESP32-C3, BNO08x y Android**. La ficha ya explica arquitectura, calibración, desarrollo, dificultades, materiales, software y resultado; conservar esa base.

- Planificar la corrección del enlace **Firmware del ESP32-C3**: la URL publicada `https://github.com/ffelipev2/GemeloDigitalEsp32/blob/main/GemeloDigitalEsp32.ino` devolvió **404**. El código se encuentra ahora en [GemeloDigitalEsp32/GemeloDigitalEsp32.ino](https://github.com/ffelipev2/GemeloDigitalEsp32/blob/9fdf6e34e9ef291a935150202f7e14ae70cdc026/GemeloDigitalEsp32/GemeloDigitalEsp32.ino), comprobado mediante lectura HTTP 200 del archivo fuente. No cambia la ruta del portafolio.
- Aprovechar material ya público para describir conexiones y formato de datos: el código revisado define SDA GPIO 5, SCL GPIO 6 y muestras BLE de 18 bytes. Alimentación y tierra deben describirse según el módulo real, sin inferir pines o tensiones que no se hayan verificado.
- Añadir un recorrido breve por conexión, calibración opcional y retorno a cero, enlazado al código y documentación. Mantener la distinción entre valores configurados, pruebas simuladas y mediciones con hardware real.
- El repositorio ya contiene fotografías. Revisarlas antes de pedir nuevas: el README advierte que algunas muestran el mensaje Wi-Fi de una versión anterior, aunque el firmware actual utiliza BLE. Conservar leyendas de versión para evitar una explicación visual incoherente.

**Fuente:** [README de la revisión consultada](https://github.com/ffelipev2/GemeloDigitalEsp32/blob/9fdf6e34e9ef291a935150202f7e14ae70cdc026/README.md). No hacen falta nuevos datos para ubicar el firmware o consultar sus pines; sí para publicar rendimiento real, procedencia/contexto de imágenes o resultados físicos que no estén registrados. Un diagrama futuro debe distinguir sensor → ESP32 → BLE → Android, sin inventar servicios web.

### 6.7. Páginas ESP32, IoT y Robótica

Las tres ya tienen un H1, H2 de proyectos, tarjetas con H3 y enlaces entre temas. Funcionan como colecciones; no están demostradas búsquedas o impresiones propias en los datos aportados. Su función editorial puede ser ayudar a elegir un caso y dirigir visitas hacia una ficha más específica.

| Tema | Intención probable y H1 actual | Diferenciación propuesta con datos existentes | Información que falta |
| --- | --- | --- | --- |
| ESP32 | Explorar proyectos con ese microcontrolador. **Proyectos con ESP32** | Orientar por función: orientación 3D, calidad del aire, reconocimiento de colores y monitoreo HiGrow. Explicar que las placas, sensores y aplicaciones varían entre casos. Conservar cuatro tarjetas actuales. | Datos de HiGrow y HuskyLens para comparar conexiones o materiales con precisión. |
| IoT | Entender aplicaciones de dispositivos conectados. **Proyectos de IoT e Internet de las Cosas** | Organizar la introducción por adquisición de datos, transporte y visualización. Distinguir BLE de Gemelo/calidad del aire y Ethernet de biometría, sin asignar un transporte no documentado a HiGrow. | Arquitectura de HiGrow y biometría; datos por consulta–URL para priorizar un subtema. |
| Robótica | Ver casos educativos y de automatización. **Proyectos de robótica aplicada** | Distinguir manipulación/clasificación por QR con UFACTORY de robot bípedo educativo con Arduino e impresión 3D. Sus objetivos y recursos son distintos; no necesitan párrafos genéricos sobre toda la robótica. | Componentes, control, montaje y resultados de Otto. |

Usar primero `intro` y las tarjetas existentes. Si hacen falta párrafos contextuales con enlaces o nuevas subsecciones, su renderizado se propondrá en `topicPage()` y su contenido en configuración, sin editar la salida generada ni introducir nuevos componentes visuales. No duplicar un tutorial de la ficha en cada tema.

### 6.8. Índice de proyectos, vehículo y biometría

El índice ya enlaza todas las fichas y las áreas; conservar su título, descripción y H1 **Proyectos de IoT, ESP32 y robótica**. Una frase orientativa puede diferenciar demostración, documentación disponible y código enlazado, pero solo cuando el catálogo lo permita; no anunciar que todos incluyen código.

El vehículo tiene título SEO específico, pero el H1 **Vehículo con Arduino + RC + Cámara Wi-Fi** puede aclarar Arduino MEGA y separar control remoto de transmisión de vídeo, una vez confirmado el flujo. Faltan cámara, control de motores, alimentación, software y pruebas. Sus seis impresiones no justifican una reescritura inmediata.

Biometría tiene H1 **Shield Ethernet + Sensor biométrico** y metadatos orientados a control de acceso. Faltan modelos, conexiones y la distinción entre registro y autorización. Explicar el procedimiento real permitiría responder preguntas concretas; cinco impresiones no permiten validar una hipótesis de CTR.

## 7. Enlaces internos propuestos

Los enlaces generales y de navegación ya funcionan. Se proponen relaciones que ayuden a continuar la lectura; no añadir listas idénticas de palabras clave a todas las páginas.

| Origen → destino | Situación actual | Propuesta y motivo | Fuente de edición futura |
| --- | --- | --- | --- |
| Perfil de inicio → CV PDF | Botones genéricos en cabecera y menú; falta contexto dentro del perfil | Añadir **Currículum de Felipe Flores (PDF)** junto a la explicación de trayectoria | `index.html` |
| CV → inicio | Solo se detectó enlace al correo | Referencia al portafolio para continuar desde una búsqueda que llega directamente al PDF | Editable del CV |
| Inicio, texto de tecnologías → Chat LoRa | Existe en el menú móvil y catálogo, pero no como enlace contextual en el cuerpo principal | Enlazar **chat con LoRa** al explicar comunicaciones; facilita descubrimiento temático sin añadir tarjetas | `index.html` |
| Inicio → UFACTORY | Ya existe tarjeta destacada | Hacer específico su texto con **clasificación por QR**; conservar el destino | `index.html`, sincronizado con los datos |
| Robótica → UFACTORY y Otto | Tarjetas ya presentes | Añadir contexto sobre manipulación frente a robótica bípedo; el lector entiende qué caso elegir | Configuración de temas y plantilla solo si es necesaria |
| ESP32 e IoT → Gemelo y calidad del aire | Enlaces de tarjetas ya presentes | Contextualizar **orientación 3D por BLE** y **monitoreo de CO₂ y partículas**, respectivamente, sin afirmar prestaciones nuevas | Configuración y plantilla de temas |
| Gemelo ↔ HiGrow | Relación ya declarada en ambas fichas | Mantener y explicar visualización de información física; no atribuirles el mismo hardware o protocolo | Datos y, si corresponde, plantilla |
| UFACTORY ↔ HuskyLens | No es una relación actual en `relatedProjects` | Candidata por visión artificial: QR frente a colores. Añadir solo con una explicación breve de esas diferencias | `relatedProjects`; validar pertinencia del texto |

Mantener los enlaces temáticos recíprocos existentes. La relación con Industria 4.0 puede apoyarse en el contexto de laboratorio ya publicado. LoRa no debe incorporarse a una colección de ESP32 sin identificar primero sus placas, ni presentarse como una implementación IoT concreta sin documentar su arquitectura.

## 8. Información a proporcionar o confirmar

| Área | Información necesaria | Para qué decisión o contenido |
| --- | --- | --- |
| Objetivo del portafolio | Audiencia prioritaria y tipo de contacto que se desea recibir; vigencia de la presentación | Ajustar el mensaje profesional de inicio sin inventar servicios ni disponibilidad |
| CV | Original editable, fechas de EQA, cargos vigentes y forma pública preferida del nombre | Metadatos, coherencia documental y enlace al portafolio |
| UFACTORY | Mediciones con condiciones, fallos observados, contexto/fecha de la actividad y participación si se quieren ampliar | Resultados y experiencia del caso; QR, Python, arquitectura y repositorio ya están disponibles |
| Gemelo | Confirmación de versión/contexto de las fotos y registros de pruebas con hardware real | Evidencia visual y resultados físicos; no hace falta volver a aportar el código público o describir sus pines |
| LoRa | Identificadores de placas/módulos, configuración, entrada/salida de mensajes, topología, conexiones, repositorio, fotos y pruebas | Convertir una demostración breve en un caso técnico reproducible hasta donde exista documentación |
| HiGrow | Modelo/revisión, variables y unidades usadas, app/plataforma, transporte, conexiones, código, capturas, alimentación y resultados si están medidos | Describir qué hace este prototipo, sin copiar especificaciones genéricas de otra revisión de HiGrow |
| Otto | Controlador y servos usados, control remoto, archivos de impresión, montaje y contexto educativo | Dar más utilidad al tema Robótica y a su segunda ficha |
| Vehículo y biometría | Componentes, conexión, código, pruebas y participación real en cada caso | Ampliaciones posteriores con menor prioridad por los datos disponibles |
| Search Console | Exportación diaria y por URL; filtro de cada página con consultas visibles, país, dispositivo y tipo de búsqueda; fechas de publicaciones anteriores si se conocen | Construir una referencia comparable y separar hipótesis de demanda observada |

Puede aportarse documentación existente: README, esquemas, archivos fuente, fotos, capturas y notas de pruebas. No hace falta rellenar todas las secciones por proyecto. Un campo sin evidencia permanece ausente; la estructura actual ya lo permite. No usar un mínimo artificial de palabras como criterio de calidad.

## 9. Medición a 30 y 60 días

### Referencia y registro antes de publicar

**T0 será la fecha de la primera publicación editorial autorizada**, no la fecha de este plan ni la del despliegue previo de imágenes. Si las fichas se publican en fechas diferentes, registrar un T0 por URL.

1. Conservar sin alterar la referencia global del 16 de julio al 15 de octubre. Ese agregado no permite reconstruir la evolución diaria ni comparar directamente tres meses con 30 días.
2. Exportar los últimos **30 días completos y consolidados anteriores a T0**, o el tramo disponible más próximo, indicando cualquier separación. Usar el mismo tipo de búsqueda, propiedad y filtros en la comparación. Mantener una vista global y otra filtrada por cada URL.
3. Registrar por cambio: URL, fecha, campos modificados, texto anterior/propuesto, hipótesis y commit. Guardar capturas de ejemplos de resultados observados con consulta, país y dispositivo; no tratarlas como una clasificación universal.
4. En cada ficha, abrir Consultas después de filtrar la URL. Separar nombre personal de consultas de proyecto dentro del conjunto visible. No asumir que la lista exportada contiene las consultas anonimizadas o toda la demanda.
5. Registrar que la primera ventana posterior empieza cuando el cambio está publicado. Anotar cuándo se observa el nuevo texto en resultados, porque Google puede tardar en actualizarlo. No cambiar de nuevo los títulos cada pocos días.

Estos registros son una propuesta para una fase autorizada; no se han creado exportaciones de Search Console ni se ha instalado medición adicional.

### Día 30

Comparar los días **1–30 posteriores a T0** con la referencia previa de igual duración, una vez consolidados. Si el informe marca datos preliminares, esperar a su consolidación.

| Qué evaluar | Cómo leerlo | Decisión posible |
| --- | --- | --- |
| Impresiones y clics globales | Comparar solo gráficos globales con filtros equivalentes | Contextualizar la evolución del sitio; no atribuirla íntegramente a una ficha |
| Impresiones y clics por URL | Comparar cada página consigo misma y conservar sus valores absolutos | Ver qué páginas están ganando exposición observada y visitas |
| CTR por URL y consulta visible | Calcular clics/impresiones en la misma agrupación; revisar mezcla de consultas, posición, país y dispositivo | Mantener el texto si mejora la adecuación; no declarar ganador con una o dos visitas |
| Nuevas consultas técnicas visibles | Comprobar correspondencia con el contenido ampliado | Identificar respuestas que pueden profundizarse; la ausencia en la exportación no prueba ausencia de búsquedas |
| Presentación del resultado | Revisar ejemplos de título y snippet realmente mostrados | Comprobar si Google usa los candidatos o extrae otros pasajes |
| Recorrido profesional | Revisar preguntas y contactos recibidos, si el propietario los registra | Evaluar relevancia cualitativa; Search Console no mide descargas, clics al repositorio ni contactos dentro del sitio |

En LoRa, HiGrow y UFACTORY, cero clics con pocas impresiones seguirá siendo información insuficiente para concluir que un título funciona mal. Una caída del CTR con más consultas amplias puede acompañar más clics relevantes; revisar el conjunto antes de revertir.

### Día 60

Comparar **días 31–60 con días 1–30** y ambos tramos con la referencia previa. Mantener las mismas agrupaciones y registrar cambios adicionales. Para una URL publicada más tarde, esperar sus propias ventanas completas.

- Conservar propuestas que sigan siendo precisas y muestren una evolución favorable de exposición y visitas relevantes. Un aumento aislado no establece causalidad.
- Si crecen impresiones de consultas técnicas pertinentes pero no clics, revisar intención y ejemplos de snippet, junto con posición, país y dispositivo. Ajustar solo un conjunto pequeño de campos y registrar la nueva hipótesis.
- Si una página sigue sin exposición suficiente, revisar qué preguntas reales puede responder y qué evidencia falta. No deducirlo únicamente de la posición media ni recurrir a repeticiones de palabras clave.
- Posponer conclusiones de CTR cuando la muestra siga siendo pequeña; prolongar observación y completar documentación. No fijar una mejora porcentual garantizada ni un umbral de impresiones presentado como regla de Google.
- Elegir el siguiente proyecto o tema según consultas y páginas observadas, calidad del material disponible y pertinencia para el público profesional.

El seguimiento es **observacional**, no un experimento A/B controlado. Estacionalidad, mezcla de consultas, otros cambios del sitio y actualizaciones de los resultados pueden influir. Las consultas visibles sirven para analizar su subconjunto, no para calcular porcentajes completos de tráfico de marca o no marca.

## 10. Las cinco primeras mejoras propuestas

1. **Inicio: profesión y propuesta profesional claras en el resultado.** Es la URL con más impresiones aportadas. Los hechos ya existen; confirmar antes la audiencia prioritaria.
2. **CV: título documental, coherencia y enlace al portafolio.** Tiene exposición propia y puede conducir a los casos de ingeniería. Requiere el editable y confirmar las fechas de EQA.
3. **UFACTORY: destacar clasificación QR con OpenCV.** La diferencia está documentada y el cambio de mensaje tiene poco esfuerzo. No necesita datos técnicos nuevos para esta primera versión.
4. **Gemelo Digital: recurso al firmware correcto y H1 técnico.** Aprovecha una ficha que ya recibe clics y elimina una interrupción comprobada en la consulta del código. Los archivos públicos bastan; las fotos o mediciones adicionales necesitan revisión de contexto.
5. **Chat LoRa: construir una explicación técnica con evidencia.** Ya tiene consultas relacionadas y clics. Su publicación ampliada depende de recibir componentes, interfaz, conexiones, código y pruebas reales.

**HiGrow sería la siguiente ficha**, iniciando desde ahora la recogida de sus datos. Su déficit de información es claro; sus nueve impresiones no justifican promesas sobre CTR ni especificaciones deducidas de otras placas.

## 11. Alcance de esta entrega

Solo se crea `docs/PLAN-SEO-CONTENIDOS.md`. No se ejecuta el generador ni se modifican el PDF, los enlaces, los textos o los metadatos del sitio. No se publica nada. Los cambios editoriales descritos requieren una etapa posterior autorizada y validación de las fuentes indicadas.

La validación de este documento consiste en contrastar datos y metadatos actuales, revisar fuentes y comprobar que el árbol de trabajo solo incorpora este archivo. No corresponde repetir el build o las pruebas de interfaz por una entrega exclusivamente documental.
