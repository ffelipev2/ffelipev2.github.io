import { test, expect } from '@playwright/test';
import { seekHero } from './hero-helpers.js';

test('static robot buffers are reused while its animated pose still uploads', async ({ page }) => {
    await page.addInitScript(() => {
        window.uploadBytes = 0;
        const upload = WebGL2RenderingContext.prototype.bufferSubData;
        WebGL2RenderingContext.prototype.bufferSubData = function (target, offset, data) {
            window.uploadBytes += data.byteLength;
            return upload.apply(this, arguments);
        };
    });
    await page.goto('/');
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    await seekHero(page, .1);
    const resting = await page.evaluate(() => window.uploadBytes);
    await seekHero(page, .54);
    expect(await page.evaluate(() => window.uploadBytes)).toBe(resting);
    await seekHero(page, .78);
    expect(await page.evaluate(() => window.uploadBytes)).toBeGreaterThan(resting + 100000);
    await seekHero(page, .1);
    const returned = await page.evaluate(() => window.uploadBytes);
    await seekHero(page, .54);
    expect(await page.evaluate(() => window.uploadBytes)).toBe(returned);
});

test('navigation writes only at section changes and remeasures expanded content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    const checkPosition = async () => {
        await expect.poll(() => page.evaluate(() => {
            const links = [...document.querySelectorAll('.desktop-nav-v2 a[href^="#"]')];
            const sections = links.map(link => document.querySelector(link.hash)).sort((a, b) => a.offsetTop - b.offsetTop);
            const expected = sections.filter(section => section.offsetTop <= scrollY + innerHeight * .38).at(-1) || sections[0];
            const current = document.querySelector('.desktop-nav-v2 a[aria-current="location"]');
            return current?.hash === '#' + expected.id;
        })).toBe(true);
        await expect.poll(() => page.evaluate(() => {
            const expected = Math.max(0, Math.min(1, scrollY / (document.documentElement.scrollHeight - innerHeight)));
            const actual = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.reading-progress')).transform).a;
            return Math.abs(actual - expected);
        })).toBeLessThan(.0001);
    };
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#proyectos').offsetTop + 30); });
    await checkPosition();
    const mutations = await page.evaluate(async () => {
        let count = 0;
        const observer = new MutationObserver(records => count += records.length);
        observer.observe(document.querySelector('.desktop-nav-v2'), { subtree: true, attributes: true });
        for (let i = 0; i < 12; i++) { scrollBy(0, 3); await new Promise(resolve => requestAnimationFrame(resolve)); }
        observer.disconnect();
        return count;
    });
    expect(mutations).toBe(0);
    await page.locator('details.trajectory-details > summary').click();
    await expect(page.locator('details.trajectory-details')).toHaveAttribute('open', '');
    // Height animates for 220ms; cached section positions must follow its layout.
    await page.waitForTimeout(300);
    await page.evaluate(() => scrollTo(0, document.querySelector('#publicaciones').offsetTop - innerHeight * .35));
    await checkPosition();
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await checkPosition();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.reading-progress')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('.reading-progress')).toHaveCount(1);
    await checkPosition();
});
