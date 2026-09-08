import { test, expect } from '@playwright/test';

test('renderer stops after scroll, respects its drawing budget and pauses offscreen', async ({ page }, testInfo) => {
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
    // Sweep the full scroll sequence, including rings and both scanners.
    await page.evaluate(() => {
        const hero = document.querySelector('.hero-v2'), stage = document.querySelector('.hero-stage');
        const height = document.querySelector('.hero-viewport-measure').clientHeight;
        scrollTo(0, hero.offsetTop - Math.min(72, height - stage.offsetHeight) + .98 * (hero.offsetHeight - stage.offsetHeight));
    });
    await page.waitForTimeout(1700);
    const stats = await page.evaluate(() => window.renderStats);
    await page.waitForTimeout(3200);
    expect(await page.evaluate(() => window.renderStats.calls)).toBe(stats.calls);
    expect(stats.maxCalls).toBeLessThan(42);
    // Includes the translucent replica of the articulated robot, sharing buffers.
    expect(stats.maxTriangles).toBeLessThan(6000);
    console.log('3D budget:', JSON.stringify(stats));
    await page.locator('#contacto').scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const outside = await page.evaluate(() => window.renderStats.calls);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.renderStats.calls)).toBe(outside);
});

test('mouse parallax stays subtle, recenters and is disabled on touch layouts', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    // Wait for the first measured camera frame after lazy scene initialization.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const label = page.locator('[data-station="2"]');
    const neutral = await label.boundingBox();
    const stage = await page.locator('.hero-stage').boundingBox();
    await page.mouse.move(stage.x + stage.width * .9, Math.min(page.viewportSize().height - 20, stage.y + stage.height * .7));
    await page.waitForTimeout(700);
    const moved = await label.boundingBox();
    const offset = Math.hypot(moved.x - neutral.x, moved.y - neutral.y);
    if (testInfo.project.name === 'desktop-chrome') {
        expect(offset).toBeGreaterThan(.1);
        expect(offset).toBeLessThan(8);
    } else expect(offset).toBeLessThan(.1);
    await page.mouse.move(10, 10);
    await page.waitForTimeout(950);
    const reset = await label.boundingBox();
    expect(Math.hypot(reset.x - neutral.x, reset.y - neutral.y)).toBeLessThan(.15);
});

test('hidden tabs and page restoration leave one renderer and no orphan animation', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'One instrumented lifecycle check.');
    await page.addInitScript(() => {
        window.framesDrawn = 0;
        const clear = WebGL2RenderingContext.prototype.clear;
        WebGL2RenderingContext.prototype.clear = function (...args) { window.framesDrawn++; return clear.apply(this, args); };
    });
    await page.goto('/');
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
    });
    const frames = await page.evaluate(() => window.framesDrawn);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.framesDrawn)).toBe(frames);
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await expect.poll(() => page.evaluate(() => window.framesDrawn)).toBeGreaterThan(frames);
    for (let i = 0; i < 2; i++) {
        await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
        await expect(page.locator('.hero-canvas canvas')).toHaveCount(0);
        await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
        await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
        await expect(page.locator('.hero-canvas canvas')).toHaveCount(1);
    }
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
