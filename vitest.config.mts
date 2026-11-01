import { defineConfig } from 'vitest/config';

export default defineConfig({
   resolve: {
      mainFields: ['browser', 'module', 'main']
   },
   test: {
      fileParallelism: false,
      silent: 'passed-only',
      // below the dynamic port range, where Windows (Hyper-V, WinNAT) reserves port ranges that refuse to listen
      api: { port: 43315 },
      coverage: {
         provider: 'istanbul'
      }
   }
});
