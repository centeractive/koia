import { resolve } from 'path';

const PORT = Number(process.env.E2E_PORT ?? 4300);

export const BASE_URL = 'http://localhost:' + PORT;

export const WEB_SERVER = {
   command: 'npm start -- --port ' + PORT,
   cwd: resolve(__dirname, '../..'),
   url: BASE_URL,
   reuseExistingServer: !process.env.CI,
   timeout: 300_000
};
