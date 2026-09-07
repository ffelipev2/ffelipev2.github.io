import { test, expect } from '@playwright/test';

test('renderer becomes idle, respects its drawing budget and pauses offscreen', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'One instrumented desktop GPU budget check.');
    await page.addInitScript(() => {
        window.renderStats = { calls: 0, frameCalls: 0, maxCalls: 0, triangles: 0, maxTriangles: 0 };
        const prototype = WebGL2RenderingContext.prototype;
        for (const name of ['drawElements', 'drawArrays', 'clear']) {
            const original = prototype[name];
            prototype[name] = function (...args) {
                const stats = window.renderStats;
                if (name === 'clear') { stats.frameCalls = 0; stats.triangles = 0; }
                else {
                    stats.calls++; stats.frameCalls++;
                    if (args[0] === this.TRIANGLES) stats.triangles += (name === 'drawElements' ? args[1] : args[2]) / 3;
                    stats.maxCalls = Math.max(stats.maxCalls, stats.frameCalls);
                    stats.maxTriangles = Math.max(stats.maxTriangles, stats.triangles);
                }
                return original.apply(this, args);
            };
        }
    });
    await page.goto('/');
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    await page.waitForTimeout(400);
    const idle = await page.evaluate(() => window.renderStats.calls);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.renderStats.calls)).toBe(idle);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 650); });
    await expect.poll(() => page.evaluate(() => window.renderStats.calls)).toBeGreaterThan(idle);
    await page.waitForTimeout(600);
    const stats = await page.evaluate(() => window.renderStats);
    expect(stats.maxCalls).toBeLessThan(30);
    expect(stats.maxTriangles).toBeLessThan(12000);
    console.log('3D budget:', JSON.stringify(stats));
    await page.locator('#contacto').scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const outside = await page.evaluate(() => window.renderStats.calls);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.renderStats.calls)).toBe(outside);
});

test('short desktop viewport and enlarged text retain reachable content', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop layout boundary.');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    await page.locator('.hero-actions-v2 a').first().click();
    await expect(page.locator('#projects-title')).toBeInViewport();
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.hero-actions-v2 a').first().click();
    await expect(page.locator('#projects-title')).toBeInViewport();
});
