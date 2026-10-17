import { test, expect } from '@playwright/test';

test('las imágenes optimizadas conservan la presentación y los originales accesibles', async ({ page, request }) => {
    const imageRoot = '/images/calidad-aire-esp32-s3/';
    const heroPreview = imageRoot + 'montaje-prototipo-esp32-s3-1600.webp';
    const heroOriginal = imageRoot + 'montaje-prototipo-esp32-s3-horizontal.jpg';
    const galleryPreview = imageRoot + 'montaje-componentes.webp';
    const galleryOriginal = imageRoot + 'montaje-componentes.png';
    const requestedPaths = [];
    page.on('request', (request) => requestedPaths.push(new URL(request.url()).pathname));

    for (const width of [1878, 1440, 820, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/proyectos/calidad-aire-esp32-s3/');

        await expect(page.locator('link[href*="portfolio.css"]')).toHaveAttribute('href', /\?v=[a-f0-9]{12}$/);
        const image = page.locator('.project-hero-image img');
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate((element) => [element.naturalWidth, element.naturalHeight]), { timeout: 10000 }).toEqual([1600, 1200]);
        expect(new URL(await page.locator('.project-hero-image').getAttribute('href'), page.url()).pathname).toBe(heroOriginal);
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
        expect(new URL(await galleryFrames.first().getAttribute('href'), page.url()).pathname).toBe(galleryOriginal);
        const heights = await galleryFrames.evaluateAll((frames) => frames.map((frame) => frame.getBoundingClientRect().height));
        expect(Math.max(...heights) - Math.min(...heights), `galería al ancho ${width}`).toBeLessThanOrEqual(1);
    }

    const galleryImage = page.locator('.case-study-gallery figure img').first();
    await galleryImage.scrollIntoViewIfNeeded();
    await expect.poll(() => galleryImage.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
    expect(requestedPaths).toContain(heroPreview);
    expect(requestedPaths).toContain(galleryPreview);
    expect(requestedPaths).not.toContain(heroOriginal);
    expect(requestedPaths).not.toContain(galleryOriginal);

    const previews = await Promise.all([request.get(heroPreview), request.get(galleryPreview)]);
    expect(previews.every((response) => response.status() === 200)).toBe(true);
    const bodies = await Promise.all(previews.map((response) => response.body()));
    expect(bodies.reduce((bytes, body) => bytes + body.length, 0)).toBeLessThan(1024 * 1024);
    expect((await request.head(galleryOriginal)).status()).toBe(200);

    const [originalPage] = await Promise.all([
        page.waitForEvent('popup'),
        page.locator('.project-hero-image').click()
    ]);
    await expect(originalPage).toHaveURL(new RegExp(heroOriginal + '$'));
    const fullSizeImage = originalPage.locator('img');
    await expect.poll(() => fullSizeImage.evaluate((image) => [image.naturalWidth, image.naturalHeight])).toEqual([4096, 3072]);
    await originalPage.close();
});
