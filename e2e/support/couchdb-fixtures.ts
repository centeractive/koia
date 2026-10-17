import { test as base } from './fixtures';
import { ConnectionDialog } from './components/connection-dialog';
import { COUCHDB_ORIGIN, CouchDB } from './couchdb';
import { SeededScene } from './seeded-scene';

interface CouchDBFixtures {
   couchDB: CouchDB;
   seededScene: SeededScene;
   connectionDialog: ConnectionDialog;
}

export const test = base.extend<CouchDBFixtures>({
   couchDB: [async ({ baseURL }, use, testInfo) => {
      const couchDB = new CouchDB();
      const unusableReason = await couchDB.unusableReason(new URL(baseURL).origin);
      if (unusableReason && process.env.CI) {
         throw new Error(unusableReason);
      }
      testInfo.skip(!!unusableReason, unusableReason);
      await use(couchDB);
   }, { auto: true }],
   context: async ({ context }, use) => {
      // registered after the base route, hence it takes precedence for CouchDB; the tests never delete, the developer's data stays safe
      await context.route(url => url.origin === COUCHDB_ORIGIN,
         route => route.request().method() === 'DELETE' ? route.abort() : route.continue());
      await use(context);
   },
   seededScene: async ({ couchDB }, use) => {
      const scene = new SeededScene(couchDB);
      try {
         await scene.create();
         await use(scene);
      } finally {
         await scene.remove();
      }
   },
   connectionDialog: async ({ page }, use) => {
      await use(new ConnectionDialog(page));
   }
});

export { expect } from './fixtures';
