import { defineConfig } from '@playwright/test';
import { RecordingOptions } from '../support/fixtures';
import { RECORDED_VIDEO, VIDEO_SIZE } from '../support/video-options';
import { BASE_URL, WEB_SERVER } from '../support/web-server';

export default defineConfig<RecordingOptions>({
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
      viewport: VIDEO_SIZE,
      video: RECORDED_VIDEO,
      idColumnOffAtFirst: false,
      recordingStyles: true
   },
   webServer: WEB_SERVER
});
