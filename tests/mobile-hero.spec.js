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

test('phone keeps the scene visible through a longer scroll track and slower robot transfer', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop-chrome', 'Touch layout.');
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    const range = await page.evaluate(heroRange);
    expect(range.length).toBeGreaterThanOrEqual(1400);
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
    expect(Date.now() - started).toBeGreaterThan(480);
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
