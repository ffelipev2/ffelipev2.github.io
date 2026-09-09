import { test, expect } from '@playwright/test';
import { heroRange } from './hero-helpers.js';

test('scroll progress follows the page without added inertia', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    const range = await page.evaluate(heroRange);
    const samples = await page.evaluate(async ({ start, length }) => {
        document.documentElement.style.scrollBehavior = 'auto';
        const samples = [];
        for (const value of [.3, .5, .4]) {
            scrollTo(0, start + value * length);
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            samples.push({ expected: (scrollY - start) / length,
                actual: Number(document.querySelector('.hero-journey').style.getPropertyValue('--journey-progress')) });
        }
        return samples;
    }, range);
    for (const sample of samples) expect(sample.actual).toBeCloseTo(sample.expected, 3);
});

test('mobile toolbar height changes preserve progress and the drawing buffer', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop-chrome', 'Mobile browser toolbar regression.');
    await page.addInitScript(() => {
        window.bufferWrites = 0;
        for (const name of ['width', 'height']) {
            const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, name);
            Object.defineProperty(HTMLCanvasElement.prototype, name, { ...descriptor, set(value) {
                if (this.closest('[data-hero-canvas]')) window.bufferWrites++;
                descriptor.set.call(this, value);
            } });
        }
    });
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    await page.waitForTimeout(250);
    const result = await page.evaluate(async () => {
        const snapshot = () => ({ progress: document.querySelector('.hero-journey').style.getPropertyValue('--journey-progress'),
            writes: window.bufferWrites, scroll: scrollY });
        const before = snapshot();
        const descriptor = Object.getOwnPropertyDescriptor(window, 'innerHeight');
        const originalHeight = innerHeight;
        // Emulated browsers have no collapsing toolbar: reproduce its resize
        // signal and changed innerHeight while the small viewport stays fixed.
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight + 90 });
        dispatchEvent(new Event('resize'));
        await new Promise((resolve) => setTimeout(resolve, 200));
        const after = snapshot();
        Object.defineProperty(window, 'innerHeight', descriptor);
        dispatchEvent(new Event('resize'));
        return { before, after };
    });
    expect(result.after).toEqual(result.before);
    const card = page.locator('.project-card-v2').first();
    await expect(card).toHaveCSS('transform', 'none');
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveClass(/motion-is-visible/);
    const keyframes = await card.evaluate((element) => element.getAnimations().flatMap((animation) => animation.effect.getKeyframes()));
    expect(keyframes.every((keyframe) => !keyframe.transform || keyframe.transform === 'none')).toBe(true);
});

test('native touch gestures scroll in both directions over the scene and projects', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'android-chrome', 'Chrome CDP delivers native touch input.');
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    const cdp = await page.context().newCDPSession(page);
    const swipe = async (from, to) => {
        const x = page.viewportSize().width / 2;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: from }] });
        for (let step = 1; step <= 10; step++) {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: from + (to - from) * step / 10 }] });
            await page.waitForTimeout(20);
        }
        // Stop the finger before lifting to keep inertia out of the assertion.
        await page.waitForTimeout(100);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(100);
    };
    for (const selector of ['.hero-world', '.project-card-v2']) {
        await page.locator(selector).first().scrollIntoViewIfNeeded();
        const before = await page.evaluate(() => scrollY);
        await swipe(600, 350);
        const down = await page.evaluate(() => scrollY);
        expect(down - before).toBeGreaterThan(150);
        await swipe(350, 600);
        const up = await page.evaluate(() => scrollY);
        expect(down - up).toBeGreaterThan(150);
    }
    await cdp.detach();
});

test('density, detail and antialias stay consistent across screen sizes', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'One matrix of densities plus a live display change.');
    const reports = [];
    for (const [width, density] of [[393, 1], [393, 2.75], [393, 4], [820, 2], [1440, 2], [3840, 3]]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: density });
        const page = await context.newPage();
        await page.addInitScript(() => {
            window.densityQueries = [];
            const original = window.matchMedia.bind(window);
            window.matchMedia = (query) => {
                const result = original(query);
                if (query.startsWith('(resolution:')) window.densityQueries.push(result);
                return result;
            };
        });
        await page.goto('/');
        await page.locator('.hero-world').scrollIntoViewIfNeeded();
        await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
        const report = await page.evaluate(async () => {
            // Inspect a scene isolated from the controller's adaptive timing.
            const { createHeroScene } = await import('/js/hero/scene.bundle.js');
            const host = document.createElement('div');
            document.body.append(host);
            const renderer = createHeroScene(host, { compact: innerWidth <= 600, onContextLost() {} });
            const visible = document.querySelector('.hero-canvas');
            renderer.resize(visible.clientWidth, visible.clientHeight);
            const canvas = host.querySelector('canvas');
            const gl = canvas.getContext('webgl2');
            let triangles = 0, calls = 0;
            for (const name of ['drawElements', 'drawArrays']) {
                const original = gl[name];
                gl[name] = function (...args) {
                    calls++;
                    if (args[0] === gl.TRIANGLES) triangles += (name === 'drawElements' ? args[1] : args[2]) / 3;
                    return original.apply(this, args);
                };
            }
            renderer.render(.62, [], false);
            const result = { triangles, calls, width: canvas.width, height: canvas.height,
                cssWidth: visible.clientWidth, cssHeight: visible.clientHeight, antialias: gl.getContextAttributes().antialias };
            renderer.reduceQuality();
            result.reducedWidth = canvas.width;
            renderer.resize(visible.clientWidth, visible.clientHeight);
            result.unchangedWidth = canvas.width;
            renderer.dispose(); host.remove();
            return result;
        });
        const expectedDpr = Math.min(density, 4, Math.sqrt(4_000_000 / (report.cssWidth * report.cssHeight)));
        expect(report.width).toBe(Math.floor(report.cssWidth * expectedDpr));
        expect(report.height).toBe(Math.floor(report.cssHeight * expectedDpr));
        expect(report.width * report.height).toBeLessThanOrEqual(4_000_000);
        expect(report.antialias).toBe(true);
        expect(report.calls).toBeLessThan(30);
        expect(report.triangles).toBeLessThan(12000);
        expect(report.unchangedWidth).toBe(report.reducedWidth);
        expect(report.reducedWidth).toBeLessThanOrEqual(report.width);
        reports.push({ viewportWidth: width, density, ...report });
        if (width === 393 && density === 1) {
            const cdp = await context.newCDPSession(page);
            await cdp.send('Emulation.setDeviceMetricsOverride', { width: 393, height: 900, deviceScaleFactor: 3, mobile: false });
            // CDP changes devicePixelRatio but emits neither resize nor the
            // resolution change event of a real display move. Deliver that signal.
            await page.evaluate(() => window.densityQueries[0].dispatchEvent(new Event('change')));
            await expect.poll(() => page.locator('.hero-canvas canvas').evaluate((canvas) => canvas.width)).toBe(report.cssWidth * 3);
            await cdp.detach();
        }
        await context.close();
    }
    // Same hardware geometry at all densities. Wide layout adds seven beams.
    expect(reports[0].triangles).toBe(reports[1].triangles);
    expect(reports[1].triangles).toBe(reports[2].triangles);
    expect(reports[3].triangles - reports[0].triangles).toBe(7 * 12);
    expect(reports[3].triangles).toBe(reports[4].triangles);
    console.log('Screen quality:', JSON.stringify(reports));
});
