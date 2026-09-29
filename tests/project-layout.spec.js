import { test, expect } from '@playwright/test';

test('la imagen del proyecto de calidad del aire cabe en la ficha', async ({ page }) => {
    for (const width of [1878, 1440, 820, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/proyectos/calidad-aire-esp32-s3/');

        await expect(page.locator('link[href*="portfolio.css"]')).toHaveAttribute('href', /\?v=[a-f0-9]{12}$/);
        const image = page.locator('.project-hero-image img');
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBe(1600);
        const bounds = await page.evaluate(() => {
            const shell = document.querySelector('.project-detail-hero .shell').getBoundingClientRect();
            const link = document.querySelector('.project-hero-image').getBoundingClientRect();
            const image = document.querySelector('.project-hero-image img').getBoundingClientRect();
            return { shellRight: shell.right, linkLeft: link.left, linkRight: link.right, imageRight: image.right };
        });

        expect(bounds.linkLeft, `ancho ${width}`).toBeGreaterThanOrEqual(0);
        expect(bounds.linkRight, `ancho ${width}`).toBeLessThanOrEqual(bounds.shellRight + 1);
        expect(bounds.imageRight, `ancho ${width}`).toBeLessThanOrEqual(bounds.shellRight + 1);
    }
});
