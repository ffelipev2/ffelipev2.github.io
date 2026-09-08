import { test, expect } from '@playwright/test';
import { Vector3 } from 'three';
import { createCameraRig } from '../js/hero/camera-rig.js';

async function seek(page, progress) {
    await page.evaluate((t) => {
        const hero = document.querySelector('.hero-v2');
        const stage = document.querySelector('.hero-stage');
        const world = document.querySelector('.hero-world');
        document.documentElement.style.scrollBehavior = 'auto';
        const worldTop = world.getBoundingClientRect().top + scrollY;
        const viewportHeight = document.querySelector('.hero-viewport-measure').clientHeight;
        const start = innerWidth > 900
            ? hero.offsetTop - Math.min(72, viewportHeight - stage.offsetHeight)
            : Math.max(0, worldTop - viewportHeight * .85);
        const length = innerWidth > 900
            ? hero.offsetHeight - stage.offsetHeight
            : worldTop - viewportHeight * .30 + world.offsetHeight * .4 - start;
        scrollTo(0, Math.max(0, start + t * length));
    }, progress);
    await page.waitForTimeout(750);
}

test('scroll activates every station, holds without autoplay and reverses the sequence', async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => {
        window.dataPointBudget = 0;
        const original = WebGL2RenderingContext.prototype.drawArrays;
        WebGL2RenderingContext.prototype.drawArrays = function (mode, first, count) {
            if (mode === this.POINTS) window.dataPointBudget = Math.max(window.dataPointBudget, count);
            return original.call(this, mode, first, count);
        };
    });
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    await seek(page, .1);
    // A large initial mobile scroll can need the full bounded catch-up.
    await page.waitForTimeout(800);
    for (const [station, target] of [.24, .39, .54, .69, .90].entries()) {
        await seek(page, target);
        await expect(page.locator(`[data-station="${station}"]`)).toHaveClass(/is-active/);
        if (station === 2) {
            const classes = await page.locator('[data-station]').evaluateAll(labels => labels.map(label => label.className));
            await page.waitForTimeout(3200);
            expect(await page.locator('[data-station]').evaluateAll(labels => labels.map(label => label.className))).toEqual(classes);
        }
    }
    expect(await page.locator('.hero-journey').evaluate(el => Number(el.style.getPropertyValue('--data-pulse')))).toBeGreaterThan(.3);
    await page.screenshot({ path: testInfo.outputPath('physical-digital-sync.png') });
    expect(await page.evaluate(() => window.dataPointBudget)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.dataPointBudget)).toBeLessThanOrEqual(testInfo.project.name.includes('android') || testInfo.project.name.includes('ios') ? 4 : 12);
    await expect(page.locator('[data-station]')).toHaveCount(5);
    await seek(page, .39);
    await expect(page.locator('[data-station="1"]')).toHaveClass(/is-active/);
    await page.locator('.hero-actions-v2 a').first().click();
    await expect(page.locator('#projects-title')).toBeInViewport();
    expect(errors).toEqual([]);
});

test('scroll phases preserve rest and react in order even after a fast jump', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Platform-independent timeline.');
    const { createAnimationSequence } = await import('../js/hero/animation-sequence.js');
    const sequence = createAnimationSequence();
    let state;
    const targets = [[.10, -1], [.24, 0], [.39, 1], [.54, 2], [.69, 3], [.90, 4]];
    for (const [target, active] of targets) {
        for (let i = 0; i < 75; i++) state = sequence.update(1 / 60, target, false);
        expect(state.phase).toBeCloseTo(target, 3);
        const pulses = [...state.pulses];
        if (active < 0) expect(pulses.every((p) => p === 0)).toBe(true);
        else expect(pulses[active]).toBeGreaterThan(.1);
        const stopped = JSON.stringify(state);
        for (let i = 0; i < 12; i++) sequence.update(10, target, false);
        expect(JSON.stringify(state)).toBe(stopped);
        expect(state.active).toBe(false);
    }
    const jump = createAnimationSequence(), visited = new Set();
    let scan = false;
    for (let i = 0; i < 110; i++) {
        state = jump.update(1 / 60, 1, false);
        state.pulses.forEach((pulse, index) => { if (pulse > .1) visited.add(index); });
        scan ||= state.scanner > .3;
    }
    expect([...visited]).toEqual([0, 1, 2, 3, 4]);
    expect(scan).toBe(true);
    const reduced = jump.update(10, .5, true);
    expect(reduced.active).toBe(false);
    expect(reduced.scanner + reduced.sync).toBe(0);
});

test('camera retains all station bounds across narrow, wide and short viewports', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Camera geometry is platform independent.');
    const rig = createCameraRig(), point = new Vector3();
    for (const width of [320, 360, 393, 600, 601, 820, 900, 901, 1280, 1440, 1920]) {
        const compact = width <= 600, height = compact ? 340 : 300;
        const xs = compact ? [-2.25, 0, 2.25, 1.45, -1.45] : [-8.8, -4.4, 0, 4.4, 8.8];
        const zs = compact ? [-1.5, -1.5, -1.5, 1.65, 1.65] : [0, 0, 0, 0, 0];
        const scale = compact ? .6 : 1;
        for (const progress of [0, .2, .4, .6, .8, 1]) {
            rig.update(progress, width, height, compact);
            for (let i = 0; i < 5; i++) for (const x of [-1.65, 1.65]) for (const y of [-.42, 3.25]) for (const z of [-1.3, 1.3]) {
                point.set(xs[i] + x * scale, y * scale, zs[i] + z * scale).project(rig.camera);
                expect(Math.abs(point.x), `Station ${i}, ${width}px, progress ${progress}`).toBeLessThan(1);
                expect(Math.abs(point.y)).toBeLessThan(1);
            }
        }
    }
});

test('labels remain separated at responsive boundaries and after live resize', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Additional CSS width boundaries.');
    await page.goto('/');
    for (const width of [320, 600, 601, 900, 901]) {
        await page.setViewportSize({ width, height: 900 });
        await page.locator('.hero-world').scrollIntoViewIfNeeded();
        await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
        for (const progress of [0, .84]) {
            await seek(page, progress);
            const layout = await page.locator('[data-station]').evaluateAll((labels) => {
                const boxes = labels.map((label) => label.getBoundingClientRect());
                return {
                    clipped: labels.some((label, i) => label.hidden || boxes[i].x < 0 || boxes[i].right > innerWidth),
                    overlapping: boxes.some((a, i) => boxes.slice(i + 1).some((b) => a.right > b.x && b.right > a.x && a.bottom > b.y && b.bottom > a.y)),
                    overflow: document.documentElement.scrollWidth > innerWidth,
                };
            });
            expect(layout, `${width}px at ${progress}`).toEqual({ clipped: false, overlapping: false, overflow: false });
        }
    }
});
