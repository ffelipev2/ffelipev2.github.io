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

test('the five stations activate in order, reverse correctly and keep readable labels', async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    for (const [step, progress] of [[0, 0], [1, .22], [2, .42], [3, .62], [4, .84], [4, .97], [2, .42], [0, 0]]) {
        await seek(page, progress);
        await expect(page.locator('.hero-labels .is-active')).toHaveAttribute('data-station', String(step));
        const boxes = await page.locator('[data-station]').evaluateAll((labels) => labels.map((label) => {
            const rect = label.getBoundingClientRect();
            return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, hidden: label.hidden };
        }));
        for (let i = 0; i < boxes.length; i++) {
            expect(boxes[i].hidden).toBe(false);
            expect(boxes[i].x).toBeGreaterThanOrEqual(0);
            expect(boxes[i].right).toBeLessThanOrEqual(page.viewportSize().width);
            for (let j = i + 1; j < boxes.length; j++) {
                const a = boxes[i], b = boxes[j];
                expect(a.right + 2 <= b.x || b.right + 2 <= a.x || a.bottom + 2 <= b.y || b.bottom + 2 <= a.y, `Labels ${i} and ${j} at ${progress}`).toBe(true);
            }
        }
        if (progress === .62 || progress === .97) await page.screenshot({ path: testInfo.outputPath(`narrative-${progress}.png`) });
    }
    await seek(page, 1);
    await page.evaluate(() => scrollBy(0, 200));
    await expect(page.locator('#projects-title')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    expect(errors).toEqual([]);
});

test('digital wireframe activates progressively, completes and can be scrubbed backwards', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'One instrumented geometry check.');
    await page.addInitScript(() => {
        const prototype = WebGL2RenderingContext.prototype;
        const clear = prototype.clear, drawArrays = prototype.drawArrays;
        prototype.clear = function (...args) { window.twinLineCounts = []; return clear.apply(this, args); };
        prototype.drawArrays = function (...args) {
            if (args[0] === this.LINES) window.twinLineCounts.push(args[2]);
            return drawArrays.apply(this, args);
        };
    });
    await page.goto('/');
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    const counts = [];
    for (const progress of [.79, .84, .89, .96, .84]) {
        await seek(page, progress);
        counts.push(await page.evaluate(() => window.twinLineCounts));
    }
    expect(counts[0]).toHaveLength(2); // Active edges plus quiet complete outline.
    expect(counts[1][0]).toBeGreaterThan(counts[0][0]);
    expect(counts[2][0]).toBeGreaterThan(counts[1][0]);
    expect(counts[3]).toHaveLength(1); // Entire geometry uses the active material.
    expect(counts[3][0]).toBe(counts[0][0] + counts[0][1]);
    expect(counts[4]).toEqual(counts[1]);
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
