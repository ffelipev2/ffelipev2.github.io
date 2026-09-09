import { expect } from '@playwright/test';

export function heroRange() {
    const hero = document.querySelector('.hero-v2'), stage = document.querySelector('.hero-stage');
    const height = document.querySelector('.hero-viewport-measure').clientHeight;
    if (innerWidth <= 900) {
        const track = document.querySelector('.hero-track'), visual = document.querySelector('.hero-visual');
        return { start: Math.max(0, track.getBoundingClientRect().top + scrollY - Math.min(84, height - visual.offsetHeight - 12)), length: track.offsetHeight - visual.offsetHeight };
    }
    return { start: hero.offsetTop - Math.min(72, height - stage.offsetHeight), length: hero.offsetHeight - stage.offsetHeight };
}

export async function seekHero(page, progress) {
    const range = await page.evaluate(heroRange);
    const expected = await page.evaluate(({ top, start, length }) => {
        document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, Math.max(0, top));
        return Math.max(0, Math.min(1, (scrollY - start) / length));
    }, { top: range.start + progress * range.length, ...range });
    await expect.poll(async () => Math.abs(Number(await page.locator('.hero-canvas').getAttribute('data-phase')) - expected), { timeout: 10000, intervals: [60] }).toBeLessThan(.0001);
}
