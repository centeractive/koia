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
