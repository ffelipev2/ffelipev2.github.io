import { test, expect } from '@playwright/test';
import { readFile, writeFile, cp, mkdtemp, realpath, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteOrigin, topics } from '../scripts/site-config.mjs';

const rootDirectory = fileURLToPath(new URL('../', import.meta.url));
const projects = JSON.parse(await readFile(new URL('../data/projects.json', import.meta.url), 'utf8'));
const publications = JSON.parse(await readFile(new URL('../data/publications.json', import.meta.url), 'utf8'));
const routes = ['/', '/proyectos/', ...projects.map((project) => '/proyectos/' + project.slug + '/'), ...topics.map((topic) => '/' + topic.slug + '/'), '/publicaciones/'];
const expectedUrls = routes.map((route) => siteOrigin + route);

// Check styles outside the viewport as well. toBeVisible alone ignores opacity.
async function initiallyHiddenContent(page) {
    return page.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3, main p, main a, main summary')].flatMap((element) => {
        if (!element.textContent.trim() || element.closest('[hidden], [inert], [aria-hidden="true"], dialog')) return [];
        const closedDetails = element.closest('details:not([open])');
        if (closedDetails && !closedDetails.querySelector(':scope > summary')?.contains(element)) return [];
        for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
            const style = getComputedStyle(ancestor);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.9) {
                return [{ text: element.textContent.trim().slice(0, 80), ancestor: ancestor.className, opacity: style.opacity, display: style.display, visibility: style.visibility }];
            }
        }
        return [];
    }));
}

test('topic pages show only supported projects and link to their case studies', async ({ page }) => {
    for (const topic of topics) {
        const titles = projects.filter((project) => project.topics?.includes(topic.slug)).map((project) => project.cardTitle);
        await page.goto('/' + topic.slug + '/');
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('nav[aria-label="Migas de pan"]')).toBeVisible();
        await expect(page.locator('.topic-project-grid .project-card-v2')).toHaveCount(titles.length);
        for (const title of titles) {
            await expect(page.locator('.topic-project-grid')).toContainText(title);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }

    await page.locator('.topic-project-grid h3 a').first().click();
    const lastTopic = topics.at(-1);
    const firstProject = projects.find((project) => project.topics?.includes(lastTopic.slug));
    await expect(page).toHaveURL(new RegExp('/proyectos/' + firstProject.slug + '/$'));
    await expect(page.locator('nav[aria-label="Áreas relacionadas"]')).toContainText(lastTopic.name);
});

test('publication page separates authorship from acknowledgements', async ({ page }) => {
    await page.goto('/publicaciones/');
    await expect(page.locator('h1')).toHaveCount(1);
    const authored = publications.filter((publication) => publication.role === 'Autor');
    await expect(page.locator('#authored-title + .publication-list article')).toHaveCount(authored.length);
    await expect(page.locator('#collaborations-title ~ .publication-list article')).toHaveCount(publications.length - authored.length);
    await expect(page.locator('#collaborations-title')).toBeVisible();
    await expect(page.locator('.section-intro')).toContainText('no figuro como autor');
    const graph = await page.locator('script[type="application/ld+json"]').textContent();
    const schema = JSON.parse(graph);
    expect(schema['@graph'].filter((item) => item['@type'] === 'ScholarlyArticle')).toHaveLength(authored.length);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const javaScriptEnabled of [true, false]) {
    test.describe(javaScriptEnabled ? 'SEO with JavaScript' : 'SEO without JavaScript', () => {
        test.use({ javaScriptEnabled });

        test('every indexable page returns 200, has unique metadata and is visible before scrolling', async ({ page }) => {
            test.setTimeout(90_000);
            const titles = new Set();
            const descriptions = new Set();
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            for (const route of routes) {
                await test.step(route, async () => {
                    const response = await page.goto(route);
                    expect(response.status()).toBe(200);
                    expect(await response.headerValue('x-robots-tag') || '').not.toMatch(/\b(?:noindex|none)\b/i);
                    await expect(page).toHaveURL(new URL(route, test.info().project.use.baseURL).href);
                    const canonical = page.locator('head link[rel="canonical"]');
                    await expect(canonical).toHaveCount(1);
                    await expect(canonical).toHaveAttribute('href', siteOrigin + route);
                    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
                    const directives = await page.locator('head meta[name="robots" i], head meta[name="googlebot" i]').evaluateAll((metas) => metas.map((meta) => meta.content).join(','));
                    expect(directives).not.toMatch(/\b(?:noindex|nofollow|none)\b/i);
                    const title = await page.title();
                    const description = await page.locator('head meta[name="description"]').getAttribute('content');
                    expect(title.trim()).not.toBe('');
                    expect(description.trim()).not.toBe('');
                    expect(titles.has(title)).toBe(false);
                    expect(descriptions.has(description)).toBe(false);
                    titles.add(title);
                    descriptions.add(description);
                    const project = projects.find((entry) => route === '/proyectos/' + entry.slug + '/');
                    if (project) {
                        expect(title).toBe(project.seoTitle);
                        expect(description).toBe(project.seoDescription);
                        const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
                        const breadcrumb = schema['@graph'].find((entity) => entity['@type'] === 'BreadcrumbList');
                        expect(breadcrumb.itemListElement.map((item) => item.item)).toEqual([siteOrigin + '/', siteOrigin + '/proyectos/', siteOrigin + route]);
                    }
                    await expect(page.locator('main h1')).toHaveCount(1);
                    await expect(page.locator('main h1')).toBeVisible();
                    if (javaScriptEnabled) {
                        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
                    }
                    expect(await page.evaluate(() => scrollY)).toBe(0);
                    expect(await initiallyHiddenContent(page)).toEqual([]);
                    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
                });
            }
            expect(errors).toEqual([]);
        });
    });
}

test('sitemap XML and robots advertise exactly the current canonical routes', async ({ request, page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'HTTP and XML checks are platform independent.');
    const sitemapResponse = await request.get('/sitemap.xml');
    expect(sitemapResponse.status()).toBe(200);
    expect(sitemapResponse.headers()['content-type']).toContain('xml');
    await page.goto('/proyectos/');
    const parsed = await page.evaluate((xml) => {
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        return { errors: doc.getElementsByTagName('parsererror').length, root: doc.documentElement.localName, namespace: doc.documentElement.namespaceURI, urls: [...doc.getElementsByTagName('loc')].map((loc) => loc.textContent) };
    }, await sitemapResponse.text());
    expect(parsed.errors).toBe(0);
    expect(parsed.root).toBe('urlset');
    expect(parsed.namespace).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
    expect(parsed.urls.length).toBe(new Set(parsed.urls).size);
    expect(parsed.urls.sort()).toEqual([...expectedUrls].sort());
    const robotsResponse = await request.get('/robots.txt');
    expect(robotsResponse.status()).toBe(200);
    expect((await robotsResponse.text()).trim()).toBe('User-agent: *\nAllow: /\nSitemap: ' + siteOrigin + '/sitemap.xml');
    const policyResponse = await request.get('/politicasffelipev2.github.io/');
    expect(policyResponse.status()).toBe(200);
    expect(await policyResponse.text()).toContain('content="noindex, follow"');
    const notFound = await request.get('/seo-test-missing-page/');
    expect(notFound.status()).toBe(404);
});

test('all sitemap pages are discoverable in response HTML through conventional links', async ({ request, page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'The response HTML graph is platform independent.');
    await page.goto('/proyectos/');
    const graph = {};
    for (const route of routes) {
        const response = await request.get(route);
        expect(response.status()).toBe(200);
        graph[siteOrigin + route] = await page.evaluate(({ html, base }) => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            return [...doc.querySelectorAll('a[href]')].filter((anchor) => !anchor.rel.split(/\s+/).includes('nofollow')).flatMap((anchor) => {
                const url = new URL(anchor.getAttribute('href'), base);
                url.hash = '';
                url.search = '';
                return url.origin === new URL(base).origin ? [url.href] : [];
            });
        }, { html: await response.text(), base: siteOrigin + route });
    }
    expect(graph[siteOrigin + '/']).toContain(siteOrigin + '/proyectos/');
    for (const project of projects) expect(graph[siteOrigin + '/proyectos/']).toContain(siteOrigin + '/proyectos/' + project.slug + '/');
    const seen = new Set();
    const pending = [siteOrigin + '/'];
    while (pending.length) {
        const url = pending.pop();
        if (seen.has(url)) continue;
        seen.add(url);
        pending.push(...(graph[url] || []).filter((target) => graph[target] && !seen.has(target)));
    }
    expect([...seen].sort()).toEqual([...expectedUrls].sort());
});

test.describe('conventional navigation without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('homepage links to the index and the index exposes every project', async ({ page }) => {
        await page.goto('/');
        await page.locator('main a[href="./proyectos/"]').first().click();
        await expect(page).toHaveURL(/\/proyectos\/$/);
        const links = page.locator('main .project-body-v2 h2 a');
        await expect(links).toHaveCount(projects.length);
        const paths = await links.evaluateAll((anchors) => anchors.map((anchor) => new URL(anchor.href).pathname));
        expect(paths.sort()).toEqual(projects.map((project) => '/proyectos/' + project.slug + '/').sort());
        await links.first().click();
        await expect(page).toHaveURL(new RegExp('/proyectos/' + projects[0].slug + '/$'));
        await expect(page.locator('main h1')).toHaveText(projects[0].title);
    });
});

test('generation accepts an additional project and topic, and validation rejects SEO regressions', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'One isolated generation fixture; never changes portfolio data.');
    test.setTimeout(60_000);
    const tempParent = await realpath(tmpdir());
    const fixture = await mkdtemp(path.join(tempParent, 'portfolio-seo-'));
    const run = (script) => spawnSync(process.execPath, [path.join(fixture, 'scripts', script)], { cwd: fixture, encoding: 'utf8', timeout: 20_000 });
    const checkFailure = (message) => {
        const result = run('validate-site.mjs');
        expect(result.status, result.stdout + result.stderr).toBe(1);
        expect(result.stderr).toContain(message);
    };
    try {
        await Promise.all(['index.html', 'robots.txt', 'CNAME', 'scripts', 'data', 'css', 'js', 'images', 'docs', 'politicasffelipev2.github.io'].map((entry) => cp(path.join(rootDirectory, entry), path.join(fixture, entry), { recursive: true })));
        const addedProject = { ...projects[0], slug: 'seo-fixture', title: 'SEO fixture', cardTitle: 'SEO fixture', seoTitle: 'SEO fixture title', seoDescription: 'SEO generation fixture description.', videoId: 'fixture0001', topics: [...projects[0].topics, 'seo-fixture-topic'], relatedProjects: [] };
        const addedTopic = { ...topics[0], slug: 'seo-fixture-topic', name: 'SEO fixture topic', title: 'SEO fixture topic', seoTitle: 'SEO fixture topic title', description: 'SEO topic fixture description.' };
        await writeFile(path.join(fixture, 'data/projects.json'), JSON.stringify([...projects, addedProject]), 'utf8');
        await writeFile(path.join(fixture, 'scripts/site-config.mjs'), 'export const siteOrigin = ' + JSON.stringify(siteOrigin) + ';\nexport const topics = ' + JSON.stringify([...topics, addedTopic]) + ';\n', 'utf8');
        const generated = run('build-site.mjs');
        expect(generated.status, generated.stdout + generated.stderr).toBe(0);
        const validated = run('validate-site.mjs');
        expect(validated.status, validated.stdout + validated.stderr).toBe(0);
        const sitemapPath = path.join(fixture, 'sitemap.xml');
        const sitemap = await readFile(sitemapPath, 'utf8');
        const fixtureUrl = siteOrigin + '/proyectos/seo-fixture/';
        const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
        expect(urls.sort()).toEqual([...expectedUrls, fixtureUrl, siteOrigin + '/seo-fixture-topic/'].sort());
        const detailPath = path.join(fixture, 'proyectos/seo-fixture/index.html');
        const detail = await readFile(detailPath, 'utf8');
        expect(detail).toContain('<link rel="canonical" href="' + fixtureUrl + '">');
        expect(detail).toContain('content="index, follow"');

        await writeFile(sitemapPath, sitemap.replace(/\s*<url>\s*<loc>https:\/\/felipeflores\.tech\/proyectos\/seo-fixture\/<\/loc>\s*<\/url>/, ''), 'utf8');
        checkFailure('missing indexable URL ' + fixtureUrl);
        await writeFile(sitemapPath, sitemap.replace('</urlset>', '<url><loc>' + fixtureUrl + '</loc></url></urlset>'), 'utf8');
        checkFailure('duplicate URL entries');
        await writeFile(sitemapPath, sitemap, 'utf8');

        await writeFile(detailPath, detail.replace('content="index, follow"', 'content="noindex, follow"'), 'utf8');
        checkFailure('expected index, follow robots directive');
        await writeFile(detailPath, detail.replace('rel="canonical" href="' + fixtureUrl + '"', 'rel="canonical" href="' + siteOrigin + '/"'), 'utf8');
        checkFailure('canonical does not match the page route');
        await writeFile(detailPath, detail, 'utf8');
        const indexPath = path.join(fixture, 'proyectos/index.html');
        const index = await readFile(indexPath, 'utf8');
        await writeFile(indexPath, index.replaceAll('href="../proyectos/seo-fixture/"', 'href="#all-projects-title"'), 'utf8');
        checkFailure('missing conventional HTML link to seo-fixture');
    } finally {
        // Resolve and check the exact temporary target before recursive cleanup.
        if (path.dirname(await realpath(fixture)) !== tempParent) throw new Error('Unsafe fixture cleanup path');
        await rm(fixture, { recursive: true, force: true });
    }
});
