# Pendientes de contenido y SEO

Este documento registra lo que falta después de la auditoría SEO del portafolio. Las fichas publicadas contienen solo datos respaldados por el repositorio; no se deben completar resultados, componentes ni arquitectura por suposición.

## 1. Completar los casos de estudio

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
| Gemelo Digital | Proceso representado, sensores, recorrido de datos, tecnología de la visualización y pruebas realizadas. |
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
- [ ] Verificar autores, año, DOI y alcance de las dos colaboraciones en [data/publications.json](../data/publications.json). No presentarlas como autoría.
- [ ] Revisar la vigencia legal del texto de [la política de la aplicación](../politicasffelipev2.github.io/index.html) antes de editarlo. Conservar su URL; la página tiene `noindex, follow` y está fuera del sitemap.
- [ ] Revisar el CV PDF cuando cambie la trayectoria y mantener la home HTML como perfil principal.

## 3. Después del despliegue

- [ ] Enviar `https://felipeflores.tech/sitemap.xml` a Google Search Console.
- [ ] Inspeccionar las 16 URL indexables de abajo y solicitar indexación donde corresponda.
- [ ] Comprobar la canonical elegida, cobertura, resultados enriquecidos y posibles errores de rastreo.
- [ ] Verificar que `https://felipeflores.tech/politicasffelipev2.github.io/` siga respondiendo y figure como excluida por `noindex`.
- [ ] Medir Core Web Vitals con datos reales de usuarios tras el despliegue; priorizar problemas observados antes de modificar el hero 3D o los vídeos.

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

- [ ] Repetir la suite completa en WebKit iOS cuando el runner de Playwright cierre correctamente. Una prueba preexistente de desplazamiento falló de forma intermitente durante la auditoría y pasó al ejecutarla aislada; las pruebas nuevas de SEO pasaron en WebKit.
