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

test('las capturas de Ziboo y HiGrow se sirven localmente y conservan la pantalla completa', async ({ page, request }) => {
    const imageRequests = [];
    page.on('request', (item) => {
        if (item.resourceType() === 'image') imageRequests.push(item.url());
    });

    for (const project of [
        { slug: 'camara-termica-ziboo-zp2', count: 2, original: '.jpeg' },
        { slug: 'sensor-higrow-esp32-app', count: 6, original: '.png' },
    ]) {
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto('/proyectos/' + project.slug + '/');
            const frames = page.locator('.case-study-gallery a');
            await expect(frames).toHaveCount(project.count);

            for (const frame of await frames.all()) {
                await frame.scrollIntoViewIfNeeded();
                const img = frame.locator('img');
                await expect.poll(() => img.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
                const dimensions = await frame.evaluate((element) => {
                    const image = element.querySelector('img');
                    const rect = element.getBoundingClientRect();
                    return { ratio: rect.height / rect.width, natural: image.naturalHeight / image.naturalWidth };
                });
                expect(dimensions.ratio).toBeGreaterThan(2);
                expect(Math.abs(dimensions.ratio - dimensions.natural)).toBeLessThan(.02);
                await expect(img).toHaveCSS('object-fit', 'contain');
                const original = new URL(await frame.getAttribute('href'), page.url());
                expect(original.origin).toBe(new URL(page.url()).origin);
                expect(original.pathname.endsWith(project.original)).toBe(true);
                const response = await request.head(original.href);
                expect(response.status()).toBe(200);
                expect(response.headers()['content-type']).toContain(project.original === '.png' ? 'image/png' : 'image/jpeg');
            }

            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
    }

    await page.goto('/proyectos/');
    const cover = page.locator('.all-projects-grid a.project-image-v2[href*="camara-termica-ziboo-zp2"] img');
    await expect(cover).toHaveCSS('object-fit', 'contain');
    expect(imageRequests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
});
