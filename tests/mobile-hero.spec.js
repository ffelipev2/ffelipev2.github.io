import { test, expect } from '@playwright/test';
import { heroRange, seekHero } from './hero-helpers.js';

test('network quality changes keep the same canvas and current scroll phase', async ({ page }) => {
    await page.addInitScript(() => {
        const connection = new EventTarget(); connection.saveData = false;
        Object.defineProperty(navigator, 'connection', { configurable: true, value: connection });
    });
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    await seekHero(page, .54);
    const result = await page.evaluate(async () => {
        const canvas = document.querySelector('.hero-canvas canvas');
        const phase = document.querySelector('.hero-canvas').dataset.phase;
        let removals = 0;
        const observer = new MutationObserver(records => records.forEach(record => { removals += record.removedNodes.length; }));
        observer.observe(canvas.parentElement, { childList: true });
        for (let i = 0; i < 8; i++) navigator.connection.dispatchEvent(new Event('change'));
        await new Promise(resolve => setTimeout(resolve, 400));
        observer.disconnect();
        return { same: canvas === document.querySelector('.hero-canvas canvas'), removals, phase, after: document.querySelector('.hero-canvas').dataset.phase };
    });
    expect(result.same).toBe(true); expect(result.removals).toBe(0); expect(result.after).toBe(result.phase);
});

test('touch layouts keep the full scene pinned through their scroll range', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop-chrome', 'Touch layout.');
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    const range = await page.evaluate(heroRange);
    const shortTrack = page.viewportSize().width <= 768;
    expect(range.length).toBeGreaterThanOrEqual(shortTrack ? 480 : 1200);
    expect(range.length).toBeLessThanOrEqual(shortTrack ? 660 : 1800);
    const tops = [];
    for (const phase of [.10, .39, .54, .78, .90]) {
        await seekHero(page, phase);
        const box = await page.locator('.hero-world').boundingBox();
        tops.push(box.y);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height).toBeLessThan(page.viewportSize().height);
        if (phase === .39 || phase === .54) await page.locator('.hero-world').screenshot({ path: testInfo.outputPath(`signals-${phase}.png`) });
    }
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2);
    await seekHero(page, .78);
    const started = Date.now();
    await seekHero(page, .85);
    expect(Date.now() - started).toBeGreaterThan(380);
    const canvas = await page.locator('.hero-canvas canvas').elementHandle();
    await page.locator('#contacto').scrollIntoViewIfNeeded();
    await seekHero(page, .85);
    expect(await canvas.evaluate(node => node === document.querySelector('.hero-canvas canvas'))).toBe(true);
});

test('sustained slow frames reduce quality without replacing the scene', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'android-chrome', 'One simulated busy-phone regression.');
    await page.addInitScript(() => {
        let cost = 0;
        const now = performance.now.bind(performance);
        performance.now = () => now() + cost;
        const clear = WebGL2RenderingContext.prototype.clear;
        WebGL2RenderingContext.prototype.clear = function (...args) {
            const result = clear.apply(this, args);
            if (window.simulateBusyGPU) cost += 40;
            return result;
        };
    });
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    await seekHero(page, .1);
    const canvas = await page.locator('.hero-canvas canvas').elementHandle();
    await page.evaluate(() => { window.simulateBusyGPU = true; });
    await seekHero(page, .99);
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    expect(await canvas.evaluate(node => node === document.querySelector('.hero-canvas canvas'))).toBe(true);
    expect(await canvas.evaluate(node => node.width / node.clientWidth)).toBeLessThanOrEqual(1.01);
});

test('phone finishes the full sequence within three short swipes and releases into projects', async ({ page }, testInfo) => {
    test.skip(page.viewportSize().width > 768, 'Short phone track only.');
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    await seekHero(page, 0);
    await expect(page.locator('.hero-canvas')).toHaveAttribute('data-phase', '0.0000');
    const range = await page.evaluate(heroRange);
    const cdp = testInfo.project.name === 'android-chrome' ? await page.context().newCDPSession(page) : null;
    const phases = [];
    for (let swipe = 0; swipe < 3; swipe++) {
        // Android gets real touch input. WebKit verifies the same physical
        // scroll distance; Playwright has no public swipe API for that engine.
        const x = page.viewportSize().width / 2;
        if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: 600 }] });
        for (let step = 1; step <= 10; step++) {
            if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: 600 - step * 26 }] });
            else await page.evaluate(() => scrollBy(0, 26));
            await page.waitForTimeout(30);
        }
        await page.waitForTimeout(100);
        if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(150);
        phases.push(await page.locator('.hero-journey').evaluate(node => Number(node.style.getPropertyValue('--journey-progress'))));
    }
    await cdp?.detach();
    expect(phases[0]).toBeGreaterThan(0);
    expect(phases[0]).toBeLessThan(1);
    expect(phases[1]).toBeGreaterThan(phases[0]);
    expect(phases[2]).toBe(1);
    await expect(page.locator('.hero-canvas')).toHaveAttribute('data-phase', '1.0000', { timeout: 10000 });
    await page.screenshot({ path: testInfo.outputPath('three-swipes.png') });
    // At the endpoint the pinned visual meets the track edge; projects remain
    // immediately after the hero. Crossing that edge must not relocate content.
    const samples = [];
    for (const offset of [-20, 0, 20, 80]) {
        await page.evaluate(y => scrollTo(0, y), range.start + range.length + offset);
        await page.waitForTimeout(80);
        samples.push(await page.evaluate(() => {
            const track = document.querySelector('.hero-track').getBoundingClientRect();
            const visual = document.querySelector('.hero-visual').getBoundingClientRect();
            const hero = document.querySelector('.hero-v2').getBoundingClientRect();
            const projects = document.querySelector('#proyectos').getBoundingClientRect();
            return { scroll: scrollY, projectTop: projects.top + scrollY, sectionGap: projects.top - hero.bottom,
                trackGap: track.bottom - visual.bottom, visualTop: visual.top, overflow: document.documentElement.scrollWidth > innerWidth };
        }));
    }
    expect(Math.max(...samples.map(s => s.projectTop)) - Math.min(...samples.map(s => s.projectTop))).toBeLessThan(2);
    for (const sample of samples) {
        expect(Math.abs(sample.sectionGap)).toBeLessThan(2);
        expect(sample.overflow).toBe(false);
    }
    expect(Math.abs(samples[1].trackGap)).toBeLessThan(2);
    // Compare actual movement after release; Android can round the exact pin
    // endpoint by a CSS pixel at fractional device density.
    expect(Math.abs(samples[2].visualTop - samples[3].visualTop - (samples[3].scroll - samples[2].scroll))).toBeLessThan(1);
    await expect(page.locator('#projects-title')).toBeInViewport();
    await seekHero(page, 0);
    await expect(page.locator('.hero-canvas')).toHaveAttribute('data-phase', '0.0000');
});

test('short travel stops at 768px and leaves tablet and desktop distances intact', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'One live breakpoint matrix.');
    await page.goto('/');
    for (const width of [393, 768, 769, 820, 900, 901, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.locator('.hero-world').scrollIntoViewIfNeeded();
        await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
        await seekHero(page, .5);
        const range = await page.evaluate(heroRange);
        expect(range.length).toBeCloseTo(width <= 768 ? 630 : width <= 900 ? 1620 : 810, 0);
        await expect(page.locator(width <= 900 ? '.hero-visual' : '.hero-stage')).toHaveCSS('position', 'sticky');
    }
});
