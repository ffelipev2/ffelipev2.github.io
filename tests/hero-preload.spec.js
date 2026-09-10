import { test, expect } from '@playwright/test';
import { seekHero } from './hero-helpers.js';

test('phone prepares 3D before scrolling or finishing image loading, then rests offscreen', async ({ page }, testInfo) => {
    test.skip(!['android-chrome', 'ios-webkit'].includes(testInfo.project.name), 'Phone startup regression.');
    // Use a short phone viewport so the entire scene is initially below the fold.
    await page.setViewportSize({ width: page.viewportSize().width, height: 600 });
    let releaseImage;
    const imageGate = new Promise(resolve => { releaseImage = resolve; });
    await page.route('**/images/felipe-flores-ingeniero-1200.webp', async route => { await imageGate; await route.continue(); });
    let moduleRequests = 0;
    page.on('request', request => { if (request.url().includes('/scene.bundle.js')) moduleRequests++; });
    await page.addInitScript(() => {
        window.preloadFrames = 0;
        const clear = WebGL2RenderingContext.prototype.clear;
        WebGL2RenderingContext.prototype.clear = function (...args) { window.preloadFrames++; return clear.apply(this, args); };
    });
    try {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
        expect(await page.evaluate(() => scrollY)).toBe(0);
        expect(await page.evaluate(() => document.readyState)).not.toBe('complete');
        await expect(page.locator('.hero-world')).not.toBeInViewport();
        expect(moduleRequests).toBe(1);
        const canvas = await page.locator('.hero-canvas canvas').elementHandle();
        releaseImage();
        await page.waitForLoadState('load');
        await page.waitForTimeout(150);
        const frames = await page.evaluate(() => window.preloadFrames);
        expect(frames).toBeGreaterThan(0);
        await page.waitForTimeout(400);
        expect(await page.evaluate(() => window.preloadFrames)).toBe(frames);
        await expect(page.locator('.hero-canvas')).toHaveAttribute('data-phase', '0.0000');
        await seekHero(page, .54);
        expect(await canvas.evaluate(node => node === document.querySelector('.hero-canvas canvas'))).toBe(true);
        expect(moduleRequests).toBe(1);
        expect(await page.evaluate(() => window.preloadFrames)).toBeGreaterThan(frames);
    } finally { releaseImage(); }
});
