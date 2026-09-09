import { test, expect } from '@playwright/test';
import { seekHero } from './hero-helpers.js';

test('hero, traveling, navigation and project detail remain functional', async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Felipe Flores');
    await expect(page.locator('.hero-actions-v2 a').first()).toBeVisible();
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/, { timeout: 20000 });
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); });
    await page.screenshot({ path: testInfo.outputPath('hero-start.png') });
    const start = await page.locator('[data-station="4"]').getAttribute('style');
    await seekHero(page, .5);
    await expect.poll(() => page.locator('[data-station="4"]').getAttribute('style')).not.toBe(start);
    await page.screenshot({ path: testInfo.outputPath('hero-travel.png') });
    await page.locator('.hero-actions-v2 a').first().click();
    await expect(page).toHaveURL(/#proyectos$/);
    await expect(page.locator('#projects-title')).toBeInViewport();
    for (const card of await page.locator('.project-card-v2').all()) {
        const box = await card.boundingBox();
        if (box && box.x + box.width * .2 < page.viewportSize().width && box.x + box.width > 0) await expect(card).toHaveCSS('opacity', '1');
    }
    await page.screenshot({ path: testInfo.outputPath('projects.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (testInfo.project.name !== 'desktop-chrome') {
        await page.locator('.menu-toggle-v2').click();
        await expect(page.locator('#mobile-menu')).toHaveAttribute('aria-hidden', 'false');
        await expect(page.locator('#mobile-menu')).toHaveClass(/is-open/);
        await page.keyboard.press('Escape');
        await expect(page.locator('.menu-toggle-v2')).toBeFocused();
    }
    await page.locator('.project-body-v2 h3 a').first().click();
    await expect(page).toHaveURL(/proyectos\/gemelo-digital\/$/);
    await expect(page.locator('h1')).toContainText('Gemelo Digital');
    expect(errors).toEqual([]);
});

test('reduced motion and live preference change preserve ordinary scrolling', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    await expect(page.locator('.hero-labels .is-active')).toHaveCount(5);
    await expect(page.locator('.hero-v2')).not.toHaveClass(/has-travel/);
    const finalLabel = await page.locator('[data-station="4"]').getAttribute('style');
    await page.evaluate(() => scrollBy(0, 80));
    await page.waitForTimeout(200);
    expect(await page.locator('[data-station="4"]').getAttribute('style')).toBe(finalLabel);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/, { timeout: 20000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.hero-canvas canvas')).toHaveCount(1);
    await expect(page.locator('.hero-labels .is-active')).toHaveCount(5);
    await expect(page.locator('.hero-v2')).not.toHaveClass(/has-travel/);
});

test('WebGL failure leaves all content, fallback and anchors usable', async ({ page }) => {
    await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
            return type.includes('webgl') ? null : original.call(this, type, ...args);
        };
    });
    await page.goto('/');
    await expect(page.locator('.hero-static')).toBeVisible();
    await page.locator('.hero-actions-v2 a').first().click();
    await expect(page.locator('#projects-title')).toBeInViewport();
    await expect(page.locator('.hero-v2')).not.toHaveClass(/has-travel/);
});

test('loss of an active WebGL context releases the canvas', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/, { timeout: 20000 });
    await page.locator('canvas').evaluate((canvas) => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('.hero-static')).toBeVisible();
    await expect(page.locator('.hero-v2')).not.toHaveClass(/has-travel/);
});

test('without JavaScript the professional content remains available', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await expect(page.locator('h1')).toBeVisible();
    await page.locator('.hero-actions-v2 a').first().click();
    await expect(page.locator('#projects-title')).toBeInViewport();
    await expect(page.locator('.project-card-v2')).toHaveCount(3);
    await context.close();
});

test('low-power devices keep the lightweight fallback without downloading Three.js', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 }));
    const requests = [];
    page.on('request', (request) => { if (request.url().includes('scene.bundle')) requests.push(request.url()); });
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-static')).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(requests).toEqual([]);
});

test('palette text and buttons meet normal text contrast', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const route of ['/', '/proyectos/', '/proyectos/gemelo-digital/']) {
        await page.goto(route);
        const failures = await page.evaluate(() => {
            const rgba = (value) => (value.match(/[\d.]+/g) || []).map(Number);
            const luminance = (rgb) => rgb.slice(0, 3).reduce((sum, value, i) => {
                const c = value / 255;
                return sum + (c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][i];
            }, 0);
            const background = (element) => {
                if (!element) return [7, 17, 31];
                const bg = rgba(getComputedStyle(element).backgroundColor);
                const alpha = bg[3] ?? 1;
                if (alpha === 1) return bg;
                const parent = background(element.parentElement);
                return bg.slice(0, 3).map((c, i) => c * alpha + parent[i] * (1 - alpha));
            };
            return [...document.querySelectorAll('p, h1, h2, h3, h4, a, button, summary, span')].filter((element) => {
                return element.getClientRects().length && element.textContent.trim() && !element.closest('[aria-hidden="true"], [inert]');
            }).flatMap((element) => {
                const style = getComputedStyle(element);
                const fg = luminance(rgba(style.color)), bg = luminance(background(element));
                const ratio = (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05);
                const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
                return ratio < (large ? 3 : 4.5) ? [{ text: element.textContent.trim().slice(0, 45), class: element.className, ratio }] : [];
            });
        });
        expect(failures, route).toEqual([]);
    }
});
