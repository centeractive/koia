import type { Page, Request } from '@playwright/test';
import { StatusType } from 'app/shared/model/status-type.enum';
import { CouchDBConfig } from 'app/shared/services/backend/couchdb/couchdb-config';
import { QueryParamExtractor } from 'app/shared/utils/query-param-extractor';
import { COUCHDB_CONNECTION, COUCHDB_ORIGIN, presetConnectionInfo } from './support/couchdb';
import { expect, test } from './support/fixtures';
import { Texts } from './support/texts';

const INTROS = ['/intro/index.html', '/intro/index.de.html', '/intro/index.ja.html'];
const LAUNCH = { connection: { ...COUCHDB_CONNECTION, user: 'a&b', password: '>?>' }, sceneId: 'scene1' };
const en = new Texts('en');
const de = new Texts('de');

function couchDBRequestsOf(page: Page): Request[] {
   const couchRequests: Request[] = [];
   page.on('request', request => {
      if (new URL(request.url()).origin === COUCHDB_ORIGIN) {
         couchRequests.push(request);
      }
   });
   return couchRequests;
}

async function authorizationsOf(requests: Request[]): Promise<string[]> {
   return (await Promise.all(requests.map(request => request.allHeaders()))).map(headers => headers['authorization']);
}

test('app pages and launch request no hosts other than app and CouchDB and send no password in URLs', async ({ page, front, notifications, baseURL }) => {
   const urls: URL[] = [];
   page.on('request', request => urls.push(new URL(request.url())));

   await front.open('en');
   await front.openSample();
   await front.launch(LAUNCH.connection, LAUNCH.sceneId);

   expect(await notifications.dismiss(StatusType.ERROR)).toContain(en.get('front.externalInvocationFailed', { id: LAUNCH.sceneId }));
   const httpUrls = urls.filter(url => url.protocol === 'http:' || url.protocol === 'https:');
   expect([...new Set(httpUrls.map(url => url.origin))].sort()).toEqual([new URL(baseURL).origin, COUCHDB_ORIGIN].sort());
   expect(httpUrls.filter(url => url.searchParams.has(QueryParamExtractor.PASSWORD) || url.href.includes('Pj8'))).toEqual([]);
});

test('launch through URL fragment authorizes CouchDB requests with user and password of fragment', async ({ page, front, notifications }) => {
   const couchRequests = couchDBRequestsOf(page);

   await front.launch(LAUNCH.connection, LAUNCH.sceneId);
   await notifications.dismiss(StatusType.ERROR);

   expect(await authorizationsOf(couchRequests)).toContain('Basic ' + btoa(LAUNCH.connection.user + ':' + LAUNCH.connection.password));
});

for (const separator of ['#', '?'] as const) {
   test(`launch authorizes CouchDB requests with UTF-8 encoded non-ASCII password (${separator})`, async ({ page, front, notifications }) => {
      const connection = { ...LAUNCH.connection, user: 'ü', password: 'pä日本+' };
      const couchRequests = couchDBRequestsOf(page);

      await front.launch(connection, LAUNCH.sceneId, { separator });
      await notifications.dismiss(StatusType.ERROR);

      const expected = 'Basic ' + Buffer.from(connection.user + ':' + connection.password, 'utf-8').toString('base64');
      expect(await authorizationsOf(couchRequests)).toContain(expected);
   });
}

test('launch with invalid port shows error and leaves no credentials in address bar', async ({ page, front, notifications }) => {
   await front.launch({ ...LAUNCH.connection, port: 0 }, LAUNCH.sceneId);

   const error = await notifications.dismiss(StatusType.ERROR);
   expect(error).toContain(en.get('front.externalInvocationFailed', { id: LAUNCH.sceneId }));
   expect(error).toContain('invalid port: 0');
   const url = new URL(page.url());
   expect([url.pathname, url.search, url.hash]).toEqual(['/front', '', '']);
});

test('failed launch keeps saved connection and leaves no credentials in address bar', async ({ context, page, front, notifications }) => {
   const saved = { ...COUCHDB_CONNECTION, user: 'saved' };
   await presetConnectionInfo(context, saved);

   await front.launch(LAUNCH.connection, LAUNCH.sceneId);
   await notifications.dismiss(StatusType.ERROR);

   const url = new URL(page.url());
   expect([url.pathname, url.search, url.hash]).toEqual(['/front', '', '']);
   expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), CouchDBConfig.CONN_INFO_NAME)).toEqual(saved);
   expect(await page.evaluate(key => sessionStorage.getItem(key), CouchDBConfig.SESSION_CONN_INFO_NAME)).toBeNull();
});

test('launch through URL fragment shows its messages in language of query', async ({ front, notifications }) => {
   await front.launch(LAUNCH.connection, LAUNCH.sceneId, { language: 'de' });

   expect(await notifications.dismiss(StatusType.ERROR)).toContain(de.get('front.externalInvocationFailed', { id: LAUNCH.sceneId }));
});

test('intros request no third-party host other than google tag', async ({ page, baseURL }) => {
   const urls: URL[] = [];
   page.on('request', request => urls.push(new URL(request.url())));

   for (const intro of INTROS) {
      await page.goto(intro);
   }

   const hostnames = urls.filter(url => url.protocol === 'http:' || url.protocol === 'https:').map(url => url.hostname);
   expect([...new Set(hostnames)].sort()).toEqual([new URL(baseURL).hostname, 'www.googletagmanager.com'].sort());
});

test('front page renders icons with self-hosted material icons font', async ({ page, front }) => {
   await front.open('en');

   await expect.poll(() => page.evaluate(() => [...document.fonts]
      .some(f => f.family.replace(/"/g, '') === 'Material Icons' && f.status === 'loaded'))).toBe(true);
});
