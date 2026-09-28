# Pendientes de contenido y SEO

Este documento registra lo que falta después de la auditoría SEO del portafolio. Las fichas publicadas contienen solo datos respaldados por el repositorio; no se deben completar resultados, componentes ni arquitectura por suposición.

Última revisión: **28 de septiembre de 2026**. La comprobación del despliegue y de WebKit/iOS corresponde a la versión `b6c5cb1` del portafolio; la ficha de Gemelo Digital se amplió después con la documentación y el código de su repositorio.

## Resultado de la revisión

- [x] Validación local: 17 HTML, nueve proyectos, enlaces locales, metadatos y sintaxis JavaScript sin errores (`npm test`).
- [x] Las 16 URL del sitemap responden con HTTP 200, declaran su canonical esperada y permiten indexación mediante `index, follow`.
- [x] `robots.txt` y `sitemap.xml` responden con HTTP 200; el sitemap publicado contiene las 16 URL previstas.
- [x] El teléfono ya no aparece en las 16 páginas publicadas. El CV publicado coincide byte por byte con el PDF local del que se retiró el teléfono.
- [x] Confirmados los años, DOI y la distinción entre una autoría y dos reconocimientos en las publicaciones.
- [ ] La política de la app responde, pero **la versión pública carece de `noindex` y canonical**. Coincide byte por byte con el archivo del repositorio independiente [ffelipev2/politicasffelipev2.github.io](https://github.com/ffelipev2/politicasffelipev2.github.io/blob/main/index.html), que tiene GitHub Pages habilitado. El archivo de este portafolio sí contiene esos metadatos; actualizarlo aquí no ha cambiado la respuesta de esa URL pública.
- [ ] La suite WebKit/iOS sigue teniendo una falla intermitente de scroll: 20 pruebas aprobadas, 11 omitidas y una fallida. La prueba fallida pasó en tres repeticiones aisladas.

La disponibilidad HTTP y la canonical declarada se comprobaron mediante solicitudes directas al sitio. Esto no confirma la indexación ni la canonical seleccionada por Google, que siguen requiriendo revisión en Search Console.

## 1. Completar los casos de estudio

**Estado actual de los datos:** los nueve proyectos tienen objetivo y una lista de hardware; cuatro identifican software y dos incluyen un flujo de funcionamiento. Gemelo Digital ya incluye arquitectura, desarrollo, dificultades abordadas en el código, resultado publicado y recursos enlazados. Los ocho proyectos restantes aún carecen de esos detalles. Ninguno tiene problema original confirmado, aprendizajes, galería adicional, fecha, rol ni contexto individual en los campos opcionales. Las imágenes principales y los enlaces a demostraciones existentes se conservan; la procedencia de las fotografías sigue por confirmar.

La ficha de Gemelo Digital se contrastó con [GemeloDigitalEsp32, versión `1bb9645`](https://github.com/ffelipev2/GemeloDigitalEsp32/tree/1bb964591ca05e777450541ad168b5018426c0f3), publicada el 26 de septiembre de 2026: README, firmware, configuración Android, visor nativo y núcleo de orientación. Su versión actual usa ESP32-C3, BNO08x, BLE y app Android; la imagen y el video existentes se identifican como demostración original. Los intervalos de 20 ms del sensor y 40 ms de BLE son configuración del firmware, sin presentarlos como mediciones de rendimiento. Las pruebas descritas usan sensores simulados. Para completar el caso aún hacen falta contexto y fechas originales, participación concreta, aprendizajes, mediciones con hardware real y fotografías o capturas de la versión Android.

Para cada proyecto, reunir y validar:

- [ ] Contexto, problema concreto y objetivo original.
- [ ] Diagrama o explicación del flujo entre hardware, software y usuario.
- [ ] Modelos exactos de componentes, sensores, controladores y herramientas utilizadas.
- [ ] Pasos de desarrollo, dificultades técnicas y decisiones tomadas.
- [ ] Resultados observables, con cifras y condiciones de prueba solo si existen registros.
- [ ] Aplicaciones posibles y aprendizajes basados en la experiencia real.
- [ ] Fecha, contexto académico o profesional y rol de Felipe Flores.
- [ ] Fotografías propias con descripción y dimensiones, repositorio y recursos públicos verificables.

Preguntas específicas para completar [data/projects.json](../data/projects.json):

| Proyecto | Información por confirmar |
| --- | --- |
| Gemelo Digital | Contexto y fechas originales, participación, aprendizajes, pruebas con hardware real y material visual de la app Android. Componentes, recorrido de datos y visor nativo ya verificados en el repositorio. |
| Chat con LoRa | Placas y módulos exactos, protocolo de mensajes, alcance medido si existe y condiciones de las pruebas. |
| UFACTORY LITE 6 | Cámara o sistema de visión, método de clasificación, integración con el brazo y resultados. |
| HuskyLens + ESP32 | Clases de colores, respuesta del prototipo, conexiones y pruebas. |
| Sensor HiGrow + App | Variables medidas, plataforma de la app, transporte de datos y resultados observados. |
| Sensor biométrico con Ethernet | Modelos del sensor y shield, lógica de acceso, almacenamiento y pruebas. |
| Robot Otto RC | Controlador, método de control remoto, archivos de impresión 3D y contexto educativo. |
| Arduino + Bluetooth + Relé | Componentes exactos, aplicación, actuadores controlados y pruebas. |
| Vehículo Arduino + Cámara Wi-Fi | Cámara y enlace de control, alimentación, autonomía medida si existe y pruebas de campo. |

La plantilla en [scripts/build-site.mjs](../scripts/build-site.mjs) ya admite secciones opcionales, galería y recursos. Añadir contenido a los datos y ejecutar `npm run build`; las secciones sin datos permanecen ocultas.

## 2. Revisiones editoriales y legales

- [ ] Confirmar que títulos, descripciones y relaciones temáticas reflejan con precisión cada proyecto.
- [x] Verificar años, DOI, identidad y orden de autores, y alcance de las dos colaboraciones en [data/publications.json](../data/publications.json). Felipe Flores figura como autor en [Applied Sciences, 2024](https://www.mdpi.com/2076-3417/14/21/9746/notes) y en los agradecimientos de [Fractal and Fractional, 2025](https://www.mdpi.com/2504-3110/9/10/639) y [Atmosphere, 2025](https://www.mdpi.com/2073-4433/16/9/1044). Estas dos últimas se presentan correctamente como colaboraciones reconocidas.
- [ ] Normalizar la cita de Fractal and Fractional: escribir `Pacheco Hernández, P.; Navarro Ahumada, G.` en lugar de `Hernández, P.P.; Ahumada, G.N.` para conservar los apellidos compuestos de sus dos primeros autores.
- [ ] Revisar la vigencia legal del texto de [la política de la aplicación](../politicasffelipev2.github.io/index.html) antes de editarlo. Conservar su URL; el archivo local contiene `noindex, follow` y la política está fuera del sitemap del portafolio.
- [ ] Como mantenimiento futuro, revisar el CV PDF cuando cambie la trayectoria y mantener la home HTML como perfil principal. Su retirada del teléfono ya está verificada en el PDF publicado.

La revisión legal requiere conocer el funcionamiento y los servicios actuales de la app. La lectura del texto existente no permite darla por completada. El `noindex, follow` citado arriba describe el archivo local; queda pendiente aplicarlo en la versión que se publica desde el repositorio independiente.

## 3. Después del despliegue

- [ ] Enviar `https://felipeflores.tech/sitemap.xml` a Google Search Console.
- [ ] Inspeccionar las 16 URL indexables de abajo y solicitar indexación donde corresponda.
- [ ] Comprobar la canonical elegida, cobertura, resultados enriquecidos y posibles errores de rastreo.
- [x] Verificar que `https://felipeflores.tech/politicasffelipev2.github.io/` siga respondiendo: HTTP 200.
- [ ] Actualizar los metadatos del despliegue de la política en el repositorio independiente y comprobar que la URL pública entregue `noindex, follow` y su canonical. Después, revisar en Search Console que Google la excluya por `noindex`. No está incluida en el sitemap del portafolio.
- [ ] Medir Core Web Vitals con datos reales de usuarios tras el despliegue; priorizar problemas observados antes de modificar el hero 3D o los vídeos.

El envío del sitemap, la cobertura, la canonical elegida por Google y los datos reales de Core Web Vitals no se verificaron en esta revisión. Las pruebas locales y las respuestas HTTP no sustituyen esos datos.

### URL que inspeccionar

- https://felipeflores.tech/
- https://felipeflores.tech/proyectos/
- https://felipeflores.tech/proyectos/gemelo-digital/
- https://felipeflores.tech/proyectos/chat-lora/
- https://felipeflores.tech/proyectos/ufactory-lite-6/
- https://felipeflores.tech/proyectos/huskylens-esp32/
- https://felipeflores.tech/proyectos/sensor-higrow-esp32-app/
- https://felipeflores.tech/proyectos/ethernet-sensor-biometrico/
- https://felipeflores.tech/proyectos/robot-otto-arduino-3d/
- https://felipeflores.tech/proyectos/arduino-bluetooth-rele/
- https://felipeflores.tech/proyectos/vehiculo-arduino-camara-wifi/
- https://felipeflores.tech/esp32/
- https://felipeflores.tech/iot/
- https://felipeflores.tech/industria-4-0/
- https://felipeflores.tech/robotica/
- https://felipeflores.tech/publicaciones/

## 4. Validación técnica pendiente

- [x] Repetir la suite completa en WebKit/iOS y comprobar que el runner cierre: `npx playwright test --project=ios-webkit --reporter=line`. La ejecución terminó en 1,4 minutos con 20 aprobadas, 11 omitidas por las condiciones de plataforma y una fallida. Las dos pruebas de SEO aprobaron.
- [ ] Investigar y resolver la falla intermitente de [tests/scroll-quality.spec.js](../tests/scroll-quality.spec.js), prueba `scroll progress follows the page without added inertia`: progreso esperado `0.3`, observado `0`. La repetición aislada con `--grep 'scroll progress follows' --repeat-each=3` aprobó tres de tres en 7,3 segundos. El resultado mantiene abierto el pendiente; no demuestra por sí solo un fallo visible de la interfaz ni permite dar la suite por estable. Revisar la sincronización del scroll, la visibilidad y el momento de lectura antes de cambiar la animación.
