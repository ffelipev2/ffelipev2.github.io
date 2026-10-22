import { test, expect } from '@playwright/test';

const order = [
    'gemelo-digital',
    'calidad-aire-esp32-s3',
    'ufactory-lite-6',
    'sensor-higrow-esp32-app',
    'camara-termica-ziboo-zp2',
    'chat-lora',
    'huskylens-esp32',
    'robot-otto-arduino-3d',
    'ethernet-sensor-biometrico',
    'vehiculo-arduino-camara-wifi',
    'arduino-bluetooth-rele'
];

const linkedProjects = (locator) => locator.evaluateAll((links) => links.map((link) => new URL(link.href).pathname.split('/')[2]));

for (const javaScriptEnabled of [true, false]) {
    test.describe(javaScriptEnabled ? 'Project order with JavaScript' : 'Project order without JavaScript', () => {
        test.use({ javaScriptEnabled });

        test('home, catalog, menus and filtered lists preserve the editorial order', async ({ page }, testInfo) => {
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.goto('/');
            const homeCards = page.locator('#proyectos .project-body-v2 h3 a');
            expect(await linkedProjects(homeCards)).toEqual(order);
            await expect(page.locator('.carousel-dots span')).toHaveCount(order.length);

            await page.locator('.hero-actions-v2 a').first().click();
            await expect(page).toHaveURL(/#proyectos$/);
            await expect(page.locator('#projects-title')).toBeInViewport();
            expect(await linkedProjects(homeCards)).toEqual(order);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            if (javaScriptEnabled) await page.locator('#proyectos').screenshot({ path: testInfo.outputPath('home-projects.png') });

            await page.locator('.section-heading-v2 a[href="./proyectos/"]').click();
            await expect(page).toHaveURL(/\/proyectos\/$/);
            expect(await linkedProjects(page.locator('.all-projects-grid .project-body-v2 h2 a'))).toEqual(order);
            if (javaScriptEnabled) await page.screenshot({ path: testInfo.outputPath('catalog-projects.png') });

            for (const route of ['/', '/proyectos/', '/esp32/', '/iot/', '/industria-4-0/', '/robotica/', '/proyectos/gemelo-digital/']) {
                await page.goto(route);
                expect(await linkedProjects(page.locator('.mobile-submenu a').filter({ hasNotText: 'Todos los proyectos' })), route).toEqual(order);
                const subset = await linkedProjects(page.locator('.project-body-v2 :is(h2, h3) a, .related-projects-grid h3 a'));
                expect(subset.length, route).toBeGreaterThan(0);
                expect(subset, route).toEqual(order.filter((slug) => subset.includes(slug)));
            }
        });
    });
}

test('mobile carousel reaches every project in order and returns to the previous one', async ({ page }, testInfo) => {
    test.skip(test.info().project.use.viewport.width > 640, 'Carousel controls are only shown on phones.');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#proyectos');
    const dots = page.locator('.carousel-dots span');
    const slides = page.locator('[data-carousel-slide]');
    const next = page.locator('[data-carousel-next]');
    for (let index = 1; index < order.length; index++) {
        await next.click();
        await expect(dots.nth(index)).toHaveClass('is-active');
        await expect.poll(() => slides.nth(index).evaluate((slide) => {
            const bounds = slide.getBoundingClientRect();
            const track = slide.parentElement.getBoundingClientRect();
            return bounds.left >= track.left - 1 && bounds.right <= track.right + 1;
        })).toBe(true);
        if (index === 4 || index === order.length - 1) await page.screenshot({ path: testInfo.outputPath('carousel-project-' + (index + 1) + '.png') });
    }
    await next.click();
    await expect(dots.last()).toHaveClass('is-active');
    await page.locator('[data-carousel-prev]').click();
    await expect(dots.nth(order.length - 2)).toHaveClass('is-active');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
