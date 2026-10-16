/**
 * Verifies that every translation key used with a literal in the application sources (templates and code)
 * exists in the English translation file. Keys composed at runtime (e.g. 'enum.chartType.' + type) are not checked.
 *
 * usage: node scripts/check-i18n.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const APP_DIR = 'src/app';
const EN_FILE = 'src/assets/i18n/en.json';
const KEY_PATTERNS = [
   /'([\w-]+(?:\.[\w-]+)+)'\s*\|\s*translate/g,
   /\binstant\(\s*'([\w-]+(?:\.[\w-]+)+)'/g,
   /\bi18nKey\(\s*'([\w-]+(?:\.[\w-]+)+)'/g
];

function sourceFiles(dir) {
   return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
      const path = join(dir, e.name);
      if (e.isDirectory()) {
         return sourceFiles(path);
      }
      return /\.(ts|html)$/.test(e.name) && !e.name.endsWith('.spec.ts') ? [path] : [];
   });
}

function hasKey(translations, key) {
   const value = key.split('.').reduce((obj, k) => obj?.[k], translations);
   return typeof value === 'string';
}

const english = JSON.parse(readFileSync(EN_FILE, 'utf8'));
const missing = [];
for (const file of sourceFiles(APP_DIR)) {
   const content = readFileSync(file, 'utf8');
   for (const pattern of KEY_PATTERNS) {
      for (const match of content.matchAll(pattern)) {
         if (!hasKey(english, match[1])) {
            missing.push(`${file}: ${match[1]}`);
         }
      }
   }
}

if (missing.length) {
   console.error(`${missing.length} translation key(s) missing in ${EN_FILE}:\n` + missing.join('\n'));
   process.exit(1);
}
console.log('all literal translation keys exist in ' + EN_FILE);
