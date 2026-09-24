import { test, expect } from '@playwright/test';

test('topic pages show only supported projects and link to their case studies', async ({ page }) => {
    const topics = [
        ['esp32', ['Gemelo Digital', 'HuskyLens + ESP32', 'Sensor HiGrow + App']],
        ['iot', ['Gemelo Digital', 'Sensor HiGrow + App', 'Ethernet + Sensor biométrico']],
        ['industria-4-0', ['Gemelo Digital', 'UFACTORY LITE 6']],
        ['robotica', ['UFACTORY LITE 6', 'Robot Otto RC']]
    ];

    for (const [slug, titles] of topics) {
        await page.goto('/' + slug + '/');
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('nav[aria-label="Migas de pan"]')).toBeVisible();
        await expect(page.locator('.topic-project-grid .project-card-v2')).toHaveCount(titles.length);
        for (const title of titles) {
            await expect(page.locator('.topic-project-grid')).toContainText(title);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }

    await page.locator('.topic-project-grid h3 a').first().click();
    await expect(page).toHaveURL(/\/proyectos\/ufactory-lite-6\/$/);
    await expect(page.locator('nav[aria-label="Áreas relacionadas"]')).toContainText('Robótica');
});

test('publication page separates authorship from acknowledgements', async ({ page }) => {
    await page.goto('/publicaciones/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('#authored-title + .publication-list article')).toHaveCount(1);
    await expect(page.locator('#collaborations-title ~ .publication-list article')).toHaveCount(2);
    await expect(page.locator('#collaborations-title')).toBeVisible();
    await expect(page.locator('.section-intro')).toContainText('no figuro como autor');
    const graph = await page.locator('script[type="application/ld+json"]').textContent();
    const schema = JSON.parse(graph);
    expect(schema['@graph'].filter((item) => item['@type'] === 'ScholarlyArticle')).toHaveLength(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
