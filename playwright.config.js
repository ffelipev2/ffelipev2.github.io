import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    workers: 1,
    use: { baseURL: 'http://127.0.0.1:4173', screenshot: 'only-on-failure' },
    webServer: { command: 'node scripts/serve-local.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
    projects: [
        { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
        { name: 'tablet-chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true } },
        { name: 'android-chrome', use: { ...devices['Pixel 7'], channel: 'chrome' } },
        { name: 'ios-webkit', use: { ...devices['iPhone 13'] } },
    ],
});
