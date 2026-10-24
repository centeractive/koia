import type { Request } from '@playwright/test';
import { StatusType } from 'app/shared/model/status-type.enum';
import { QueryParamExtractor } from 'app/shared/utils/query-param-extractor';
import { COUCHDB_CONNECTION, COUCHDB_ORIGIN } from './support/couchdb';
import { expect, test } from './support/fixtures';
import { Texts } from './support/texts';

const INTROS = ['/intro/index.html', '/intro/index.de.html', '/intro/index.ja.html'];
const LAUNCH = { connection: { ...COUCHDB_CONNECTION, user: 'a&b', password: '>?>' }, sceneId: 'scene1' };
const en = new Texts('en');
const de = new Texts('de');

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
   const couchRequests: Request[] = [];
   page.on('request', request => {
      if (new URL(request.url()).origin === COUCHDB_ORIGIN) {
         couchRequests.push(request);
      }
   });

   await front.launch(LAUNCH.connection, LAUNCH.sceneId);
   await notifications.dismiss(StatusType.ERROR);

   const authorizations = (await Promise.all(couchRequests.map(request => request.allHeaders()))).map(headers => headers['authorization']);
   expect(authorizations).toContain('Basic ' + btoa(LAUNCH.connection.user + ':' + LAUNCH.connection.password));
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
