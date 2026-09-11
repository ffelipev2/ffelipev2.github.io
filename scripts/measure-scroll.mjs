// Paired local audit of HEAD and working assets. No CPU/network throttling;
// transfer counts and DOM mutations are work performed, not GPU time or battery.
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { heroRange, seekHero } from '../tests/hero-helpers.js';

const output = path.resolve(process.argv[2] || 'playwright-report/scroll-audit');
const baselineRevision = process.argv.find(value => value.startsWith('--baseline='))?.slice(11) || 'HEAD';
const runs = Number(process.argv.find(value => value.startsWith('--runs='))?.slice(7) || 3);
if (!Number.isInteger(runs) || runs < 1 || runs > 10) throw new Error('Use 1 to 10 runs');
await mkdir(output, { recursive: true });
const files = ['js/portfolio.js', 'js/hero-3d.js', 'js/hero/scene.bundle.js'];
const before = new Map(files.map(file => ['/' + file, execFileSync('git', ['show', `${baselineRevision}:${file}`], { maxBuffer: 2 * 1024 * 1024 })]));
const after = new Map(await Promise.all(files.map(async file => ['/' + file, await readFile(file)])));
const browser = await chromium.launch({ channel: 'chrome' });
const results = [], images = new Map();
try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 393, height: 851 }]) {
        for (let run = 0; run < runs; run++) for (const variant of run % 2 ? ['after', 'before'] : ['before', 'after']) {
            const context = await browser.newContext({ viewport, deviceScaleFactor: viewport.width < 600 ? 2.75 : 1, isMobile: viewport.width < 600, hasTouch: viewport.width < 600 });
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('**/*', async route => {
                const body = (variant === 'before' ? before : after).get(new URL(route.request().url()).pathname);
                if (body) await route.fulfill({ body, contentType: 'text/javascript' });
                else await route.continue();
            });
            await page.addInitScript(() => {
                window.audit = { frames: 0, uploadBytes: 0, uploads: 0, navigationMutations: 0, heroMutations: 0 };
                const prototype = WebGL2RenderingContext.prototype;
                const clear = prototype.clear, upload = prototype.bufferSubData;
                prototype.clear = function (...args) { window.audit.frames++; return clear.apply(this, args); };
                prototype.bufferSubData = function (target, offset, data, sourceOffset, length) {
                    window.audit.uploads++;
                    window.audit.uploadBytes += length ? length * data.BYTES_PER_ELEMENT : data.byteLength - (sourceOffset || 0) * (data.BYTES_PER_ELEMENT || 1);
                    return upload.apply(this, arguments);
                };
                document.addEventListener('DOMContentLoaded', () => {
                    const nav = new MutationObserver(records => window.audit.navigationMutations += records.length);
                    document.querySelectorAll('.desktop-nav-v2, .mobile-nav').forEach(node => nav.observe(node, { subtree: true, attributes: true }));
                    new MutationObserver(records => window.audit.heroMutations += records.length).observe(document.querySelector('.hero-v2'), { subtree: true, attributes: true });
                });
            });
            const cdp = await context.newCDPSession(page);
            await cdp.send('Performance.enable');
            await page.goto('http://127.0.0.1:4173/');
            await page.waitForSelector('.hero-v2.has-scene');
            await seekHero(page, 0);
            await page.waitForTimeout(400);
            const measure = async (name, action) => {
                const first = await page.evaluate(() => ({ ...window.audit }));
                const firstPerf = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(item => [item.name, item.value]));
                await action();
                const last = await page.evaluate(() => ({ ...window.audit }));
                const lastPerf = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(item => [item.name, item.value]));
                return { name, ...Object.fromEntries(Object.keys(first).map(key => [key, last[key] - first[key]])), ...Object.fromEntries(['TaskDuration', 'ScriptDuration', 'LayoutCount', 'RecalcStyleCount'].map(key => [key, lastPerf[key] - firstPerf[key]])) };
            };
            const range = await page.evaluate(heroRange);
            const sweep = async (from, to, duration) => {
                await page.evaluate(async ({ start, length, from, to, duration }) => {
                    await new Promise(resolve => {
                        const begin = performance.now();
                        const advance = now => {
                            const t = Math.min(1, (now - begin) / duration);
                            scrollTo(0, Math.max(0, start + (from + (to - from) * t) * length));
                            if (t < 1) requestAnimationFrame(advance); else resolve();
                        };
                        requestAnimationFrame(advance);
                    });
                }, { ...range, from, to, duration });
                await seekHero(page, to);
            };
            const measurements = [];
            measurements.push(await measure('stationsBeforeRobot', () => sweep(0, .60, 1800)));
            measurements.push(await measure('movingRobot', () => sweep(.60, .98, 2400)));
            await page.waitForTimeout(350);
            measurements.push(await measure('idleHero', () => page.waitForTimeout(600)));
            if (!run) for (const phase of [.24, .54, .78, .90]) {
                await seekHero(page, phase);
                await page.waitForTimeout(250);
                const screenshot = await page.locator('.hero-world').screenshot({ path: path.join(output, `${variant}-${viewport.width}-${phase}.png`) });
                images.set(`${viewport.width}-${phase}-${variant}`, screenshot);
            }
            await page.evaluate(() => scrollTo(0, document.querySelector('#proyectos').offsetTop + 120));
            await page.waitForTimeout(650);
            measurements.push(await measure('projectsScroll', () => page.evaluate(async () => {
                const start = scrollY;
                for (let i = 1; i <= 30; i++) { scrollTo(0, start + i * 4); await new Promise(resolve => requestAnimationFrame(resolve)); }
            })));
            await page.waitForTimeout(250);
            measurements.push(await measure('idleOffscreen', () => page.waitForTimeout(600)));
            results.push({ viewport, run, variant, measurements, errors });
            console.log(`${viewport.width} run ${run + 1} ${variant}: ${JSON.stringify(measurements)}`);
            await context.close();
        }
    }
} finally { await browser.close(); }
const visuals = [];
for (const [key, data] of images) if (key.endsWith('-before')) visuals.push({ frame: key.replace('-before', ''), identicalPNG: data.equals(images.get(key.replace('-before', '-after'))) });
const report = { environment: 'Local Chrome; paired runs per emulated viewport. CPU counters include instrumentation. No hardware GPU timing or battery measurements.', baselineRevision, runs, browser: browser.version(), visuals, results };
await writeFile(path.join(output, 'metrics.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Visual comparison:', JSON.stringify(visuals));
