import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 4300);
const BASE_URL = 'http://localhost:' + PORT;
const COUCHDB_TESTS = '**/*.couchdb.e2e.ts';
const DESKTOP_CHROME = { ...devices['Desktop Chrome'], viewport: { width: 1512, height: 812 } };

export default defineConfig({
   testDir: '.',
   testMatch: '**/*.e2e.ts',
   outputDir: '../test-results/e2e',
   timeout: 120_000,
   expect: { timeout: 30_000 },
   forbidOnly: !!process.env.CI,
   retries: 0,
   workers: 1,
   reporter: [['list'], ['junit', { outputFile: '../test-results/e2e-junit.xml' }]],
   use: {
      baseURL: BASE_URL,
      locale: 'en-US',
      trace: 'retain-on-failure'
   },
   projects: [
      { name: 'chromium', testIgnore: COUCHDB_TESTS, use: DESKTOP_CHROME },
      { name: 'couchdb', testMatch: COUCHDB_TESTS, use: DESKTOP_CHROME }
   ],
   webServer: {
      command: 'npm start -- --port ' + PORT,
      cwd: '..',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000
   }
});
