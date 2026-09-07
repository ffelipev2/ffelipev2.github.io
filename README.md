# Felipe Flores — Portfolio Personal

Este repositorio contiene el código fuente del sitio personal y portfolio profesional de Felipe Flores, enfocado en IoT, Industria 4.0, educación tecnológica, proyectos, experiencia, publicaciones y contacto.

**Sitio:** [felipeflores.tech](https://felipeflores.tech)

## Tecnologías

- HTML5, CSS3 y JavaScript sin framework.
- Datos de proyectos en JSON.
- Node.js con scripts ESM para generación y validación del sitio.
- Three.js, cargado bajo demanda únicamente en el hero; esbuild genera su módulo estático.
- OpenAI Sites / worker estático compatible con Cloudflare para el despliegue.

## Estructura del proyecto

- `index.html`: portada y secciones principales.
- `css/` y `js/`: estilos e interacciones del sitio.
- `data/`: información estructurada de los proyectos.
- `proyectos/`: índice y páginas de detalle de proyectos.
- `images/` y `docs/`: fotografías, imágenes de proyectos, favicons y CV público.
- `scripts/`: generación de páginas, validación y construcción del worker estático.
- `.openai/hosting.json`: configuración necesaria para el proyecto de despliegue.
- `bower_components/`: recursos frontend heredados conservados por el repositorio; no se eliminan sin una auditoría específica.

## Ejecución local

Instala las dependencias con `npm ci`. `npm run dev` genera el módulo 3D antes de iniciar el servidor. Si editas la escena durante la previsualización, ejecuta `node scripts/build-hero.mjs` y recarga la página.

Para previsualizar el sitio con un origen HTTP local —necesario para que los videos de YouTube se reproduzcan dentro de la página— ejecuta:

```bash
npm run dev
```

Luego abre:

`http://127.0.0.1:4173/`

Para regenerar páginas, sitemap y el worker estático antes de previsualizar, ejecuta también `npm run build`.

## Build

```bash
npm run build
```

El comando genera las páginas de proyectos, valida enlaces y metadatos, y construye el worker estático en `dist/`. También se puede ejecutar la validación por separado con `npm test`.

El módulo `js/hero/scene.bundle.js` y su licencia se conservan en el repositorio para que la portada también funcione en un hosting estático sin compilación, como GitHub Pages. No se editan manualmente.

## Hero 3D y sistema visual

La implementación, decisiones de rendimiento, paleta, archivos y limitaciones se describen en [docs/hero-3d.md](docs/hero-3d.md).

Para ejecutar las comprobaciones de navegador: instala Chrome y ejecuta `npx playwright install webkit`, luego `npm run test:browser`. Se comprueban escritorio, tablet, Android emulado y WebKit con viewport de iPhone; esto no sustituye las pruebas en teléfonos físicos. Las capturas y resultados temporales se guardan en `test-results/`, fuera del control de versiones.

## Deployment

El sitio se publica como un worker estático mediante OpenAI Sites. La configuración en `.openai/hosting.json` vincula el proyecto de hosting y es leída durante el build; no contiene secretos. El archivo `CNAME` conserva la referencia al dominio público.

## Assets y uso de contenido

El repositorio incluye fotografías, imágenes de proyectos, CV, textos personales y otros recursos utilizados por el sitio. El código queda sujeto a la licencia definida para el repositorio; las fotografías, CV, publicaciones, identidad visual y contenido personal no deben reutilizarse sin autorización expresa.

## Autor

Felipe Flores  
Sitio: [https://felipeflores.tech](https://felipeflores.tech)
