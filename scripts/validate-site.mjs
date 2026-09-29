import { readFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteOrigin, topics } from './site-config.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, '..');
const errors = [];

async function collectHtmlFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (['.git', 'bower_components', 'node_modules', 'dist', 'test-results', 'playwright-report'].includes(entry.name)) continue;
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...await collectHtmlFiles(absolutePath));
        else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolutePath);
    }

    return files;
}

function captureAll(source, expression) {
    return Array.from(source.matchAll(expression), (match) => match[1]);
}

function resolveLocalTarget(htmlFile, value) {
    const withoutFragment = value.split('#')[0].split('?')[0];
    if (!withoutFragment) return htmlFile;

    const decoded = decodeURIComponent(withoutFragment);
    let target = decoded.startsWith('/')
        ? path.join(rootDirectory, decoded.replace(/^\/+/, ''))
        : path.resolve(path.dirname(htmlFile), decoded);

    if (decoded.endsWith('/')) target = path.join(target, 'index.html');
    return target;
}

async function fileExists(target) {
    try {
        const targetStat = await stat(target);
        if (targetStat.isDirectory()) {
            await stat(path.join(target, 'index.html'));
        }
        return true;
    } catch {
        return false;
    }
}

const htmlFiles = await collectHtmlFiles(rootDirectory);
const canonicalValues = new Map();
const titleValues = new Map();
const descriptionValues = new Map();
const internalLinkGraph = new Map();

for (const htmlFile of htmlFiles) {
    const relativePath = path.relative(rootDirectory, htmlFile).replace(/\\/g, '/');
    const html = await readFile(htmlFile, 'utf8');
    if (relativePath === 'politicasffelipev2.github.io/index.html') {
        if (!/^<!doctype html>/i.test(html.trimStart())) errors.push(relativePath + ': missing HTML5 doctype');
        if (!/<html\s+lang=["']en["']/i.test(html)) errors.push(relativePath + ': expected English language');
        if (!/<meta\s+name=["']robots["']\s+content=["']noindex, follow["']/i.test(html)) {
            errors.push(relativePath + ': legacy privacy policy must remain noindex, follow');
        }
        if (!html.includes('Arduino y Componentes')) errors.push(relativePath + ': legacy app policy content is missing');
        continue;
    }
    const ids = captureAll(html, /\sid=["']([^"']+)["']/g);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const titles = captureAll(html, /<title>([^<]+)<\/title>/gi);
    const descriptions = captureAll(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/gi);
    const canonicals = captureAll(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/gi);
    const robotsDirectives = captureAll(html, /<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/gi);
    const h1Count = (html.match(/<h1(?:\s|>)/gi) || []).length;
    const imageTags = Array.from(html.matchAll(/<img\b[^>]*>/gi), (match) => match[0]);
    const anchorTags = Array.from(html.matchAll(/<a\b[^>]*>/gi), (match) => match[0]);

    if (!/^<!doctype html>/i.test(html.trimStart())) errors.push(relativePath + ': missing HTML5 doctype');
    if (!/<html\s+lang=["']es-CL["']/i.test(html)) errors.push(relativePath + ': missing es-CL language');
    if (titles.length !== 1) errors.push(relativePath + ': expected exactly one title');
    if (descriptions.length !== 1) errors.push(relativePath + ': expected exactly one meta description');
    if (canonicals.length !== 1) errors.push(relativePath + ': expected exactly one canonical');
    if (robotsDirectives.length !== 1 || robotsDirectives[0] !== 'index, follow') errors.push(relativePath + ': expected index, follow robots directive');
    if (!/<meta\s+property=["']og:title["']/i.test(html) || !/<meta\s+property=["']og:description["']/i.test(html) || !/<meta\s+property=["']og:url["']/i.test(html)) {
        errors.push(relativePath + ': Open Graph title, description, or URL is missing');
    }
    if (!/<meta\s+name=["']twitter:card["']/i.test(html) || !/<meta\s+name=["']twitter:title["']/i.test(html) || !/<meta\s+name=["']twitter:description["']/i.test(html) || !/<meta\s+name=["']twitter:image["']/i.test(html)) {
        errors.push(relativePath + ': Twitter card metadata is incomplete');
    }
    if (/name=["']keywords["']/i.test(html)) errors.push(relativePath + ': meta keywords should not be used');
    if (canonicals[0] && (!canonicals[0].startsWith(siteOrigin + '/') || !canonicals[0].endsWith('/'))) {
        errors.push(relativePath + ': canonical must use the preferred host and trailing-slash route');
    }
    const expectedRoute = relativePath === 'index.html' ? '/' : '/' + relativePath.replace(/index\.html$/, '');
    if (canonicals[0] !== siteOrigin + expectedRoute) {
        errors.push(relativePath + ': canonical does not match the page route');
    }
    const linkedUrls = new Set();
    for (const anchor of anchorTags) {
        const href = anchor.match(/\shref=["']([^"']+)["']/i)?.[1];
        if (!href || /\brel=["'][^"']*\bnofollow\b/i.test(anchor)) continue;
        try {
            const target = new URL(href, siteOrigin + expectedRoute);
            if (target.origin !== siteOrigin) continue;
            target.hash = '';
            target.search = '';
            linkedUrls.add(target.href);
        } catch {
            errors.push(relativePath + ': invalid link URL ' + href);
        }
    }
    internalLinkGraph.set(siteOrigin + expectedRoute, linkedUrls);
    if (h1Count !== 1) errors.push(relativePath + ': expected exactly one h1, found ' + h1Count);
    const schemaMatch = html.match(/<script\s+type=["']application\/ld\+json["']>\s*([\s\S]*?)\s*<\/script>/i);
    try {
        const schema = JSON.parse(schemaMatch?.[1] || 'null');
        if (schema?.['@context'] !== 'https://schema.org') errors.push(relativePath + ': missing Schema.org context');
    } catch {
        errors.push(relativePath + ': invalid JSON-LD');
    }
    if (duplicateIds.length) errors.push(relativePath + ': duplicate IDs ' + [...new Set(duplicateIds)].join(', '));
    if (!/<main\s+id=["']main-content["']/i.test(html)) errors.push(relativePath + ': missing main landmark');
    if (!/class=["'][^"']*skip-link/i.test(html)) errors.push(relativePath + ': missing skip link');
    if (!/aria-expanded=["']false["']/i.test(html) || !/aria-controls=["']mobile-menu["']/i.test(html)) {
        errors.push(relativePath + ': mobile menu ARIA contract is incomplete');
    }
    if (!/<aside\b[^>]*\bclass=["'][^"']*mobile-menu[^"']*["'][^>]*\binert\b/i.test(html)) {
        errors.push(relativePath + ': closed mobile menu is missing inert');
    }
    if (/autoplay=1/i.test(html)) errors.push(relativePath + ': autoplay parameter found');
    if (/<iframe\b/i.test(html)) errors.push(relativePath + ': initial iframe found');

    imageTags.forEach((imageTag) => {
        if (!/\salt=["'][^"']*["']/i.test(imageTag)) errors.push(relativePath + ': image missing alt');
        if (!/\swidth=["']\d+["']/i.test(imageTag) || !/\sheight=["']\d+["']/i.test(imageTag)) {
            errors.push(relativePath + ': image missing intrinsic dimensions');
        }
    });

    anchorTags.forEach((anchorTag) => {
        if (/target=["']_blank["']/i.test(anchorTag) && !/rel=["'][^"']*noopener[^"']*["']/i.test(anchorTag)) {
            errors.push(relativePath + ': target=_blank link missing noopener');
        }
    });

    if (titles[0]) {
        if (titleValues.has(titles[0])) errors.push(relativePath + ': duplicate title with ' + titleValues.get(titles[0]));
        titleValues.set(titles[0], relativePath);
    }
    if (descriptions[0]) {
        if (descriptionValues.has(descriptions[0])) errors.push(relativePath + ': duplicate description with ' + descriptionValues.get(descriptions[0]));
        descriptionValues.set(descriptions[0], relativePath);
    }
    if (canonicals[0]) {
        if (canonicalValues.has(canonicals[0])) errors.push(relativePath + ': duplicate canonical with ' + canonicalValues.get(canonicals[0]));
        canonicalValues.set(canonicals[0], relativePath);
    }

    const localReferences = captureAll(html, /\s(?:href|src)=["']([^"']+)["']/gi).filter((value) => {
        return !/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value);
    });
    const nonCanonicalIndexLinks = localReferences.filter((value) => /(?:^|\/)index\.html(?:[?#]|$)/i.test(value));
    const rootRelativeReferences = localReferences.filter((value) => value.startsWith('/'));
    if (nonCanonicalIndexLinks.length) {
        errors.push(relativePath + ': internal links should use canonical directory URLs: ' + [...new Set(nonCanonicalIndexLinks)].join(', '));
    }
    if (rootRelativeReferences.length) {
        errors.push(relativePath + ': root-relative paths break direct file opening: ' + [...new Set(rootRelativeReferences)].join(', '));
    }

    for (const reference of localReferences) {
        const target = resolveLocalTarget(htmlFile, reference);
        if (!await fileExists(target)) errors.push(relativePath + ': missing local target ' + reference);

        const fragment = reference.includes('#') ? reference.split('#')[1] : '';
        if (fragment) {
            const targetHtmlPath = target.endsWith('.html') ? target : path.join(target, 'index.html');
            if (await fileExists(targetHtmlPath)) {
                const targetHtml = targetHtmlPath === htmlFile ? html : await readFile(targetHtmlPath, 'utf8');
                const escapedFragment = fragment.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
                if (!new RegExp("\\sid=[\"']" + escapedFragment + "[\"']").test(targetHtml)) {
                    errors.push(relativePath + ': missing fragment target #' + fragment + ' in ' + reference);
                }
            }
        }
    }
}

const portfolioCss = await readFile(path.join(rootDirectory, 'css', 'portfolio.css'), 'utf8');
const portfolioJs = await readFile(path.join(rootDirectory, 'js', 'portfolio.js'), 'utf8');
const projectData = JSON.parse(await readFile(path.join(rootDirectory, 'data', 'projects.json'), 'utf8'));
const sitemap = await readFile(path.join(rootDirectory, 'sitemap.xml'), 'utf8');
const robots = await readFile(path.join(rootDirectory, 'robots.txt'), 'utf8');
const homepage = await readFile(path.join(rootDirectory, 'index.html'), 'utf8');

if (!/:focus-visible/.test(portfolioCss)) errors.push('portfolio.css: missing focus-visible styles');
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(portfolioCss)) errors.push('portfolio.css: missing reduced-motion styles');
if (/autoplay=1/i.test(portfolioJs)) errors.push('portfolio.js: autoplay parameter found');
if (!/youtube-nocookie\.com/.test(portfolioJs)) errors.push('portfolio.js: privacy-enhanced YouTube embed missing');
if (!/event\.key === 'Escape'/.test(portfolioJs)) errors.push('portfolio.js: Escape handling missing');
if (!/document\.body\.classList\.add\('menu-open'\)/.test(portfolioJs)) errors.push('portfolio.js: body scroll lock missing');
if (!projectData.length) errors.push('projects.json: project catalog is empty');
if (!/^User-agent:\s*\*\s*\r?\nAllow:\s*\/\s*\r?\nSitemap:\s*https:\/\/felipeflores\.tech\/sitemap\.xml\s*$/i.test(robots.trim())) {
    errors.push('robots.txt: expected open crawling and the canonical sitemap URL');
}
if ((portfolioCss.match(/{/g) || []).length !== (portfolioCss.match(/}/g) || []).length) {
    errors.push('portfolio.css: unbalanced braces');
}

const homepageSchemaMatch = homepage.match(/<script\s+type=["']application\/ld\+json["']>\s*([\s\S]*?)\s*<\/script>/i);
if (!homepageSchemaMatch) {
    errors.push('index.html: missing JSON-LD identity markup');
} else {
    try {
        const homepageSchema = JSON.parse(homepageSchemaMatch[1]);
        const entities = Array.isArray(homepageSchema['@graph']) ? homepageSchema['@graph'] : [];
        const person = entities.find((entity) => entity['@type'] === 'Person');
        const profilePage = entities.find((entity) => Array.isArray(entity['@type']) && entity['@type'].includes('ProfilePage'));

        if (person?.name !== 'Felipe Flores Valdebenito') errors.push('index.html: Person schema must contain the full professional name');
        if (!Array.isArray(person?.alternateName) || !person.alternateName.includes('Felipe Flores')) {
            errors.push('index.html: Person schema must include Felipe Flores as an alternate name');
        }
        if (profilePage?.mainEntity?.['@id'] !== siteOrigin + '/#person') {
            errors.push('index.html: ProfilePage schema must identify the Person as its main entity');
        }
    } catch {
        errors.push('index.html: invalid JSON-LD identity markup');
    }
}
if (!/<p\s+class=["']hero-identity-v2["']>\s*Felipe Flores Valdebenito/i.test(homepage)) {
    errors.push('index.html: missing visible full-name identity line');
}

const slugs = projectData.map((project) => project.slug);
const videoIds = projectData.map((project) => project.videoId).filter(Boolean);
const topicSlugs = topics.map((topic) => topic.slug);
if (new Set(slugs).size !== slugs.length) errors.push('projects.json: duplicate slug');
if (new Set(videoIds).size !== videoIds.length) errors.push('projects.json: duplicate video ID');
if (new Set(topicSlugs).size !== topicSlugs.length) errors.push('site-config.mjs: duplicate topic slug');
for (const slug of [...slugs, ...topicSlugs]) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.push('Invalid route slug: ' + slug);
}
const sitemapUrls = captureAll(sitemap, /<loc>([^<]+)<\/loc>/g);
const expectedSitemapUrls = [
    siteOrigin + '/',
    siteOrigin + '/proyectos/',
    ...slugs.map((slug) => siteOrigin + '/proyectos/' + slug + '/'),
    ...topicSlugs.map((slug) => siteOrigin + '/' + slug + '/'),
    siteOrigin + '/publicaciones/'
];
if (!/<urlset\s+xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']\s*>/i.test(sitemap) || !/<\/urlset>\s*$/.test(sitemap)) {
    errors.push('sitemap.xml: missing Sitemap XML namespace or closing urlset');
}
if ((sitemap.match(/<url>/g) || []).length !== sitemapUrls.length || sitemapUrls.length !== expectedSitemapUrls.length) {
    errors.push('sitemap.xml: expected ' + expectedSitemapUrls.length + ' URL entries from the current data and routes, found ' + sitemapUrls.length);
}
if (new Set(expectedSitemapUrls).size !== expectedSitemapUrls.length) errors.push('Site configuration: conflicting indexable routes');
if (new Set(sitemapUrls).size !== sitemapUrls.length) errors.push('sitemap.xml: duplicate URL entries');
for (const url of expectedSitemapUrls) {
    if (!sitemapUrls.includes(url)) errors.push('sitemap.xml: missing indexable URL ' + url);
    if (!canonicalValues.has(url)) errors.push('Missing indexable HTML page with canonical ' + url);
}
for (const url of sitemapUrls) {
    if (!url.startsWith(siteOrigin + '/') || !url.endsWith('/') || /[?#]/.test(url)) errors.push('sitemap.xml: non-canonical URL ' + url);
    if (!expectedSitemapUrls.includes(url)) errors.push('sitemap.xml: unexpected URL ' + url);
}
for (const [url, file] of canonicalValues) {
    if (!expectedSitemapUrls.includes(url)) errors.push(file + ': indexable HTML page is absent from the configured routes and sitemap');
}

if (!internalLinkGraph.get(siteOrigin + '/')?.has(siteOrigin + '/proyectos/')) {
    errors.push('index.html: missing conventional HTML link to /proyectos/');
}
for (const slug of slugs) {
    if (!internalLinkGraph.get(siteOrigin + '/proyectos/')?.has(siteOriginForCheck(slug))) {
        errors.push('proyectos/index.html: missing conventional HTML link to ' + slug);
    }
}
const reachableUrls = new Set();
const pendingUrls = [siteOrigin + '/'];
while (pendingUrls.length) {
    const url = pendingUrls.pop();
    if (reachableUrls.has(url)) continue;
    reachableUrls.add(url);
    for (const target of internalLinkGraph.get(url) || []) {
        if (internalLinkGraph.has(target) && !reachableUrls.has(target)) pendingUrls.push(target);
    }
}
for (const url of expectedSitemapUrls) {
    if (!reachableUrls.has(url)) errors.push('Page is unreachable from the homepage through HTML links: ' + url);
}

for (const topic of topicSlugs) {
    if (!projectData.some((project) => project.topics?.includes(topic))) {
        errors.push('projects.json: empty topic ' + topic);
    }
}

const publications = JSON.parse(await readFile(path.join(rootDirectory, 'data', 'publications.json'), 'utf8'));
if (!publications.length || publications.some((publication) => !['Autor', 'Colaboración reconocida'].includes(publication.role))) {
    errors.push('publications.json: expected publications with a supported authorship or collaboration role');
}
if (new Set(publications.map((publication) => publication.doi)).size !== publications.length) {
    errors.push('publications.json: duplicate DOI');
}

for (const project of projectData) {
    const detailFile = path.join(rootDirectory, 'proyectos', project.slug, 'index.html');
    if (!await fileExists(detailFile)) errors.push('Missing generated detail page for ' + project.slug);
    if (!sitemap.includes(siteOriginForCheck(project.slug))) errors.push('sitemap.xml: missing ' + project.slug);
    if (!await fileExists(path.join(rootDirectory, project.image.replace(/^\/+/, '')))) {
        errors.push('projects.json: missing image ' + project.image);
    }
    if (!project.seoTitle || !project.seoDescription) errors.push('projects.json: missing unique SEO fields for ' + project.slug);
    if (project.heroImage) {
        const image = project.heroImage;
        if (!image.src || !image.alt || !Number.isInteger(image.width) || !Number.isInteger(image.height)) {
            errors.push('projects.json: incomplete hero image for ' + project.slug);
        } else if (!await fileExists(path.join(rootDirectory, image.src.replace(/^\/+/, '')))) {
            errors.push('projects.json: missing hero image ' + image.src);
        }
    }
    for (const image of project.images || []) {
        if (!image.src || !image.alt || !Number.isInteger(image.width) || !Number.isInteger(image.height)) {
            errors.push('projects.json: incomplete gallery image for ' + project.slug);
        } else if (!await fileExists(path.join(rootDirectory, image.src.replace(/^\/+/, '')))) {
            errors.push('projects.json: missing gallery image ' + image.src);
        }
    }
    for (const resource of project.resources || []) {
        if (!resource.label || !resource.url) errors.push('projects.json: incomplete resource for ' + project.slug);
    }
    for (const topic of project.topics || []) {
        if (!topicSlugs.includes(topic)) {
            errors.push('projects.json: unknown topic ' + topic + ' from ' + project.slug);
        }
    }
    const relatedSlugs = project.relatedProjects || [];
    if (new Set(relatedSlugs).size !== relatedSlugs.length || relatedSlugs.length > 3 || relatedSlugs.includes(project.slug)) {
        errors.push('projects.json: invalid related-project references for ' + project.slug);
    }
    for (const relatedSlug of relatedSlugs) {
        if (!slugs.includes(relatedSlug)) errors.push('projects.json: unknown related project ' + relatedSlug + ' from ' + project.slug);
    }
    if (await fileExists(detailFile)) {
        const detailHtml = await readFile(detailFile, 'utf8');
        if (!detailHtml.includes('<title>' + project.seoTitle + '</title>')) errors.push(project.slug + ': SEO title was not generated from projects.json');
        if (!detailHtml.includes('<meta name="description" content="' + project.seoDescription + '">')) errors.push(project.slug + ': SEO description was not generated from projects.json');
        if (!project.videoId && (/data-inline-video=|Ver en YouTube|Reproducir demostración/.test(detailHtml))) {
            errors.push(project.slug + ': video controls generated without a video');
        }
        if (!/<nav\s+aria-label=["']Migas de pan["']>\s*<ol\s+class=["']breadcrumb["']>/i.test(detailHtml)) {
            errors.push(project.slug + ': breadcrumb should use a labelled nav around its ordered list');
        }
        const projectSchemaMatch = detailHtml.match(/<script\s+type=["']application\/ld\+json["']>\s*([\s\S]*?)\s*<\/script>/i);
        try {
            const projectSchema = JSON.parse(projectSchemaMatch?.[1] || 'null');
            const graph = Array.isArray(projectSchema?.['@graph']) ? projectSchema['@graph'] : [];
            if (!graph.some((entity) => entity['@type'] === 'CreativeWork')) errors.push(project.slug + ': missing CreativeWork structured data');
            if (!graph.some((entity) => entity['@type'] === 'BreadcrumbList')) errors.push(project.slug + ': missing BreadcrumbList structured data');
        } catch {
            errors.push(project.slug + ': invalid project structured data');
        }
    }
}

function siteOriginForCheck(slug) {
    return siteOrigin + '/proyectos/' + slug + '/';
}

try {
    for (const file of ['js/hero-3d.js', 'js/hero/scene.js', 'js/hero/camera-rig.js', 'js/hero/animation-sequence.js', 'js/hero/narrative-effects.js', 'js/hero/robot-motion.js', 'js/hero/robot-assembly.js', 'js/hero/radio-display.js', 'scripts/build-hero.mjs']) {
        execFileSync(process.execPath, ['--check', path.join(rootDirectory, file)], { stdio: 'pipe' });
    }
    execFileSync(process.execPath, ['--check', path.join(rootDirectory, 'js', 'portfolio.js')], { stdio: 'pipe' });
    for (const file of ['scripts/build-site.mjs', 'scripts/site-config.mjs', 'scripts/validate-site.mjs']) {
        execFileSync(process.execPath, ['--check', path.join(rootDirectory, file)], { stdio: 'pipe' });
    }
} catch (error) {
    errors.push('JavaScript syntax check failed: ' + String(error.stderr || error.message));
}

if (errors.length) {
    console.error('Validation failed with ' + errors.length + ' issue(s):');
    errors.forEach((error) => console.error('- ' + error));
    process.exitCode = 1;
} else {
    console.log('Validated ' + htmlFiles.length + ' HTML pages, ' + projectData.length + ' projects, ' + sitemapUrls.length + ' sitemap URLs, HTML reachability, local links, metadata, accessibility hooks, and JavaScript syntax.');
}
