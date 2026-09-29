# Auditoría y preparación SEO

Fecha: **29 de septiembre de 2026**. Base: `b2d9314`. Los cambios están únicamente en el repositorio local y no se han publicado.

## Diagnóstico y alcance

Las 16 páginas del sitemap responden con HTTP 200, tienen canonical propia, títulos y descripciones únicos, permiten indexación y entregan su contenido en HTML. La portada enlaza a `/proyectos/`, y ese índice enlaza a las nueve fichas mediante etiquetas `a` con `href`. Todas las páginas del sitemap son alcanzables desde la portada.

Se corrigieron dos problemas: contenido transparente hasta el scroll y validación que exigía cantidades fijas de proyectos y URLs. Se conservan la arquitectura estática, las rutas y los metadatos actuales. No se ampliaron ni sustituyeron los datos reales de los proyectos.

**Información comunicada por el propietario:** Search Console está conectado, el sitemap se envió con 16 URLs, la portada está indexada y tres alternativas están excluidas por redirección. Gemelo Digital figura como «Descubierta: actualmente sin indexar»; su prueba publicada permite indexación y valida las migas de pan, y ya se solicitó su indexación. Estos datos no proceden de una sesión autenticada revisada durante esta ejecución.

«Descubierta» informa que Google conoce la URL y todavía no la ha rastreado para su proceso de indexación. Una prueba publicada correcta no garantiza su incorporación al índice. No se atribuye ese estado al contenido ni a las animaciones sin datos adicionales de Google. [Referencia oficial](https://support.google.com/webmasters/answer/7440203?hl=es).

## Comprobación pública de las 16 páginas

Las solicitudes GET se realizaron antes de los cambios locales. Todas respondieron sin redirigir, declararon la misma URL solicitada como canonical y carecen de X-Robots-Tag. Sus HTML publicados coinciden byte por byte con los archivos de la base revisada.

| Ruta en https://felipeflores.tech | HTTP | Canonical | Robots | Título y descripción |
| --- | --- | --- | --- | --- |
| `/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/proyectos/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/proyectos/gemelo-digital/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/proyectos/chat-lora/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/proyectos/ufactory-lite-6/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/proyectos/huskylens-esp32/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/proyectos/sensor-higrow-esp32-app/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/proyectos/ethernet-sensor-biometrico/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/proyectos/robot-otto-arduino-3d/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/proyectos/arduino-bluetooth-rele/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/proyectos/vehiculo-arduino-camara-wifi/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/esp32/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/iot/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/industria-4-0/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/robotica/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |
| `/publicaciones/` | 200 | Propia, HTTPS | `index, follow` | Únicos y descriptivos |

En los 16 `index.html`, las líneas 6, 7, 9 y 11 contienen respectivamente título, descripción, robots y canonical. Los títulos y descripciones identifican los proyectos y sus tecnologías; no se introdujo información no confirmada ni se aplicaron límites artificiales de caracteres.

`robots.txt` y `sitemap.xml` devuelven 200 y coinciden con sus archivos locales. Robots permite `/` y anuncia el sitemap HTTPS. El sitemap es XML válido con 16 URLs únicas; excluye política y CV PDF. Ambos archivos se conservaron sin cambios. `lastmod` es opcional y, si se incorpora, debe reflejar actualizaciones significativas reales.

La compilación posterior conserva los HTML y el sitemap existentes. La corrección de CSS aún no está en producción.

## Problemas técnicos y cambios

| Comprobación | Estado | Evidencia | Gravedad o efecto | Acción |
| --- | --- | --- | --- | --- |
| Visibilidad inicial | Problema corregido localmente | `css/portfolio.css:2955` mantiene opacos los elementos pendientes. Las animaciones de escritorio conservan desplazamiento y escala sin ocultar contenido; el fundido móvil empieza en 0.96. | Media: visibilidad inicial comprobada; efecto previo en Google no demostrado. | Revisar la versión publicada después de un despliegue autorizado. |
| Cantidades fijas | Problema corregido | `scripts/validate-site.mjs` deriva proyectos y URLs de los datos y temas configurados. | Mantenimiento: permite ampliar el catálogo. | Mantener datos y configuración como fuentes de las rutas. |
| Configuración de temas | Correcto | `scripts/site-config.mjs` comparte dominio y temas entre generador, validador y pruebas. | Evita listas divergentes. | Añadir temas reales y asignarlos a proyectos respaldados por datos. |
| Descubrimiento HTML | Correcto | El validador exige portada → índice → fichas y recorre el grafo HTML. Las pruebas analizan el HTML de respuesta sin ejecutar sus scripts. | No hay páginas huérfanas entre las 16 URLs. | Mantener estos contratos al añadir páginas. |
| Sitemap y canonical | Correcto | Correspondencia entre datos, rutas, HTML indexable y sitemap; XML analizado mediante DOMParser en las pruebas. | Detecta omisiones, duplicados y páginas indexables fuera de la configuración. | Regenerar tras editar datos. En bajas o renombres, retirar el HTML anterior y revisar enlaces; el generador no borra archivos automáticamente. |
| Rutas y recursos | Correcto en las comprobaciones locales | El validador revisa destinos y fragmentos; las pruebas comprueban HTTP, una ruta inexistente con 404, desbordes y funcionalidades existentes. | Sin modificaciones al servidor ni a las rutas. | Repetir las comprobaciones pertinentes en cambios futuros. |
| Política publicada | Problema externo pendiente | El archivo local contiene robots y canonical en líneas 7 y 8. La respuesta pública carece de ambos y coincide con el repositorio independiente. | Media: no se aplica la exclusión prevista. | Corregir la fuente real con autorización específica para ese repositorio. |
| Indexación y canonical seleccionada | Solo verificable en Search Console | El contexto comunicado por el propietario y las pruebas públicas no sustituyen la inspección autenticada. | No se deduce de un HTTP 200 o de la canonical declarada. | Seguir la evolución sin reiterar automáticamente la solicitud de indexación. |

## Revisión de las nueve fichas

Las palabras aproximadas cuentan la descripción principal y las secciones `.project-detail-section`, incluidos encabezados, listas y recursos. Excluyen navegación, contacto y proyectos relacionados. Sirven para comparar el nivel de explicación; **no son un mínimo exigido por Google ni una predicción de indexación**.

| Ficha | Palabras aproximadas | Observación comprobada | Información real útil |
| --- | ---: | --- | --- |
| Gemelo Digital | 452 | La más completa: arquitectura, componentes, software, flujo, desarrollo, dificultades, resultados y código. | Problema y contexto originales, fechas y participación, aprendizajes, mediciones con hardware real y capturas actuales de Android. Distinguir mediciones de intervalos configurados en el firmware. |
| Chat con LoRa | 54 | Descripción, objetivo y flujo reiteran intercambio de mensajes; hardware genérico. | Placas y módulos, protocolo y formato de mensajes, interfaz, conexiones, alcance medido y condiciones, dificultades y repositorio. |
| UFACTORY LITE 6 | 40 | Reitera clasificación con visión; «Visión artificial» no identifica herramientas de software. | Cámara, objetos y categorías, algoritmo o herramientas, integración con el brazo, flujo de clasificación y resultados documentados. |
| HuskyLens + ESP32 | 30 | Describe reconocimiento de colores, sin conexiones ni respuesta del prototipo. | Modo de HuskyLens, clases, comunicación con ESP32, conexiones, comportamiento, aplicaciones y pruebas reales. |
| Sensor HiGrow + App | 39 | Repite monitoreo ambiental; la app y el transporte no están explicados. | Variables y sensores exactos, protocolo, plataforma de la app, lectura configurada, visualizaciones y validación de mediciones. |
| Ethernet + Sensor biométrico | 32 | Objetivo y descripción similares; falta explicar registro y acceso. | Modelos, lectura y comparación, almacenamiento, comunicación Ethernet, autorización y pruebas documentadas. |
| Robot Otto RC | 37 | Finalidad educativa y materiales generales, sin explicar control o construcción. | Placa, servos, control remoto, piezas y archivos de impresión, montaje, movimientos, contexto y dificultades. |
| Arduino + Bluetooth + Relé | 37 | Repite control de actuadores; componentes y app poco especificados. | Módulo Bluetooth, aplicación, conexiones, protocolo de órdenes, actuador y alimentación, pruebas y código real. |
| Vehículo Arduino + Cámara Wi-Fi | 31 | Reitera exploración remota; faltan detalles del vehículo, cámara y control. | Controlador de motores, cámara, RC, alimentación, enlaces de vídeo/control, construcción, pruebas de campo y autonomía si está medida. |

Las ocho fichas breves tienen contenido escaso y repetitivo dentro de cada caso. No se encontraron títulos ni descripciones SEO duplicados entre páginas. No se rellenaron campos ni se inventaron modelos, resultados o fechas. El trabajo editorial debe partir de documentación, fotografías, código o información aportada por el propietario.

Como revisión opcional, confirmar si la introducción de ESP32 debe seguir hablando de «visualización web»: Gemelo Digital describe ahora una app Android, aunque conserva material de su demostración original. Los enlaces contextuales adicionales deben basarse en relaciones confirmadas; el descubrimiento actual del catálogo ya funciona.

## Origen de la política de privacidad

URL: https://felipeflores.tech/politicasffelipev2.github.io/

La API pública confirma que [ffelipev2/politicasffelipev2.github.io](https://github.com/ffelipev2/politicasffelipev2.github.io) tiene Pages habilitado y rama por defecto `main`. El [index.html de esa rama](https://github.com/ffelipev2/politicasffelipev2.github.io/blob/main/index.html) coincide byte por byte con la respuesta pública; la copia del portafolio difiere. Concuerda con la herencia del dominio del sitio de usuario en sitios de proyectos. [Documentación de GitHub](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages#using-a-custom-domain-across-multiple-repositories).

La consulta anónima al detalle `/pages` devolvió 404; no se confirmó desde un panel autenticado la rama/directorio o artefacto configurado. La disponibilidad pública y la coincidencia de contenido sí se comprobaron. Confirmar ese detalle en Settings → Pages antes de corregir los metadatos.

**No se modificó el repositorio independiente ni la política local.** Modificar esta copia no corregirá la respuesta pública. Si se mantiene la intención de excluirla, la fuente real puede conservar HTTP 200 y añadir `noindex, follow`; debe seguir rastreable para que Google lea la directiva.

## Pruebas y validación

- `npm run build`: correcto; regenera el bundle, 15 páginas y sitemap, y valida 17 HTML, nueve proyectos y 16 URLs.
- Pruebas SEO de escritorio: ocho aprobadas. Una copia temporal añade un proyecto y un tema y comprueba las 18 URLs resultantes, sin modificar el catálogo real.
- Casos negativos: el validador rechaza URL omitida, URL duplicada, canonical incorrecta, `noindex` y ausencia del enlace del índice a una ficha.
- La primera suite completa reprodujo la falla de sincronización previamente documentada en WebKit: 103 aprobadas, 48 omitidas y una fallida. Las pruebas SEO aprobaron en los cuatro perfiles.
- Instrumentación de WebKit: la primera muestra falló en cuatro de ocho intentos y coincidía con la activación de IntersectionObserver y el primer fotograma visible.
- `tests/scroll-quality.spec.js` espera ese primer fotograma mediante el helper existente antes de medir desplazamientos posteriores. Conserva la observación tras dos fotogramas y la misma precisión; no cambia la animación de producción.
- Repetición tras ese ajuste: diez de diez aprobadas.
- Ejecución final de la suite completa: **104 aprobadas, 48 omitidas por condiciones de plataforma y cero fallidas**, en 5.8 minutos. Las comprobaciones SEO de metadatos y visibilidad con y sin JavaScript aprobaron en los cuatro perfiles; XML, grafo HTTP y generación aislada se ejecutan una vez en escritorio por ser independientes de la plataforma.

Se revisaron capturas de portada y proyectos de escritorio y tablet. La suite cubre desktop-chrome, tablet-chrome, android-chrome e ios-webkit: visibilidad con y sin JavaScript, metadatos, enlaces, sitemap, desbordes, navegación, reducción de movimiento, WebGL y scroll.

## Pendientes manuales por prioridad

1. Revisar los cambios locales y decidir cuándo publicarlos. Producción sigue usando el CSS anterior.
2. Tras un despliegue autorizado, comprobar los archivos publicados, robots, sitemap y URLs, y usar «Probar URL publicada» para revisar HTML y visibilidad. Esa prueba no exige volver a solicitar indexación.
3. Seguir Gemelo Digital en Indexación → Páginas: fecha de rastreo, canonical seleccionada cuando esté disponible y motivos de exclusión. Mantener la solicitud ya realizada.
4. Comprobar en Sitemaps las 16 URLs y la lectura del archivo; conservar las redirecciones correctas de las alternativas.
5. Aportar información real para las ocho fichas breves y completar contexto y evidencia de Gemelo Digital.
6. Autorizar por separado una corrección de la política en su repositorio independiente, si se desea aplicar su exclusión.
7. Revisar rendimiento y Core Web Vitals con los datos que Google tenga disponibles. Las pruebas locales no sustituyen esos informes.

No se modificaron DNS, redirecciones ni verificación. No se añadió Analytics, se instalaron dependencias, se desplegó el sitio ni se enviaron solicitudes de indexación. Google toma la decisión final sobre la indexación.
