import { readFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, '..');
const errors = [];

async function collectHtmlFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (entry.name === '.git' || entry.name === 'bower_components' || entry.name === 'node_modules') continue;
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

for (const htmlFile of htmlFiles) {
    const relativePath = path.relative(rootDirectory, htmlFile).replace(/\\/g, '/');
    const html = await readFile(htmlFile, 'utf8');
    const ids = captureAll(html, /\sid=["']([^"']+)["']/g);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const titles = captureAll(html, /<title>([^<]+)<\/title>/gi);
    const descriptions = captureAll(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/gi);
    const canonicals = captureAll(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/gi);
    const h1Count = (html.match(/<h1(?:\s|>)/gi) || []).length;
    const imageTags = Array.from(html.matchAll(/<img\b[^>]*>/gi), (match) => match[0]);
    const anchorTags = Array.from(html.matchAll(/<a\b[^>]*>/gi), (match) => match[0]);

    if (!/^<!doctype html>/i.test(html.trimStart())) errors.push(relativePath + ': missing HTML5 doctype');
    if (!/<html\s+lang=["']es-CL["']/i.test(html)) errors.push(relativePath + ': missing es-CL language');
    if (titles.length !== 1) errors.push(relativePath + ': expected exactly one title');
    if (descriptions.length !== 1) errors.push(relativePath + ': expected exactly one meta description');
    if (canonicals.length !== 1) errors.push(relativePath + ': expected exactly one canonical');
    if (h1Count !== 1) errors.push(relativePath + ': expected exactly one h1, found ' + h1Count);
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
    const rootRelativeReferences = localReferences.filter((value) => value.startsWith('/'));
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

if (!/:focus-visible/.test(portfolioCss)) errors.push('portfolio.css: missing focus-visible styles');
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(portfolioCss)) errors.push('portfolio.css: missing reduced-motion styles');
if (/autoplay=1/i.test(portfolioJs)) errors.push('portfolio.js: autoplay parameter found');
if (!/youtube-nocookie\.com/.test(portfolioJs)) errors.push('portfolio.js: privacy-enhanced YouTube embed missing');
if (!/event\.key === 'Escape'/.test(portfolioJs)) errors.push('portfolio.js: Escape handling missing');
if (!/document\.body\.classList\.add\('menu-open'\)/.test(portfolioJs)) errors.push('portfolio.js: body scroll lock missing');
if (projectData.length !== 9) errors.push('projects.json: expected 9 projects, found ' + projectData.length);
if ((portfolioCss.match(/{/g) || []).length !== (portfolioCss.match(/}/g) || []).length) {
    errors.push('portfolio.css: unbalanced braces');
}
if ((sitemap.match(/<url>/g) || []).length !== 12) errors.push('sitemap.xml: expected 12 URL entries');

const slugs = projectData.map((project) => project.slug);
const videoIds = projectData.map((project) => project.videoId);
if (new Set(slugs).size !== slugs.length) errors.push('projects.json: duplicate slug');
if (new Set(videoIds).size !== videoIds.length) errors.push('projects.json: duplicate video ID');

for (const project of projectData) {
    const detailFile = path.join(rootDirectory, 'proyectos', project.slug, 'index.html');
    if (!await fileExists(detailFile)) errors.push('Missing generated detail page for ' + project.slug);
    if (!sitemap.includes(siteOriginForCheck(project.slug))) errors.push('sitemap.xml: missing ' + project.slug);
    if (!await fileExists(path.join(rootDirectory, project.image.replace(/^\/+/, '')))) {
        errors.push('projects.json: missing image ' + project.image);
    }
}

function siteOriginForCheck(slug) {
    return 'https://felipeflores.tech/proyectos/' + slug + '/';
}

try {
    execFileSync(process.execPath, ['--check', path.join(rootDirectory, 'js', 'portfolio.js')], { stdio: 'pipe' });
    execFileSync(process.execPath, ['--check', path.join(rootDirectory, 'scripts', 'build-site.mjs')], { stdio: 'pipe' });
} catch (error) {
    errors.push('JavaScript syntax check failed: ' + String(error.stderr || error.message));
}

if (errors.length) {
    console.error('Validation failed with ' + errors.length + ' issue(s):');
    errors.forEach((error) => console.error('- ' + error));
    process.exitCode = 1;
} else {
    console.log('Validated ' + htmlFiles.length + ' HTML pages, ' + projectData.length + ' projects, local links, metadata, accessibility hooks, and JavaScript syntax.');
}
