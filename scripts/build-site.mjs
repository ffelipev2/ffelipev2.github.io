import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteOrigin, topics } from './site-config.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, '..');
const projects = JSON.parse(
    await readFile(path.join(rootDirectory, 'data', 'projects.json'), 'utf8')
);
const publications = JSON.parse(
    await readFile(path.join(rootDirectory, 'data', 'publications.json'), 'utf8')
);

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
const localFile = (rootPath, pageDepth) => {
    const relativePath = rootPath.replace(/^\/+/, '');
    const canonicalPath = relativePath.replace(/(?:^|\/)index\.html$/, (match) => match.startsWith('/') ? '/' : '');
    return rootPrefix(pageDepth) + canonicalPath;
};
const homeFile = (pageDepth, fragment = '') => rootPrefix(pageDepth) + fragment;
const breadcrumbSchema = (items) => ({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
        '@type': 'ListItem', position: index + 1, name: item.name, item: siteOrigin + item.path
    }))
});
const breadcrumbMarkup = (items, pageDepth) => [
    '                <nav aria-label="Migas de pan">',
    '                    <ol class="breadcrumb">',
    items.map((item, index) => {
        const label = escapeHtml(item.name);
        const entry = index === items.length - 1
            ? '<li aria-current="page">' + label + '</li>'
            : '<li><a href="' + (item.path === '/' ? homeFile(pageDepth) : localFile(item.path + 'index.html', pageDepth)) + '">' + label + '</a></li>';
        return '                        ' + entry;
    }).join('\n'),
    '                    </ol>',
    '                </nav>'
].join('\n');

function headMarkup({ title, description, canonicalPath, image, imageWidth, imageHeight, imageAlt, schema, pageDepth, ogType = 'website' }) {
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
        '    <meta name="author" content="Felipe Flores Valdebenito">',
        '    <meta name="robots" content="index, follow">',
        '    <meta name="theme-color" content="#07111F">',
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
        '    <meta property="og:type" content="' + ogType + '">',
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
        '                <a href="' + localFile('/proyectos/index.html', pageDepth) + '">Proyectos</a>',
        '                <a href="' + homeFile(pageDepth, '#experiencia') + '">Experiencia</a>',
        '                <a href="' + homeFile(pageDepth, '#perfil') + '">Perfil</a>',
        '                <a href="' + localFile('/publicaciones/index.html', pageDepth) + '">Publicaciones</a>',
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
        '            <a href="' + localFile('/publicaciones/index.html', pageDepth) + '" data-menu-link><span aria-hidden="true">▱</span> Publicaciones</a>',
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

function projectCardMarkup(project, pageDepth, headingLevel = 2) {
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
        '                        <h' + headingLevel + '><a href="' + projectPath + '">' + escapeHtml(project.cardTitle) + '</a></h' + headingLevel + '>',
        '                        <p>' + escapeHtml(project.description) + '</p>',
        '                        <a href="' + projectPath + '">Explorar ' + escapeHtml(project.cardTitle) + ' <span aria-hidden="true">→</span></a>',
        '                    </div>',
        '                </article>'
    ].join('\n');
}

function topicPage(topic) {
    const canonicalPath = '/' + topic.slug + '/';
    const topicProjects = projects.filter((project) => project.topics?.includes(topic.slug));
    const leadImage = topicProjects[0];
    const crumbs = [{ name: 'Inicio', path: '/' }, { name: topic.name, path: canonicalPath }];
    const schema = {
        '@context': 'https://schema.org',
        '@graph': [{
            '@type': 'CollectionPage',
            name: topic.title,
            description: topic.description,
            url: siteOrigin + canonicalPath,
            inLanguage: 'es-CL',
            author: { '@id': siteOrigin + '/#person' },
            hasPart: topicProjects.map((project) => ({
                '@type': 'CreativeWork', name: project.title,
                url: siteOrigin + '/proyectos/' + project.slug + '/'
            }))
        }, breadcrumbSchema(crumbs)]
    };
    return [
        headMarkup({
            title: topic.seoTitle, description: topic.description, canonicalPath,
            image: leadImage.image, imageWidth: leadImage.imageWidth,
            imageHeight: leadImage.imageHeight, imageAlt: leadImage.alt,
            schema, pageDepth: 1
        }),
        headerMarkup(1),
        '    <main id="main-content">',
        '        <section class="inner-hero" aria-labelledby="topic-title"><div class="shell">',
        breadcrumbMarkup(crumbs, 1),
        '            <p class="eyebrow-v2">Áreas de trabajo</p>',
        '            <h1 id="topic-title">' + escapeHtml(topic.title) + '</h1>',
        '            <p>' + escapeHtml(topic.intro) + '</p>',
        '        </div></section>',
        topic.experience ? [
            '        <section class="section-v2 topic-experience" aria-labelledby="topic-experience-title"><div class="shell">',
            '            <h2 id="topic-experience-title">Experiencia profesional</h2>',
            '            <p>' + escapeHtml(topic.experience) + '</p>',
            '            <a class="text-link" href="' + homeFile(1, '#experiencia') + '">Conoce mi trayectoria profesional <span aria-hidden="true">→</span></a>',
            '        </div></section>'
        ].join('\n') : '',
        '        <section class="section-v2" aria-labelledby="topic-projects-title"><div class="shell">',
        '            <h2 id="topic-projects-title">Proyectos relacionados con ' + escapeHtml(topic.name) + '</h2>',
        '            <div class="all-projects-grid topic-project-grid">',
        topicProjects.map((project) => projectCardMarkup(project, 1, 3)).join('\n'),
        '            </div>',
        '        </div></section>',
        topic.publicationDoi ? [
            '        <section class="section-v2 topic-experience" aria-labelledby="topic-publication-title"><div class="shell">',
            '            <h2 id="topic-publication-title">Publicación relacionada</h2>',
            '            <p>' + escapeHtml(publications.find((publication) => publication.doi === topic.publicationDoi).summary) + '</p>',
            '            <a class="text-link" href="' + localFile('/publicaciones/index.html', 1) + '">Ver publicaciones y colaboraciones <span aria-hidden="true">→</span></a>',
            '        </div></section>'
        ].join('\n') : '',
        '        <section class="section-v2 topic-link-section" aria-labelledby="other-topics-title"><div class="shell">',
        '            <h2 id="other-topics-title">Explorar otras áreas</h2>',
        '            <ul class="topic-link-list">' + topics.filter((other) => other.slug !== topic.slug).map((other) => '<li><a href="' + localFile('/' + other.slug + '/index.html', 1) + '">' + escapeHtml(other.name) + '</a></li>').join('') + '</ul>',
        '        </div></section>',
        contactMarkup(),
        '    </main>',
        videoDialogMarkup(),
        footerMarkup(1)
    ].join('\n');
}

function publicationCardMarkup(publication) {
    return [
        '                <article class="publication-card">',
        '                    <div class="publication-topline"><span class="status-badge ' + (publication.role === 'Autor' ? 'author-badge' : 'collaboration-badge') + '">' + escapeHtml(publication.role) + '</span><span>' + publication.year + '</span></div>',
        '                    <h3>' + escapeHtml(publication.title) + '</h3>',
        '                    <p><strong>Autores:</strong> ' + escapeHtml(publication.authors) + '</p>',
        '                    <p class="publication-source"><em>' + escapeHtml(publication.journal) + '</em> · ' + escapeHtml(publication.citation) + '</p>',
        '                    <p>' + escapeHtml(publication.summary) + '</p>',
        '                    <div class="publication-actions"><a href="https://doi.org/' + escapeHtml(publication.doi) + '" target="_blank" rel="noopener noreferrer">Leer publicación en DOI <span aria-hidden="true">↗</span></a></div>',
        '                </article>'
    ].join('\n');
}

function publicationsPage() {
    const canonicalPath = '/publicaciones/';
    const crumbs = [{ name: 'Inicio', path: '/' }, { name: 'Publicaciones', path: canonicalPath }];
    const authored = publications.filter((publication) => publication.role === 'Autor');
    const collaborations = publications.filter((publication) => publication.role !== 'Autor');
    const schema = {
        '@context': 'https://schema.org',
        '@graph': [{
            '@type': 'CollectionPage', name: 'Publicaciones y colaboraciones científicas de Felipe Flores',
            url: siteOrigin + canonicalPath, inLanguage: 'es-CL',
            description: 'Publicaciones académicas y colaboraciones reconocidas de Felipe Flores en educación en ingeniería e Industria 4.0.',
            author: { '@id': siteOrigin + '/#person' }
        }, ...authored.map((publication) => ({
            '@type': 'ScholarlyArticle',
            name: publication.title,
            url: 'https://doi.org/' + publication.doi,
            identifier: 'https://doi.org/' + publication.doi,
            datePublished: String(publication.year),
            author: publication.authors.split('; ').map((name) => ({ '@type': 'Person', name })),
            isPartOf: { '@type': 'Periodical', name: publication.journal }
        })), breadcrumbSchema(crumbs)]
    };
    return [
        headMarkup({
            title: 'Publicaciones y colaboraciones científicas | Felipe Flores',
            description: 'Publicaciones de Felipe Flores sobre tecnologías 4.0 en educación en ingeniería y colaboraciones reconocidas en investigación científica.',
            canonicalPath, image: '/images/felipe-flores-social.jpg', imageWidth: 1200,
            imageHeight: 1200, imageAlt: 'Retrato de Felipe Flores Valdebenito',
            schema, pageDepth: 1
        }),
        headerMarkup(1),
        '    <main id="main-content">',
        '        <section class="inner-hero" aria-labelledby="publications-page-title"><div class="shell">',
        breadcrumbMarkup(crumbs, 1),
        '            <p class="eyebrow-v2">Investigación y docencia</p>',
        '            <h1 id="publications-page-title">Publicaciones y colaboraciones científicas</h1>',
        '            <p>Publicaciones donde figuro como autor y trabajos que reconocen mi colaboración desde el Laboratorio de Industria 4.0 de la Universidad San Sebastián.</p>',
        '        </div></section>',
        '        <section class="section-v2" aria-labelledby="authored-title"><div class="shell">',
        '            <h2 id="authored-title">Publicaciones como autor</h2>',
        '            <div class="publication-list">' + authored.map(publicationCardMarkup).join('\n') + '</div>',
        '        </div></section>',
        '        <section class="section-v2" aria-labelledby="collaborations-title"><div class="shell">',
        '            <h2 id="collaborations-title">Colaboraciones reconocidas</h2>',
        '            <p class="section-intro">En estos trabajos aparezco en los agradecimientos; no figuro como autor.</p>',
        '            <div class="publication-list">' + collaborations.map(publicationCardMarkup).join('\n') + '</div>',
        '        </div></section>',
        '        <section class="section-v2 topic-link-section" aria-labelledby="publication-projects-title"><div class="shell">',
        '            <h2 id="publication-projects-title">Tecnología aplicada</h2>',
        '            <p>La investigación y la docencia se conectan con mi trabajo en laboratorios y proyectos tecnológicos.</p>',
        '            <ul class="topic-link-list"><li><a href="' + localFile('/industria-4-0/index.html', 1) + '">Industria 4.0</a></li><li><a href="' + localFile('/proyectos/index.html', 1) + '">Explorar proyectos</a></li></ul>',
        '        </div></section>',
        contactMarkup(),
        '    </main>',
        footerMarkup(1)
    ].join('\n');
}

function projectsIndexPage() {
    const schema = {
        '@context': 'https://schema.org',
        '@graph': [{
            '@type': 'CollectionPage',
            name: 'Proyectos tecnológicos de Felipe Flores',
            description: 'Proyectos de IoT, ESP32, LoRa, robótica, automatización, visión artificial y fabricación digital.',
            url: siteOrigin + '/proyectos/',
            inLanguage: 'es-CL',
            author: { '@id': siteOrigin + '/#person' },
            hasPart: projects.map((project) => ({
                '@type': 'CreativeWork',
                name: project.title,
                url: siteOrigin + '/proyectos/' + project.slug + '/',
                image: siteOrigin + project.image
            }))
        }, breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Proyectos', path: '/proyectos/' }])]
    };

    return [
        headMarkup({
            title: 'Proyectos de IoT, ESP32 y robótica | Felipe Flores',
            description: 'Proyectos de Felipe Flores en IoT, ESP32, LoRa, robótica, automatización, visión artificial, Arduino e impresión 3D.',
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
        breadcrumbMarkup([{ name: 'Inicio', path: '/' }, { name: 'Proyectos', path: '/proyectos/' }], 1),
        '                <p class="eyebrow-v2">Portfolio de proyectos</p>',
        '                <h1 id="all-projects-title">Proyectos de IoT, ESP32 y robótica</h1>',
        '                <p>Proyectos reales de IoT, Industria 4.0, ESP32, robótica, automatización y tecnologías aplicadas, además de experiencias con LoRa, Arduino y fabricación digital.</p>',
        '            </div>',
        '        </section>',
        '        <section class="section-v2" aria-label="Todos los proyectos">',
        '            <div class="shell all-projects-grid">',
        projects.map((project) => projectCardMarkup(project, 1)).join('\n'),
        '            </div>',
        '        </section>',
        '        <section class="section-v2 topic-link-section" aria-labelledby="project-topics-title"><div class="shell">',
        '            <h2 id="project-topics-title">Explorar por área</h2>',
        '            <ul class="topic-link-list">' + topics.map((topic) => '<li><a href="' + localFile('/' + topic.slug + '/index.html', 1) + '">' + escapeHtml(topic.name) + '</a></li>').join('') + '</ul>',
        '        </div></section>',
        contactMarkup(),
        '    </main>',
        videoDialogMarkup(),
        footerMarkup(1)
    ].join('\n');
}

function projectSchema(project) {
    const relatedProjects = projects.filter((candidate) => project.relatedProjects?.includes(candidate.slug));
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
                creator: { '@id': siteOrigin + '/#person' },
                ...(relatedProjects.length ? {
                    isRelatedTo: relatedProjects.map((related) => ({
                        '@type': 'CreativeWork',
                        name: related.title,
                        url: siteOrigin + '/proyectos/' + related.slug + '/'
                    }))
                } : {})
            },
            breadcrumbSchema([
                { name: 'Inicio', path: '/' },
                { name: 'Proyectos', path: '/proyectos/' },
                { name: project.title, path: '/proyectos/' + project.slug + '/' }
            ])
        ]
    };
}

function projectDetailPage(project) {
    const canonicalPath = '/proyectos/' + project.slug + '/';
    const tags = '<ul class="tag-row">' + project.tags.map((tag) => '<li>' + escapeHtml(tag) + '</li>').join('') + '</ul>';
    const relatedProjects = projects.filter((candidate) => project.relatedProjects?.includes(candidate.slug));
    const optionalDetails = [
        ['objective', 'Objetivo del proyecto'],
        ['problem', 'Problema que aborda'],
        ['architecture', 'Arquitectura o funcionamiento'],
        ['howItWorks', 'Flujo de funcionamiento'],
        ['development', 'Desarrollo e implementación'],
        ['challenges', 'Desafíos técnicos'],
        ['result', 'Resultados'],
        ['applications', 'Aplicaciones posibles'],
        ['learning', 'Aprendizajes']
    ].flatMap(([field, heading]) => project[field] ? [
        '        <section class="section-v2 project-detail-section" aria-labelledby="project-' + field + '">',
        '            <div class="shell">',
        '                <h2 id="project-' + field + '">' + heading + '</h2>',
        '                <p>' + escapeHtml(project[field]) + '</p>',
        '            </div>',
        '        </section>'
    ] : []);
    const factLists = [
        ['hardware', 'Hardware utilizado'],
        ['software', 'Software y tecnologías']
    ].flatMap(([field, heading]) => project[field]?.length ? [
        '        <section class="section-v2 project-detail-section" aria-labelledby="project-' + field + '">',
        '            <div class="shell">',
        '                <h2 id="project-' + field + '">' + heading + '</h2>',
        '                <ul class="case-study-list">' + project[field].map((item) => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul>',
        '            </div>',
        '        </section>'
    ] : []);
    const galleryMarkup = project.images?.length ? [
        '        <section class="section-v2 project-gallery" aria-labelledby="project-gallery-title"><div class="shell">',
        '            <h2 id="project-gallery-title">Imágenes del proyecto</h2>',
        '            <div class="case-study-gallery">',
        project.images.map((item) => [
            '                <figure>',
            '                    <img src="' + localFile(item.src, 2) + '" width="' + item.width + '" height="' + item.height + '" loading="lazy" decoding="async" alt="' + escapeHtml(item.alt) + '">',
            item.caption ? '                    <figcaption>' + escapeHtml(item.caption) + '</figcaption>' : '',
            '                </figure>'
        ].join('\n')).join('\n'),
        '            </div>',
        '        </div></section>'
    ].join('\n') : '';
    const resourcesMarkup = project.resources?.length ? [
        '        <section class="section-v2 project-detail-section" aria-labelledby="project-resources-title"><div class="shell">',
        '            <h2 id="project-resources-title">Recursos relacionados</h2>',
        '            <ul class="case-study-list">' + project.resources.map((resource) => '<li><a href="' + escapeHtml(resource.url) + '"' + (/^https?:\/\//i.test(resource.url) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + escapeHtml(resource.label) + '</a></li>').join('') + '</ul>',
        '        </div></section>'
    ].join('\n') : '';
    const topicLinks = topics.filter((topic) => project.topics?.includes(topic.slug));
    const relatedMarkup = relatedProjects.length ? [
        '        <section class="section-v2 related-project-section" aria-labelledby="related-projects-title">',
        '            <div class="shell">',
        '                <h2 id="related-projects-title" class="related-projects-title">Proyectos relacionados</h2>',
        '                <div class="feature-grid related-projects-grid">',
        relatedProjects.map((relatedProject) => [
            '                    <article>',
            '                        <h3><a href="' + localFile('/proyectos/' + relatedProject.slug + '/index.html', 2) + '">' + escapeHtml(relatedProject.title) + '</a></h3>',
            '                        <p class="project-tags-v2">' + relatedProject.tags.map(escapeHtml).join(' · ') + '</p>',
            '                        <p>' + escapeHtml(relatedProject.description) + '</p>',
            '                    </article>'
        ].join('\n')).join('\n'),
        '                </div>',
        '            </div>',
        '        </section>'
    ] : [];

    return [
        headMarkup({
            title: project.seoTitle,
            description: project.seoDescription,
            canonicalPath,
            image: project.image,
            imageWidth: project.imageWidth,
            imageHeight: project.imageHeight,
            imageAlt: project.alt,
            schema: projectSchema(project),
            pageDepth: 2,
            ogType: 'article'
        }),
        headerMarkup(2),
        '    <main id="main-content">',
        '        <article class="project-detail-article" aria-labelledby="project-title">',
        '        <section class="project-detail-hero" aria-labelledby="project-title">',
        '            <div class="shell">',
        breadcrumbMarkup([{ name: 'Inicio', path: '/' }, { name: 'Proyectos', path: '/proyectos/' }, { name: project.cardTitle, path: canonicalPath }], 2),
        '                <div class="project-detail-grid">',
        '                    <div class="project-detail-copy">',
        tags,
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
        '        <section class="section-v2 project-facts-section" aria-labelledby="project-technologies-title">',
        '            <div class="shell project-facts">',
        '                <div><h2 id="project-technologies-title">Tecnologías</h2>' + tags + '</div>',
        topicLinks.length ? '                <nav aria-label="Áreas relacionadas"><ul class="project-topic-links">' + topicLinks.map((topic) => '<li><a href="' + localFile('/' + topic.slug + '/index.html', 2) + '">Más proyectos de ' + escapeHtml(topic.name) + '</a></li>').join('') + '</ul></nav>' : '',
        '            </div>',
        '        </section>',
        ...optionalDetails,
        ...factLists,
        galleryMarkup,
        resourcesMarkup,
        ...relatedMarkup,
        '        </article>',
        contactMarkup(),
        '    </main>',
        footerMarkup(2)
    ].join('\n');
}

const projectsDirectory = path.join(rootDirectory, 'proyectos');
await mkdir(projectsDirectory, { recursive: true });
await writeFile(path.join(projectsDirectory, 'index.html'), projectsIndexPage(), 'utf8');

for (const project of projects) {
    const projectDirectory = path.join(projectsDirectory, project.slug);
    await mkdir(projectDirectory, { recursive: true });
    await writeFile(path.join(projectDirectory, 'index.html'), projectDetailPage(project), 'utf8');
}

for (const topic of topics) {
    const topicDirectory = path.join(rootDirectory, topic.slug);
    await mkdir(topicDirectory, { recursive: true });
    await writeFile(path.join(topicDirectory, 'index.html'), topicPage(topic), 'utf8');
}

const publicationsDirectory = path.join(rootDirectory, 'publicaciones');
await mkdir(publicationsDirectory, { recursive: true });
await writeFile(path.join(publicationsDirectory, 'index.html'), publicationsPage(), 'utf8');

const sitemapPaths = [
    '/', '/proyectos/',
    ...projects.map((project) => '/proyectos/' + project.slug + '/'),
    ...topics.map((topic) => '/' + topic.slug + '/'),
    '/publicaciones/'
];

const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    sitemapPaths.map((route) => [
        '  <url>',
        '    <loc>' + siteOrigin + route + '</loc>',
        '  </url>'
    ].join('\n')).join('\n'),
    '</urlset>',
    ''
].join('\n');

await writeFile(path.join(rootDirectory, 'sitemap.xml'), sitemap, 'utf8');
console.log('Generated project index, ' + projects.length + ' detail pages, ' + topics.length + ' topic pages, publications, and sitemap.');
