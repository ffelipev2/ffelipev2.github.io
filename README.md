# Felipe Flores — Portfolio Personal

Este repositorio contiene el código fuente del sitio personal y portfolio profesional de Felipe Flores, enfocado en IoT, Industria 4.0, educación tecnológica, proyectos, experiencia, publicaciones y contacto.

**Sitio:** [felipeflores.tech](https://felipeflores.tech)

## Tecnologías

- HTML5, CSS3 y JavaScript sin framework.
- Datos de proyectos en JSON.
- Node.js con scripts ESM para generación y validación del sitio.
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

El proyecto no define un servidor de desarrollo propio. Para generar y validar el sitio:

```bash
npm run build
```

Para servir la raíz del proyecto localmente con Python 3:

```bash
python -m http.server 4173
```

Luego abre `http://localhost:4173/`.

## Build

```bash
npm run build
```

El comando genera las páginas de proyectos, valida enlaces y metadatos, y construye el worker estático en `dist/`. También se puede ejecutar la validación por separado con `npm test`.

## Deployment

El sitio se publica como un worker estático mediante OpenAI Sites. La configuración en `.openai/hosting.json` vincula el proyecto de hosting y es leída durante el build; no contiene secretos. El archivo `CNAME` conserva la referencia al dominio público.

## Assets y uso de contenido

El repositorio incluye fotografías, imágenes de proyectos, CV, textos personales y otros recursos utilizados por el sitio. El código queda sujeto a la licencia definida para el repositorio; las fotografías, CV, publicaciones, identidad visual y contenido personal no deben reutilizarse sin autorización expresa.

## Autor

Felipe Flores  
Sitio: [https://felipeflores.tech](https://felipeflores.tech)
