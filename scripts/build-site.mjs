import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, '..');
const projects = JSON.parse(
    await readFile(path.join(rootDirectory, 'data', 'projects.json'), 'utf8')
);
const siteOrigin = 'https://felipeflores.tech';

const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => entities[character]);
const jsonForHtml = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const rootPrefix = (pageDepth) => '../'.repeat(pageDepth);
const localFile = (rootPath, pageDepth) => rootPrefix(pageDepth) + rootPath.replace(/^\/+/, '');
const homeFile = (pageDepth, fragment = '') => rootPrefix(pageDepth) + 'index.html' + fragment;

function headMarkup({ title, description, canonicalPath, image, imageWidth, imageHeight, imageAlt, schema, pageDepth }) {
    const canonical = siteOrigin + canonicalPath;
    const absoluteImage = image.startsWith('http') ? image : siteOrigin + image;

    return [
        '<!doctype html>',
        '<html lang="es-CL">',
        '<head>',
        '    <meta charset="utf-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1">',
        '    <title>' + escapeHtml(title) + '</title>',
        '    <meta name="description" content="' + escapeHtml(description) + '">',
        '    <meta name="author" content="Felipe Igor Flores Valdebenito">',
        '    <meta name="robots" content="index, follow">',
        '    <meta name="theme-color" content="#0a1733">',
        '    <link rel="canonical" href="' + canonical + '">',
        '',
        '    <meta property="og:locale" content="es_CL">',
        '    <meta property="og:site_name" content="Felipe Flores">',
        '    <meta property="og:title" content="' + escapeHtml(title) + '">',
        '    <meta property="og:description" content="' + escapeHtml(description) + '">',
        '    <meta property="og:image" content="' + absoluteImage + '">',
        '    <meta property="og:image:width" content="' + imageWidth + '">',
        '    <meta property="og:image:height" content="' + imageHeight + '">',
        '    <meta property="og:image:alt" content="' + escapeHtml(imageAlt) + '">',
        '    <meta property="og:url" content="' + canonical + '">',
        '    <meta property="og:type" content="website">',
        '',
        '    <meta name="twitter:card" content="summary_large_image">',
        '    <meta name="twitter:title" content="' + escapeHtml(title) + '">',
        '    <meta name="twitter:description" content="' + escapeHtml(description) + '">',
        '    <meta name="twitter:image" content="' + absoluteImage + '">',
        '    <meta name="twitter:image:alt" content="' + escapeHtml(imageAlt) + '">',
        '    <script type="application/ld+json">' + jsonForHtml(schema) + '</script>',
        '    <link rel="stylesheet" href="' + localFile('/css/portfolio.css', pageDepth) + '">',
        '    <link rel="icon" href="' + localFile('/images/favicon.svg', pageDepth) + '" sizes="any" type="image/svg+xml">',
        '    <link rel="icon" href="' + localFile('/images/favicon.ico', pageDepth) + '" type="image/x-icon">',
        '</head>'
    ].join('\n');
}

function headerMarkup(pageDepth) {
    return [
        '<body class="portfolio-page">',
        '    <a class="skip-link" href="#main-content">Saltar al contenido principal</a>',
        '    <header class="site-header-v2" data-site-header>',
        '        <div class="shell header-inner-v2">',
        '            <a class="brand-v2" href="' + homeFile(pageDepth) + '" aria-label="Felipe Flores, inicio">Felipe <span>Flores</span></a>',
        '            <nav class="desktop-nav-v2" aria-label="Navegación principal">',
        '                <a href="' + homeFile(pageDepth, '#proyectos') + '">Proyectos</a>',
        '                <a href="' + homeFile(pageDepth, '#experiencia') + '">Experiencia</a>',
        '                <a href="' + homeFile(pageDepth, '#perfil') + '">Perfil</a>',
        '                <a href="' + homeFile(pageDepth, '#publicaciones') + '">Publicaciones</a>',
        '                <a href="' + homeFile(pageDepth, '#contacto') + '">Contacto</a>',
        '            </nav>',
        '            <a class="button-v2 button-primary-v2 cv-button-v2" href="' + localFile('/docs/Felipe-CV.pdf', pageDepth) + '" target="_blank" rel="noopener noreferrer">Descargar CV <span aria-hidden="true">↓</span></a>',
        '            <button class="menu-toggle-v2" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span><span></span></button>',
        '        </div>',
        '    </header>',
        '    <div class="menu-overlay" data-menu-close hidden></div>',
        '    <aside class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menú móvil" aria-hidden="true" tabindex="-1" inert>',
        '        <div class="mobile-menu-head">',
        '            <a class="brand-v2" href="' + homeFile(pageDepth) + '" data-menu-link>Felipe <span>Flores</span></a>',
        '            <button class="menu-close" type="button" aria-label="Cerrar menú" data-menu-close>×</button>',
        '        </div>',
        '        <nav class="mobile-nav" aria-label="Navegación móvil">',
        '            <a href="' + homeFile(pageDepth) + '" data-menu-link><span aria-hidden="true">⌂</span> Inicio</a>',
        '            <details open>',
        '                <summary><span><span aria-hidden="true">□</span> Proyectos</span><span aria-hidden="true">⌄</span></summary>',
        '                <div class="mobile-submenu">',
        '                    <a href="' + localFile('/proyectos/gemelo-digital/index.html', pageDepth) + '" data-menu-link>Gemelo Digital</a>',
        '                    <a href="' + localFile('/proyectos/chat-lora/index.html', pageDepth) + '" data-menu-link>Chat con LoRa</a>',
        '                    <a href="' + localFile('/proyectos/ufactory-lite-6/index.html', pageDepth) + '" data-menu-link>UFACTORY LITE 6</a>',
        '                    <a href="' + localFile('/proyectos/index.html', pageDepth) + '" data-menu-link>Todos los proyectos</a>',
        '                </div>',
        '            </details>',
        '            <a href="' + homeFile(pageDepth, '#experiencia') + '" data-menu-link><span aria-hidden="true">◇</span> Experiencia</a>',
        '            <a href="' + homeFile(pageDepth, '#perfil') + '" data-menu-link><span aria-hidden="true">○</span> Perfil</a>',
        '            <a href="' + homeFile(pageDepth, '#publicaciones') + '" data-menu-link><span aria-hidden="true">▱</span> Publicaciones</a>',
        '            <a href="' + homeFile(pageDepth, '#contacto') + '" data-menu-link><span aria-hidden="true">✉</span> Contacto</a>',
        '        </nav>',
        '        <div class="mobile-menu-footer">',
        '            <a class="button-v2 button-outline-v2" href="' + localFile('/docs/Felipe-CV.pdf', pageDepth) + '" target="_blank" rel="noopener noreferrer">Descargar CV <span aria-hidden="true">↓</span></a>',
        '            <div class="mobile-socials">',
        '                <a href="https://www.linkedin.com/in/felipe-flores-2972b14a/" target="_blank" rel="noopener noreferrer">LinkedIn</a>',
        '                <a href="https://github.com/ffelipev2" target="_blank" rel="noopener noreferrer">GitHub</a>',
        '                <a href="https://www.facebook.com/arduinoproyectos/" target="_blank" rel="noopener noreferrer">Proyectos Arduino</a>',
        '            </div>',
        '        </div>',
        '    </aside>'
    ].join('\n');
}

function contactMarkup() {
    return [
        '        <section class="contact-section" id="contacto" aria-labelledby="contact-title">',
        '            <div class="shell contact-grid">',
        '                <div>',
        '                    <p class="eyebrow-v2">Contacto</p>',
        '                    <h2 id="contact-title">¿Tienes una idea o desafío tecnológico?</h2>',
        '                    <p>Estoy disponible para colaborar en proyectos, docencia, investigación y desarrollo tecnológico.</p>',
        '                    <div class="contact-actions">',
        '                        <a class="button-v2 button-light-v2" href="mailto:ffelipev2@gmail.com">Contactarme <span aria-hidden="true">↗</span></a>',
        '                        <a class="button-v2 button-dark-outline-v2" href="https://www.linkedin.com/in/felipe-flores-2972b14a/" target="_blank" rel="noopener noreferrer">Ver en LinkedIn <span aria-hidden="true">↗</span></a>',
        '                    </div>',
        '                </div>',
        '                <address class="contact-details">',
        '                    <a href="mailto:ffelipev2@gmail.com"><span aria-hidden="true">✉</span> ffelipev2@gmail.com</a>',
        '                    <a href="tel:+56961284180"><span aria-hidden="true">☎</span> +56 9 6128 4180</a>',
        '                    <p><span aria-hidden="true">⌖</span> Santiago, Chile</p>',
        '                </address>',
        '            </div>',
        '        </section>'
    ].join('\n');
}

function footerMarkup(pageDepth) {
    return [
        '    <footer class="site-footer">',
        '        <div class="shell footer-grid">',
        '            <p>© 2026 Felipe Flores Valdebenito.</p>',
        '            <nav aria-label="Enlaces sociales">',
        '                <a href="https://www.linkedin.com/in/felipe-flores-2972b14a/" target="_blank" rel="noopener noreferrer">LinkedIn</a>',
        '                <a href="https://github.com/ffelipev2" target="_blank" rel="noopener noreferrer">GitHub</a>',
        '                <a href="https://www.facebook.com/arduinoproyectos/" target="_blank" rel="noopener noreferrer">Proyectos Arduino</a>',
        '            </nav>',
        '            <a class="back-to-top" href="#main-content" aria-label="Volver al inicio">↑</a>',
        '        </div>',
        '    </footer>',
        '    <script src="' + localFile('/js/portfolio.js', pageDepth) + '" defer></script>',
        '</body>',
        '</html>'
    ].join('\n');
}

function videoDialogMarkup() {
    return [
        '    <dialog class="video-dialog" id="video-dialog" aria-labelledby="video-dialog-title">',
        '        <div class="dialog-header">',
        '            <h2 id="video-dialog-title">Demostración del proyecto</h2>',
        '            <button type="button" data-dialog-close aria-label="Cerrar video">×</button>',
        '        </div>',
        '        <div class="dialog-video" data-dialog-video></div>',
        '        <div class="dialog-footer">',
        '            <p>El reproductor se carga solo después de tu interacción y no inicia automáticamente.</p>',
        '            <a data-dialog-youtube href="#" target="_blank" rel="noopener noreferrer">Ver en YouTube <span aria-hidden="true">↗</span></a>',
        '        </div>',
        '    </dialog>'
    ].join('\n');
}

function projectCardMarkup(project, pageDepth) {
    const projectPath = localFile('/proyectos/' + project.slug + '/index.html', pageDepth);
    return [
        '                <article class="project-card-v2">',
        '                    <div class="project-media-v2">',
        '                        <a class="project-image-v2" href="' + projectPath + '" aria-label="Conocer el proyecto ' + escapeHtml(project.title) + '">',
        '                            <img src="' + localFile(project.image, pageDepth) + '" width="' + project.imageWidth + '" height="' + project.imageHeight + '" loading="lazy" decoding="async" alt="' + escapeHtml(project.alt) + '">',
        '                        </a>',
        '                        <button class="play-chip" type="button" data-video-id="' + project.videoId + '" data-video-title="' + escapeHtml(project.title) + '" aria-label="Ver demostración de ' + escapeHtml(project.title) + '"><span aria-hidden="true">▶</span> Demo</button>',
        '                    </div>',
        '                    <div class="project-body-v2">',
        '                        <p class="project-tags-v2">' + project.tags.map(escapeHtml).join(' · ') + '</p>',
        '                        <h2><a href="' + projectPath + '">' + escapeHtml(project.cardTitle) + '</a></h2>',
        '                        <p>' + escapeHtml(project.description) + '</p>',
        '                        <a href="' + projectPath + '">Ver proyecto <span aria-hidden="true">→</span></a>',
        '                    </div>',
        '                </article>'
    ].join('\n');
}

function projectsIndexPage() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Proyectos tecnológicos de Felipe Flores',
        description: 'Nueve proyectos reales de IoT, robótica, automatización, comunicaciones y fabricación digital.',
        url: siteOrigin + '/proyectos/',
        inLanguage: 'es-CL',
        author: { '@id': siteOrigin + '/#person' },
        hasPart: projects.map((project) => ({
            '@type': 'CreativeWork',
            name: project.title,
            url: siteOrigin + '/proyectos/' + project.slug + '/',
            image: siteOrigin + project.image
        }))
    };

    return [
        headMarkup({
            title: 'Proyectos tecnológicos | Felipe Flores',
            description: 'Proyectos reales de Felipe Flores en IoT con ESP32, LoRa, robótica, visión artificial, domótica, sensores e impresión 3D.',
            canonicalPath: '/proyectos/',
            image: '/images/img7.webp',
            imageWidth: 500,
            imageHeight: 333,
            imageAlt: 'Selección de proyectos tecnológicos de Felipe Flores',
            schema,
            pageDepth: 1
        }),
        headerMarkup(1),
        '    <main id="main-content">',
        '        <section class="inner-hero" aria-labelledby="all-projects-title">',
        '            <div class="shell">',
        '                <p class="eyebrow-v2">Portfolio de proyectos</p>',
        '                <h1 id="all-projects-title">Tecnología aplicada en proyectos reales.</h1>',
        '                <p>Una selección completa de soluciones con IoT, ESP32, LoRa, robótica, visión artificial, domótica y fabricación digital.</p>',
        '            </div>',
        '        </section>',
        '        <section class="section-v2" aria-label="Todos los proyectos">',
        '            <div class="shell all-projects-grid">',
        projects.map((project) => projectCardMarkup(project, 1)).join('\n'),
        '            </div>',
        '        </section>',
        contactMarkup(),
        '    </main>',
        videoDialogMarkup(),
        footerMarkup(1)
    ].join('\n');
}

function projectSchema(project) {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CreativeWork',
                '@id': siteOrigin + '/proyectos/' + project.slug + '/#project',
                name: project.title,
                description: project.description,
                url: siteOrigin + '/proyectos/' + project.slug + '/',
                image: siteOrigin + project.image,
                inLanguage: 'es-CL',
                keywords: project.tags.join(', '),
                sameAs: project.videoUrl,
                creator: { '@id': siteOrigin + '/#person' }
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteOrigin + '/' },
                    { '@type': 'ListItem', position: 2, name: 'Proyectos', item: siteOrigin + '/proyectos/' },
                    { '@type': 'ListItem', position: 3, name: project.title, item: siteOrigin + '/proyectos/' + project.slug + '/' }
                ]
            }
        ]
    };
}

function projectDetailPage(project, nextProject) {
    const canonicalPath = '/proyectos/' + project.slug + '/';
    const tags = project.tags.map((tag) => '<span>' + escapeHtml(tag) + '</span>').join('');
    const features = project.features.map((feature, index) => [
        '                    <article>',
        '                        <span aria-hidden="true">0' + (index + 1) + '</span>',
        '                        <h3>' + escapeHtml(feature) + '</h3>',
        '                    </article>'
    ].join('\n')).join('\n');

    return [
        headMarkup({
            title: project.title + ' | Proyectos de Felipe Flores',
            description: project.description,
            canonicalPath,
            image: project.image,
            imageWidth: project.imageWidth,
            imageHeight: project.imageHeight,
            imageAlt: project.alt,
            schema: projectSchema(project),
            pageDepth: 2
        }),
        headerMarkup(2),
        '    <main id="main-content">',
        '        <section class="project-detail-hero" aria-labelledby="project-title">',
        '            <div class="shell">',
        '                <ol class="breadcrumb" aria-label="Migas de pan">',
        '                    <li><a href="' + homeFile(2) + '">Inicio</a></li><li aria-hidden="true">›</li>',
        '                    <li><a href="' + localFile('/proyectos/index.html', 2) + '">Proyectos</a></li><li aria-hidden="true">›</li>',
        '                    <li aria-current="page">' + escapeHtml(project.cardTitle) + '</li>',
        '                </ol>',
        '                <div class="project-detail-grid">',
        '                    <div class="project-detail-copy">',
        '                        <div class="tag-row">' + tags + '</div>',
        '                        <h1 id="project-title">' + escapeHtml(project.title) + '</h1>',
        '                        <p>' + escapeHtml(project.description) + '</p>',
        '                        <div class="project-detail-actions">',
        '                            <button class="button-v2 button-primary-v2" type="button" data-inline-video="' + project.videoId + '" data-video-title="' + escapeHtml(project.title) + '">Ver demostración <span aria-hidden="true">▶</span></button>',
        '                            <a class="button-v2 button-outline-v2" href="' + project.videoUrl + '" target="_blank" rel="noopener noreferrer">Ver en YouTube <span aria-hidden="true">↗</span></a>',
        '                        </div>',
        '                    </div>',
        '                    <div class="inline-video">',
        '                        <img src="' + localFile(project.image, 2) + '" width="' + project.imageWidth + '" height="' + project.imageHeight + '" decoding="async" fetchpriority="high" alt="' + escapeHtml(project.alt) + '">',
        '                        <button type="button" data-inline-video="' + project.videoId + '" data-video-title="' + escapeHtml(project.title) + '" aria-label="Reproducir demostración de ' + escapeHtml(project.title) + '"><span aria-hidden="true">▶</span></button>',
        '                    </div>',
        '                </div>',
        '            </div>',
        '        </section>',
        '        <section class="section-v2 project-facts-section" aria-label="Información técnica">',
        '            <div class="shell project-facts">',
        '                <div><h2>Tecnologías y áreas</h2><div class="tag-row">' + tags + '</div></div>',
        '                <a href="' + project.videoUrl + '" target="_blank" rel="noopener noreferrer">Demostración en YouTube <span aria-hidden="true">↗</span></a>',
        '            </div>',
        '        </section>',
        '        <section class="section-v2">',
        '            <div class="shell detail-content-grid">',
        '                <article><h2>Descripción del proyecto</h2><p>' + escapeHtml(project.description) + '</p></article>',
        '                <article><h2>¿Qué resuelve?</h2><p>' + escapeHtml(project.resolves) + '</p></article>',
        '            </div>',
        '        </section>',
        '        <section class="section-v2 project-features">',
        '            <div class="shell">',
        '                <h2>Características principales</h2>',
        '                <div class="feature-grid">',
        features,
        '                </div>',
        '            </div>',
        '        </section>',
        '        <section class="section-v2 project-technologies">',
        '            <div class="shell">',
        '                <h2>Tecnologías utilizadas</h2>',
        '                <div class="technology-badges">' + tags + '</div>',
        '            </div>',
        '        </section>',
        '        <section class="section-v2 project-gallery">',
        '            <div class="shell">',
        '                <h2>Galería del proyecto</h2>',
        '                <figure>',
        '                    <img src="' + localFile(project.image, 2) + '" width="' + project.imageWidth + '" height="' + project.imageHeight + '" loading="lazy" decoding="async" alt="' + escapeHtml(project.alt) + '">',
        '                    <figcaption>Imagen real disponible en el proyecto.</figcaption>',
        '                </figure>',
        '            </div>',
        '        </section>',
        contactMarkup(),
        '        <nav class="project-next" aria-label="Siguiente proyecto">',
        '            <a class="shell" href="' + localFile('/proyectos/' + nextProject.slug + '/index.html', 2) + '"><span><small>Siguiente proyecto</small><strong>' + escapeHtml(nextProject.cardTitle) + '</strong></span><span aria-hidden="true">→</span></a>',
        '        </nav>',
        '    </main>',
        footerMarkup(2)
    ].join('\n');
}

const projectsDirectory = path.join(rootDirectory, 'proyectos');
await mkdir(projectsDirectory, { recursive: true });
await writeFile(path.join(projectsDirectory, 'index.html'), projectsIndexPage(), 'utf8');

for (const [index, project] of projects.entries()) {
    const projectDirectory = path.join(projectsDirectory, project.slug);
    const nextProject = projects[(index + 1) % projects.length];
    await mkdir(projectDirectory, { recursive: true });
    await writeFile(path.join(projectDirectory, 'index.html'), projectDetailPage(project, nextProject), 'utf8');
}

const sitemapEntries = [
    { path: '/', lastmod: '2026-08-31', priority: '1.0', changefreq: 'monthly' },
    { path: '/proyectos/', lastmod: '2026-08-31', priority: '0.9', changefreq: 'monthly' },
    ...projects.map((project) => ({
        path: '/proyectos/' + project.slug + '/',
        lastmod: '2026-08-31',
        priority: '0.8',
        changefreq: 'monthly'
    })),
    { path: '/docs/Felipe-CV.pdf', lastmod: '2026-04-09', priority: '0.4', changefreq: 'yearly' }
];

const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    sitemapEntries.map((entry) => [
        '  <url>',
        '    <loc>' + siteOrigin + entry.path + '</loc>',
        '    <lastmod>' + entry.lastmod + '</lastmod>',
        '    <changefreq>' + entry.changefreq + '</changefreq>',
        '    <priority>' + entry.priority + '</priority>',
        '  </url>'
    ].join('\n')).join('\n'),
    '</urlset>',
    ''
].join('\n');

await writeFile(path.join(rootDirectory, 'sitemap.xml'), sitemap, 'utf8');
console.log('Generated project index, ' + projects.length + ' detail pages, and sitemap.');
