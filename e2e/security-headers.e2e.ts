import { existsSync, globSync, readdirSync, readFileSync, statSync } from 'fs';
import { basename, resolve } from 'path';
import { expect, test } from './support/fixtures';
import { jsonOf, SRC_DIR } from './support/paths';

const REPO_DIR = resolve(SRC_DIR, '..');

const SECURITY_HEADERS: Record<string, string> = {
   'X-Content-Type-Options': 'nosniff',
   'X-Frame-Options': 'SAMEORIGIN',
   'Content-Security-Policy': "frame-ancestors 'self'",
   'Referrer-Policy': 'same-origin'
};

const HASHED_FILE_NAMES = [
   'main-INBZAAAW.js',
   'polyfills-LVNOU2XZ.js',
   'scripts-QXMAF4YF.js',
   'styles-HALEY33S.css',
   'chunk-BoaAsYvA.js',
   'chunk-a_B-cD3e.js',
   'material-icons-LEZCGFVT.woff2',
   'material-icons-JLIDJUWE.woff'
];

type AssetEntry = string | { glob: string, input: string, output: string };

function webConfig(): string {
   return readFileSync(resolve(SRC_DIR, 'web.config'), 'utf-8');
}

function htaccessHeadersModule(): string {
   const htaccess = readFileSync(resolve(SRC_DIR, '.htaccess'), 'utf-8');
   return /<IfModule mod_headers\.c>([\s\S]*?)<\/IfModule>/.exec(htaccess)[1];
}

function filesMatchSections(): { section: string, pattern: string, body: string }[] {
   return [...htaccessHeadersModule().matchAll(/<FilesMatch "([^"]+)">([\s\S]*?)<\/FilesMatch>/g)]
      .map(match => ({ section: match[0], pattern: match[1], body: match[2] }));
}

function filesOf(path: string): string[] {
   if (!existsSync(path)) {
      throw new Error(path + ' does not exist');
   }
   if (statSync(path).isFile()) {
      return [path];
   }
   return readdirSync(path).flatMap(child => filesOf(resolve(path, child)));
}

function assetFileNames(): string[] {
   const angular = jsonOf<{ projects: { koia: { architect: { build: { options: { assets: AssetEntry[] } } } } } }>(resolve(REPO_DIR, 'angular.json'));
   const assets: AssetEntry[] = angular.projects.koia.architect.build.options.assets;
   return assets.flatMap(asset => typeof asset === 'string'
      ? filesOf(resolve(REPO_DIR, asset))
      : globSync(asset.glob, { cwd: resolve(REPO_DIR, asset.input) }))
      .map(path => basename(path));
}

test('web.config sets security headers', () => {
   const config = webConfig();

   for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      const remove = '<remove name="' + name + '" />';
      const removeEnd = config.indexOf(remove) + remove.length;
      const addStart = config.indexOf('<add name="' + name + '" value="' + value + '" />');
      expect(config.indexOf(remove)).toBeGreaterThanOrEqual(0);
      expect(addStart).toBeGreaterThan(removeEnd);
      expect(config.slice(removeEnd, addStart).trim()).toBe('');
   }
});

test('web.config serves webm as video/webm', () => {
   const config = webConfig();
   const remove = '<remove fileExtension=".webm" />';
   const removeEnd = config.indexOf(remove) + remove.length;
   const mimeMapStart = config.indexOf('<mimeMap fileExtension=".webm" mimeType="video/webm" />');

   expect(config.indexOf(remove)).toBeGreaterThanOrEqual(0);
   expect(mimeMapStart).toBeGreaterThan(removeEnd);
   expect(config.slice(removeEnd, mimeMapStart).trim()).toBe('');
});

test('web.config disables client caching of static content', () => {
   const config = webConfig();
   const clientCache = config.indexOf('<clientCache cacheControlMode="DisableCache" />');

   expect(clientCache).toBeGreaterThan(config.indexOf('<staticContent>'));
   expect(clientCache).toBeLessThan(config.indexOf('</staticContent>'));
});

test('.htaccess sets security headers', () => {
   const headersModule = htaccessHeadersModule();

   for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(headersModule).toContain('Header always set ' + name + ' "' + value + '"');
   }
});

test('.htaccess makes browsers revalidate unhashed files', () => {
   const sections = filesMatchSections();

   expect(sections).toHaveLength(1);
   expect(htaccessHeadersModule().replace(sections[0].section, '')).toContain('Header always set Cache-Control "no-cache"');
});

test('.htaccess caches hashed bundles immutably', () => {
   const [{ body }] = filesMatchSections();

   expect(body).toContain('Header always set Cache-Control "public, max-age=31536000, immutable"');
});

test('.htaccess hashed bundle pattern matches hashed file names', () => {
   const pattern = new RegExp(filesMatchSections()[0].pattern);

   for (const fileName of HASHED_FILE_NAMES) {
      expect(fileName).toMatch(pattern);
   }
});

test('.htaccess hashed bundle pattern matches no copied asset', () => {
   const pattern = new RegExp(filesMatchSections()[0].pattern);
   const fileNames = assetFileNames();

   expect(fileNames).toContain('videos.html');
   expect(fileNames).toContain('scene.schema.json');
   expect(fileNames.filter(fileName => pattern.test(fileName))).toEqual([]);
});
