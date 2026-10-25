import { expect, test } from './support/fixtures';
import { Texts } from './support/texts';

const en = new Texts('en');

test('front page stores data in this browser and recommends CouchDB', async ({ front }) => {
   await front.open('en');

   await expect(front.storage).toHaveText(en.get('front.storage.storedIn') + ' ' + en.get('front.storage.thisBrowser'));
   await expect(front.couchDBTipTitle).toHaveText(en.get('front.couchdbTip.title'));
});

test('dismissed CouchDB tip stays hidden after reloading the front page', async ({ front }) => {
   await front.open('en');

   await front.dismissCouchDBTip();
   await front.reload();

   await expect(front.couchDBTip).toHaveCount(0);
});

test('connection dialog offers remembering the password for remote hosts only', async ({ front, connectionDialog }) => {
   await front.open('en');
   await front.connectToCouchDB();
   await expect(connectionDialog.rememberPassword).toHaveCount(0);

   await connectionDialog.typeHost('couch.example.com');

   await expect(connectionDialog.rememberPassword).toBeVisible();
   await expect(connectionDialog.rememberPassword).not.toBeChecked();
   await expect(connectionDialog.riskNote).toHaveText(en.get('front.connection.rememberPasswordRisk'));
   await connectionDialog.cancel();
});

test('home button leads back to the front page which continues with the scenes', async ({ front, rawData, scenes }) => {
   await front.open('en');
   await front.openSample();

   await rawData.mainToolbar.openFront();
   await front.continueWithScenes();

   await expect(scenes.rows).toHaveCount(1);
});
