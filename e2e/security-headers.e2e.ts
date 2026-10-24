import { readFileSync } from 'fs';
import { resolve } from 'path';
import { expect, test } from './support/fixtures';
import { SRC_DIR } from './support/paths';

const SECURITY_HEADERS: Record<string, string> = {
   'X-Content-Type-Options': 'nosniff',
   'X-Frame-Options': 'SAMEORIGIN',
   'Content-Security-Policy': "frame-ancestors 'self'",
   'Referrer-Policy': 'same-origin'
};

test('web.config sets security headers', () => {
   const webConfig = readFileSync(resolve(SRC_DIR, 'web.config'), 'utf-8');

   for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      const remove = '<remove name="' + name + '" />';
      const removeEnd = webConfig.indexOf(remove) + remove.length;
      const addStart = webConfig.indexOf('<add name="' + name + '" value="' + value + '" />');
      expect(webConfig.indexOf(remove)).toBeGreaterThanOrEqual(0);
      expect(addStart).toBeGreaterThan(removeEnd);
      expect(webConfig.slice(removeEnd, addStart).trim()).toBe('');
   }
});

test('.htaccess sets security headers', () => {
   const htaccess = readFileSync(resolve(SRC_DIR, '.htaccess'), 'utf-8');
   const headersModule = /<IfModule mod_headers\.c>([\s\S]*?)<\/IfModule>/.exec(htaccess)[1];

   for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(headersModule).toContain('Header always set ' + name + ' "' + value + '"');
   }
});
