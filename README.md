# Felipe Flores

**Tecnología aplicada para enseñar, innovar y construir.**

[Visitar felipeflores.tech](https://felipeflores.tech)

Mi plataforma reúne proyectos, experiencias y conocimientos que conectan la tecnología con desafíos reales de la industria, la educación y la sociedad.

Soy Felipe Flores, Ingeniero Civil Informático y Magíster en Alta Dirección y Gestión de Instituciones Educacionales. Mi trabajo combina IoT, automatización, robótica, fabricación digital y educación superior para desarrollar soluciones y experiencias de aprendizaje aplicadas.

## Explora la plataforma

- **[Inicio](https://felipeflores.tech/#inicio):** una presentación de mi trabajo y de la conexión entre el mundo físico y el digital.
- **[Proyectos](https://felipeflores.tech/proyectos/):** soluciones y demostraciones de gemelos digitales, comunicación LoRa, robótica, visión artificial y dispositivos conectados.
- **[Sobre mí](https://felipeflores.tech/#perfil):** mi enfoque profesional en Industria 4.0, educación tecnológica e innovación aplicada.
- **[Experiencia](https://felipeflores.tech/#experiencia):** trayectoria profesional, docencia, coordinación académica y desarrollo de laboratorios y proyectos.
- **[Áreas de trabajo](https://felipeflores.tech/#tecnologias):** disciplinas y herramientas presentes en mis proyectos y actividades educativas.
- **[Formación y publicaciones](https://felipeflores.tech/#publicaciones):** estudios, certificaciones, investigación y contribuciones académicas.
- **[Publicaciones](https://felipeflores.tech/publicaciones/):** autoría y colaboraciones reconocidas, con enlaces DOI.
- **Áreas:** [ESP32](https://felipeflores.tech/esp32/), [IoT](https://felipeflores.tech/iot/), [Industria 4.0](https://felipeflores.tech/industria-4-0/) y [robótica](https://felipeflores.tech/robotica/).
- **[Contacto](https://felipeflores.tech/#contacto):** un espacio para conversar sobre proyectos, colaboración e iniciativas educativas.

## Proyectos y documentación

- **[Cámara térmica Ziboo ZP2](https://felipeflores.tech/proyectos/camara-termica-ziboo-zp2/):** app Android propia para volver a utilizar la cámara por USB-C, con visor, herramientas de selección y exportación local. [Código y APK](https://github.com/ffelipev2/camaraZiboo).
- **[HiGrow ESP32 y Android](https://felipeflores.tech/proyectos/sensor-higrow-esp32-app/):** monitor local de temperatura, humedad ambiental, sustrato y luminosidad mediante BLE. [Firmware, app y protocolo](https://github.com/ffelipev2/HiGrow-ESP32-BLE).
- **[Gemelo Digital](https://felipeflores.tech/proyectos/gemelo-digital/):** orientación de un dispositivo con ESP32-C3 y BNO08x reproducida en un modelo 3D en Android mediante BLE. [Código del proyecto](https://github.com/ffelipev2/GemeloDigitalEsp32).
- **[Chat con LoRa](https://felipeflores.tech/proyectos/chat-lora/):** mensajería entre placas Heltec WiFi LoRa 32 V2 desde una interfaz web local, con detección de nodos y pantalla OLED. [Código y documentación](https://github.com/ffelipev2/Heltecv2_Chat).
- **[UFACTORY LITE 6](https://felipeflores.tech/proyectos/ufactory-lite-6/):** robótica aplicada a la educación y la industria.

## Conectemos

Me interesa transformar ideas en soluciones concretas y compartir experiencias que acerquen la tecnología a las personas.

[Hablemos de tu proyecto](https://felipeflores.tech/#contacto) · [Conoce mi trayectoria](https://felipeflores.tech/docs/Felipe-CV.pdf)

## Contenido del sitio

El sitio es HTML, CSS y JavaScript estáticos. `data/projects.json` alimenta las fichas, el índice y las páginas temáticas mediante `scripts/build-site.mjs`. `scripts/site-config.mjs` reúne el dominio y las áreas temáticas que comparten la generación, la validación y las pruebas. `data/publications.json` alimenta la página de publicaciones. Ejecuta `npm run build` tras editar los datos; el comando regenera las páginas y el sitemap, y valida el sitio para GitHub Pages.

`npm test` comprueba metadatos, URLs del sitemap, recursos y alcance de las páginas mediante enlaces HTML, sin depender de una cantidad fija de proyectos. `npm run test:browser` ejecuta las pruebas de navegación, presentación y SEO, incluidas las comprobaciones con JavaScript desactivado y sin scroll inicial. Las pruebas de generación usan una copia temporal aislada para verificar que un proyecto y un tema nuevos aparezcan en el sitemap; no modifican el catálogo real. Al eliminar o renombrar una ficha, retirar también su HTML anterior y revisar los enlaces existentes: el generador no borra archivos antiguos automáticamente.

Las fichas admiten `objective`, `problem`, `architecture`, `hardware`, `software`, `howItWorks`, `development`, `challenges`, `result`, `applications`, `learning`, `images` (con `src`, `alt`, `width`, `height` y `caption` opcional) y `resources` (con `label` y `url`). `heroImage` y las entradas de `images` admiten `originalSrc` opcional para abrir el archivo original mientras `src` sirve una copia optimizada; sin ese campo ambos usan `src`. Cada campo solo se muestra cuando tiene contenido. Para ampliarlas hacen falta datos reales sobre componentes, arquitectura, dificultades, resultados, fechas, fotografías y repositorios. No se deben publicar cifras o características deducidas de los vídeos sin verificarlas.

Las galerías formadas por capturas verticales conservan la imagen completa con un formato de pantalla de teléfono; las tarjetas también evitan recortar las imágenes verticales. Las seis capturas de HiGrow están copiadas del repositorio en `images/higrow-esp32-ble/`, con originales PNG y copias WebP. Las dos capturas reales de Ziboo aportadas por Felipe están en `images/camara-ziboo-zp2/`, con originales JPEG y copias WebP. Todas se sirven desde la web y los enlaces de ampliación abren los originales locales. Las capturas de Ziboo corresponden a una versión previa a la 0.3.2, y las lecturas térmicas conservan su estado de validación descrito en la ficha y el repositorio.

El CV en `docs/Felipe-CV.pdf` sigue disponible y puede indexarse aunque esté fuera del sitemap. La copia local de la política de la app «Arduino y Componentes» en `/politicasffelipev2.github.io/` contiene `noindex, follow` y está fuera del sitemap. La versión pública se sirve desde el repositorio independiente `ffelipev2/politicasffelipev2.github.io` y aún carece de esos metadatos; modificar esta copia no corrige esa publicación. Conviene revisar manualmente su vigencia legal antes de modificar su texto.

La documentación de SEO y marca personal se concentra en tres archivos:

- [Plan SEO de contenidos](docs/PLAN-SEO-CONTENIDOS.md): datos de Search Console, oportunidades pendientes y medición a 30/60 días.
- [Propuesta de marca personal](docs/PROPUESTA-MARCA-PERSONAL.md): objetivo de marca, tono y criterios editoriales; tiene prioridad sobre el plan SEO cuando difieren.
- [Implementación de la fase 1](docs/IMPLEMENTACION-SEO-MARCA-FASE-1.md): cambios aplicados, pruebas y publicación verificada del commit `48b6d2b`.

Las auditorías anteriores, su captura técnica y la lista antigua de pendientes se retiraron de la documentación activa. Los pendientes útiles se conservan en el plan SEO y los antecedentes siguen disponibles en el [historial de Git](https://github.com/ffelipev2/ffelipev2.github.io/tree/27f05d3/docs).
