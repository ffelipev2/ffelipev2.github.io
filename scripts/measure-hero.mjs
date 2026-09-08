// Local lab comparison, not field Core Web Vitals or a GPU timer.
// Run with the local server: node scripts/measure-hero.mjs ../hero-review/before
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const output = path.resolve(process.argv[2] || '../hero-review/current');
await mkdir(output, { recursive: true });
const results = [];
// Optional paired comparison serves HEAD assets without changing working files.
const compare = process.argv.includes('--compare');
const baseline = new Map();
const current = new Map();
if (compare) for (const file of ['css/portfolio.css', 'css/hero-3d.css', 'js/hero-3d.js', 'js/hero/scene.bundle.js']) {
    baseline.set('/' + file, execFileSync('git', ['show', `HEAD:${file}`], { maxBuffer: 2 * 1024 * 1024 }));
    current.set('/' + file, await readFile(file));
}
const browser = await chromium.launch({ channel: 'chrome' });
try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 393, height: 851 }]) {
        for (let run = 0; run < 3; run++) {
          for (const variant of compare ? (run % 2 ? ['after', 'before'] : ['before', 'after']) : ['after']) {
            const context = await browser.newContext({ viewport, deviceScaleFactor: viewport.width < 600 ? 2.75 : 1 });
            const page = await context.newPage();
            if (compare) await page.route('**/*', async (route) => {
                const pathname = new URL(route.request().url()).pathname;
                const body = (variant === 'before' ? baseline : current).get(pathname);
                if (body) await route.fulfill({ body, contentType: pathname.endsWith('.css') ? 'text/css' : 'text/javascript' });
                else await route.continue();
            });
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
            await page.addInitScript(() => {
                const stats = window.heroMetrics = { lcp: 0, cls: 0, maxCalls: 0, maxTriangles: 0, frames: 0, intervals: [] };
                new PerformanceObserver((list) => { for (const entry of list.getEntries()) stats.lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
                new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) stats.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
                let calls = 0, triangles = 0, previous = 0;
                for (const name of ['clear', 'drawElements', 'drawArrays']) {
                    const original = WebGL2RenderingContext.prototype[name];
                    WebGL2RenderingContext.prototype[name] = function (...args) {
                        if (name === 'clear') {
                            calls = 0; triangles = 0; stats.frames++;
                            const now = performance.now();
                            if (previous && stats.tracking) stats.intervals.push(now - previous);
                            previous = now;
                        } else {
                            calls++;
                            if (args[0] === this.TRIANGLES) triangles += (name === 'drawElements' ? args[1] : args[2]) / 3;
                            stats.maxCalls = Math.max(stats.maxCalls, calls);
                            stats.maxTriangles = Math.max(stats.maxTriangles, triangles);
                        }
                        return original.apply(this, args);
                    };
                }
            });
            await page.goto('http://127.0.0.1:4173/');
            await page.locator('.hero-world').scrollIntoViewIfNeeded();
            await page.waitForFunction(() => document.querySelector('.hero-v2').classList.contains('has-scene'));
            await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
            await page.waitForTimeout(400);
            if (!run) await page.screenshot({ path: path.join(output, `${variant}-${viewport.width}-start.png`) });
            const range = await page.evaluate(() => {
                const hero = document.querySelector('.hero-v2'), world = document.querySelector('.hero-world'), stage = document.querySelector('.hero-stage');
                const worldTop = world.getBoundingClientRect().top + scrollY;
                const viewportHeight = document.querySelector('.hero-viewport-measure')?.clientHeight || innerHeight;
                const start = Math.max(0, worldTop - viewportHeight * .85);
                return innerWidth > 900
                    ? [hero.offsetTop - Math.min(72, viewportHeight - stage.offsetHeight), hero.offsetHeight - stage.offsetHeight]
                    : [start, worldTop - viewportHeight * .30 + world.offsetHeight * .4 - start];
            });
            await page.evaluate(async ([start, length]) => {
                scrollTo(0, Math.max(0, start));
                await new Promise((resolve) => setTimeout(resolve, 350));
                window.heroMetrics.tracking = true;
                await new Promise((resolve) => {
                    const begin = performance.now();
                    const advance = (now) => {
                        const t = Math.min(1, (now - begin) / 2400);
                        scrollTo(0, Math.max(0, start + t * length));
                        if (t < 1) requestAnimationFrame(advance); else resolve();
                    };
                    requestAnimationFrame(advance);
                });
                window.heroMetrics.tracking = false;
            }, range);
            await page.waitForTimeout(750);
            if (!run) await page.screenshot({ path: path.join(output, `${variant}-${viewport.width}-end.png`) });
            const stats = await page.evaluate(() => ({ ...window.heroMetrics, fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime, overflow: document.documentElement.scrollWidth > innerWidth }));
            const intervals = stats.intervals.filter((n) => n < 150).sort((a, b) => a - b);
            delete stats.intervals; delete stats.tracking;
            stats.frameIntervalMedian = intervals[Math.floor(intervals.length / 2)];
            stats.frameIntervalP95 = intervals[Math.floor(intervals.length * .95)];
            const idleFrames = stats.frames;
            await page.waitForTimeout(250);
            stats.idleFrames = await page.evaluate(() => window.heroMetrics.frames) - idleFrames;
            results.push({ viewport, run, variant, ...stats, errors });
            await context.close();
          }
        }
    }
} finally { await browser.close(); }
const bundle = await readFile('js/hero/scene.bundle.js');
const report = { environment: 'Local Chrome, no network/CPU throttling; three cold browser contexts per viewport/variant; frame intervals are rendering cadence, not hardware GPU timing.', browser: browser.version(), pairedComparison: compare, bundleBytes: bundle.length, gzipBytes: gzipSync(bundle).length, results };
await writeFile(path.join(output, 'metrics.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
