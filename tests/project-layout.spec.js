import { test, expect } from '@playwright/test';

test('la portada y las imágenes del proyecto de calidad del aire mantienen su tamaño', async ({ page }) => {
    for (const width of [1878, 1440, 820, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/proyectos/calidad-aire-esp32-s3/');

        await expect(page.locator('link[href*="portfolio.css"]')).toHaveAttribute('href', /\?v=[a-f0-9]{12}$/);
        const image = page.locator('.project-hero-image img');
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate((element) => element.naturalWidth), { timeout: 10000 }).toBe(4096);
        const bounds = await page.evaluate(() => {
            const shell = document.querySelector('.project-detail-hero .shell').getBoundingClientRect();
            const link = document.querySelector('.project-hero-image').getBoundingClientRect();
            const image = document.querySelector('.project-hero-image img').getBoundingClientRect();
            return { shellRight: shell.right, linkLeft: link.left, linkRight: link.right, imageRight: image.right };
        });

        expect(bounds.linkLeft, `ancho ${width}`).toBeGreaterThanOrEqual(0);
        expect(bounds.linkRight, `ancho ${width}`).toBeLessThanOrEqual(bounds.shellRight + 1);
        expect(bounds.imageRight, `ancho ${width}`).toBeLessThanOrEqual(bounds.shellRight + 1);

        const galleryFrames = page.locator('.case-study-gallery figure a');
        await expect(galleryFrames).toHaveCount(4);
        const heights = await galleryFrames.evaluateAll((frames) => frames.map((frame) => frame.getBoundingClientRect().height));
        expect(Math.max(...heights) - Math.min(...heights), `galería al ancho ${width}`).toBeLessThanOrEqual(1);
    }

    await page.goto('/images/calidad-aire-esp32-s3/montaje-prototipo-esp32-s3-horizontal.jpg');
    const fullSizeImage = page.locator('img');
    await expect.poll(() => fullSizeImage.evaluate((image) => [image.naturalWidth, image.naturalHeight])).toEqual([4096, 3072]);
});
