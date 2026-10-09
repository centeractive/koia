import { defineConfig } from 'vitest/config';

export default defineConfig({
   resolve: {
      mainFields: ['browser', 'module', 'main']
   },
   test: {
      fileParallelism: false
   }
});
