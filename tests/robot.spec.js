import { test, expect } from '@playwright/test';
import { createRobotMotion } from '../js/hero/robot-motion.js';

test('grasp keeps the cube between the fingers, preserves link lengths and reverses without jumps', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Platform-independent kinematics.');
    const robot = createRobotMotion();
    const expectedLengths = [Math.hypot(.65, 1.55), Math.hypot(1.45, .6), Math.hypot(.5, 1)];
    let previous;
    const forward = [];
    for (let i = 0; i <= 1000; i++) {
        const pose = robot.update(i / 1000), j = pose.joints;
        for (let link = 0; link < 3; link++) {
            const a = link * 3, b = a + 3;
            expect(Math.hypot(j[b] - j[a], j[b + 1] - j[a + 1], j[b + 2] - j[a + 2])).toBeCloseTo(expectedLengths[link], 5);
        }
        expect(pose.cube[1] - .17).toBeGreaterThanOrEqual(.019);
        expect(pose.grip[1] + .02 - .18).toBeGreaterThanOrEqual(.029);
        if (pose.held) {
            expect([...pose.cube]).toEqual([...pose.grip]);
            expect(pose.opening - .075 / 2).toBeCloseTo(.17, 6);
            expect(pose.cubeYaw).toBe(pose.yaw);
            // Payload clears the pedestal during the horizontal transfer.
            if (i > 780 && i < 850) expect(pose.cube[1] - .17).toBeGreaterThan(.44);
        }
        if (previous) expect(Math.hypot(...pose.cube.map((value, k) => value - previous[k]))).toBeLessThan(.06);
        previous = [...pose.cube];
        forward.push(JSON.stringify(pose));
    }
    expect([...robot.update(0).cube]).not.toEqual([...robot.update(1).cube]);
    for (let i = 1000; i >= 0; i--) expect(JSON.stringify(robot.update(i / 1000))).toBe(forward[i]);
    expect(JSON.stringify(robot.update(.5, true))).toBe(forward[1000]);
});

test('scroll shows pickup, carrying and the placed cube with the matching hologram', async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    await page.locator('.hero-world').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    for (const [name, progress] of [['grasp', .73], ['carry', .815], ['place', .90], ['complete', 1]]) {
        await page.evaluate(t => {
            document.documentElement.style.scrollBehavior = 'auto';
            const hero = document.querySelector('.hero-v2'), stage = document.querySelector('.hero-stage');
            const world = document.querySelector('.hero-world');
            const height = document.querySelector('.hero-viewport-measure').clientHeight;
            const top = world.getBoundingClientRect().top + scrollY;
            const start = innerWidth > 900 ? hero.offsetTop - Math.min(72, height - stage.offsetHeight) : Math.max(0, top - height * .85);
            const length = innerWidth > 900 ? hero.offsetHeight - stage.offsetHeight : top - height * .30 + world.offsetHeight * .4 - start;
            scrollTo(0, Math.max(0, start + t * length));
        }, progress);
        await page.waitForTimeout(name === 'grasp' ? 1600 : 500);
        await page.locator('.hero-world').screenshot({ path: testInfo.outputPath(`${name}.png`) });
        await expect(page.locator('.hero-v2')).toHaveClass(/has-scene/);
    }
    expect(errors).toEqual([]);
});
