import { defineConfig } from '@playwright/test';
import { BASE_URL, WEB_SERVER } from '../support/web-server';

const SIZE = { width: 1280, height: 720 };

export default defineConfig({
   testDir: '.',
   testMatch: '**/*.video.ts',
   outputDir: '../../test-results/videos',
   timeout: 300_000,
   expect: { timeout: 30_000 },
   retries: 0,
   workers: 1,
   use: {
      baseURL: BASE_URL,
      locale: 'en-US',
      viewport: SIZE,
      video: { mode: 'on', size: SIZE, show: { actions: { cursor: 'pointer', duration: 800, style: { title: 'display: none' } } } }
   },
   webServer: WEB_SERVER
});
