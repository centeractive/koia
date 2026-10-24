import { SORT_INDICATORS } from 'app/raw-data/sort-indicators';
import { StatusType } from 'app/shared/model/status-type.enum';
import { CouchDBConfig } from 'app/shared/services/backend/couchdb/couchdb-config';
import { DEFAULT_LANGUAGE } from 'app/shared/services/language/language';
import { COUCHDB_CONNECTION, COUCHDB_STORAGE, COUCHDB_URL, presetConnectionInfo } from './support/couchdb';
import { expect, test } from './support/couchdb-fixtures';
import { Texts } from './support/texts';

const texts = new Texts(DEFAULT_LANGUAGE);
const UNREACHABLE_PORT = COUCHDB_CONNECTION.port + 1;
const RENAMED_TAB_TITLE = 'Revenue by region';

test('connecting through the connection dialog switches the data storage to CouchDB', async ({ context, front, connectionDialog, notifications }) => {
   await presetConnectionInfo(context, { ...COUCHDB_CONNECTION, port: UNREACHABLE_PORT });
   await front.open(DEFAULT_LANGUAGE);

   await front.connectToCouchDB();
   await connectionDialog.connectToPort(COUCHDB_CONNECTION.port);

   await expect(notifications.pane(StatusType.SUCCESS)).toContainText(COUCHDB_URL);
   await expect(front.storage).toHaveText(texts.get('front.storage.storedIn') + ' ' + COUCHDB_STORAGE);
});

test('invocation with CouchDB parameters in URL fragment shows the raw data of the scene', async ({ seededScene, front, rawData }) => {
   await front.openScene(COUCHDB_CONNECTION, seededScene.id);

   await expect(rawData.table.rowCount).toHaveText(texts.rows(seededScene.entryCount));
});

test('invocation with CouchDB query parameters of released launchers shows the raw data of the scene', async ({ seededScene, front, rawData }) => {
   await front.openScene(COUCHDB_CONNECTION, seededScene.id, { separator: '?', language: DEFAULT_LANGUAGE });

   await expect(rawData.table.rowCount).toHaveText(texts.rows(seededScene.entryCount));
});

test('launch replaces its URL in history and keeps saved connection', async ({ context, page, seededScene, front, rawData }) => {
   const saved = { ...COUCHDB_CONNECTION, user: 'saved' };
   await presetConnectionInfo(context, saved);
   await front.open(DEFAULT_LANGUAGE);
   const historyLength = await page.evaluate(() => history.length);

   await front.openScene(COUCHDB_CONNECTION, seededScene.id);
   await expect(rawData.table.rowCount).toHaveText(texts.rows(seededScene.entryCount));

   expect(await page.evaluate(() => history.length)).toBe(historyLength + 1);
   expect(new URL(page.url()).hash).toBe('');
   expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), CouchDBConfig.CONN_INFO_NAME)).toEqual(saved);
   expect(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).user, CouchDBConfig.SESSION_CONN_INFO_NAME))
      .toBe(COUCHDB_CONNECTION.user);
   await page.goBack();
   const url = new URL(page.url());
   expect([url.pathname, url.search, url.hash]).toEqual(['/front', '?lang=' + DEFAULT_LANGUAGE, '']);
});

test('invocation with scene violating its scene format shows the violation', async ({ seedScene, front, notifications }) => {
   const scene = await seedScene({ schemaVersion: '1.0', database: '' });

   await front.launch(COUCHDB_CONNECTION, scene.id);

   expect(await notifications.dismiss(StatusType.ERROR))
      .toContain(texts.get('sceneFormat.invalid', { version: '1.0', errors: '/database: must NOT have fewer than 1 characters' }));
});

test('invocation with unsupported scene format shows supported versions', async ({ seedScene, front, notifications }) => {
   const scene = await seedScene({ schemaVersion: '9.0' });

   await front.launch(COUCHDB_CONNECTION, scene.id);

   expect(await notifications.dismiss(StatusType.ERROR)).toContain(texts.get('sceneFormat.unsupportedVersion', { version: '9.0', supported: '1.0' }));
});

test('sorting raw data informs about the CouchDB sort limitation', async ({ seededScene, front, rawData, confirmDialog }) => {
   const column = seededScene.columnNames[0];
   await front.openScene(COUCHDB_CONNECTION, seededScene.id);

   await rawData.table.sortBy(column);
   const message = await confirmDialog.confirm();

   expect(message).toBe(texts.get('dialog.couchDbSortLimitation'));
   await expect(rawData.table.sortIndicator(column)).toHaveText(SORT_INDICATORS.asc);
});

test('a renamed pivot table tab is restored from CouchDB after reloading the app', async ({ seededScene, front, scenes, tabBar }) => {
   await front.openScene(COUCHDB_CONNECTION, seededScene.id);
   await tabBar.addPivotTable();
   await tabBar.rename(tabBar.lastTab(), RENAMED_TAB_TITLE);
   await expect.poll(() => seededScene.tabTitles()).toEqual([RENAMED_TAB_TITLE]);

   await front.open(DEFAULT_LANGUAGE);
   await front.continueWithScenes();
   await scenes.activate(seededScene.name);

   await expect(tabBar.titles).toHaveText([RENAMED_TAB_TITLE]);
});
