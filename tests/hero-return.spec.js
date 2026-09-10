import { test, expect } from '@playwright/test';
import { seekHero } from './hero-helpers.js';

test('footer arrow resets the scene without reverse playback before the next descent', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    await seekHero(page, .96);
    await page.locator('.back-to-top').scrollIntoViewIfNeeded();
    const canvas = await page.locator('.hero-canvas canvas').elementHandle();
    await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'smooth';
        window.returnPhases = [];
        const host = document.querySelector('.hero-canvas');
        window.returnObserver = new MutationObserver(() => window.returnPhases.push(Number(host.dataset.phase)));
        document.querySelector('.back-to-top').addEventListener('click', () => {
            window.returnObserver.observe(host, { attributes: true, attributeFilter: ['data-phase'] });
        }, { capture: true, once: true });
    });
    await page.locator('.back-to-top').click();
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 10000 }).toBeLessThanOrEqual(2);
    await expect(page.locator('.hero-canvas')).toHaveAttribute('data-phase', '0.0000');
    const returning = await page.evaluate(() => window.returnPhases.splice(0));
    expect(returning.length).toBeGreaterThan(0);
    expect(returning.every(phase => phase === 0), JSON.stringify(returning)).toBe(true);
    // Immediately descend again: no leftover reverse motion can run first.
    await seekHero(page, .54);
    const descending = await page.evaluate(() => {
        window.returnObserver.disconnect(); return window.returnPhases;
    });
    expect(descending.length).toBeGreaterThan(1);
    expect(descending.every((phase, i) => i === 0 || phase >= descending[i - 1])).toBe(true);
    expect(await canvas.evaluate(node => node === document.querySelector('.hero-canvas canvas'))).toBe(true);
});
