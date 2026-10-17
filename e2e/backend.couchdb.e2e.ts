import { SORT_INDICATORS } from 'app/raw-data/sort-indicators';
import { StatusType } from 'app/shared/model/status-type.enum';
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

test('invocation with CouchDB query parameters shows the raw data of the scene', async ({ seededScene, front, rawData }) => {
   await front.openScene(COUCHDB_CONNECTION, seededScene.id);

   await expect(rawData.table.rowCount).toHaveText(texts.rows(seededScene.entryCount));
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
