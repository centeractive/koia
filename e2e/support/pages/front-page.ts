import { expect, Locator, Page } from '@playwright/test';
import type { ConnectionInfo } from 'app/shared/model/connection-info.type';
import { Route } from 'app/shared/model/route.enum';
import { Language } from 'app/shared/services/language/language';
import { QueryParamExtractor } from 'app/shared/utils/query-param-extractor';

export class FrontPage {

   readonly storage: Locator;
   readonly couchDBTip: Locator;
   readonly couchDBTipTitle: Locator;
   private readonly startButton: Locator;

   constructor(private readonly page: Page) {
      this.storage = page.locator('.front-storage-line > span');
      this.couchDBTip = page.locator('.front-couchdb-tip');
      this.couchDBTipTitle = page.locator('#front-couchdb-tip-title');
      this.startButton = page.locator('#start_button');
   }

   /**
    * @param language when omitted, the stored or the browser language applies
    */
   async open(language?: Language): Promise<void> {
      await this.page.goto('/' + Route.FRONT + (language ? '?lang=' + language : ''));
      await this.waitUntilReady();
   }

   async reload(): Promise<void> {
      await this.page.reload();
      await this.waitUntilReady();
   }

   async openScene(connection: ConnectionInfo, sceneId: string): Promise<void> {
      const params = new URLSearchParams({
         [QueryParamExtractor.PROTOCOL]: connection.protocol,
         [QueryParamExtractor.HOST]: connection.host,
         [QueryParamExtractor.PORT]: String(connection.port),
         [QueryParamExtractor.USER]: connection.user,
         [QueryParamExtractor.PASSWORD]: btoa(connection.password),
         [QueryParamExtractor.SCENE_ID]: sceneId
      });
      await this.page.goto('/' + Route.FRONT + '?' + params);
      await this.page.waitForURL('**/' + Route.RAWDATA);
   }

   async connectToCouchDB(): Promise<void> {
      await this.page.locator('#connect_couchdb_button').click();
   }

   async dismissCouchDBTip(): Promise<void> {
      await this.couchDBTip.locator('.front-couchdb-tip-dismiss').click();
      await this.couchDBTip.waitFor({ state: 'detached' });
   }

   async startWithFile(): Promise<void> {
      await this.startButton.click();
      await this.page.waitForURL('**/' + Route.SCENE);
   }

   async continueWithScenes(): Promise<void> {
      await this.startButton.click();
      await this.page.waitForURL('**/' + Route.SCENES);
   }

   async openSample(): Promise<void> {
      await this.page.locator('#sample_button').click();
      await this.page.waitForURL('**/' + Route.RAWDATA);
   }

   private async waitUntilReady(): Promise<void> {
      await expect(this.startButton).toHaveAttribute('aria-disabled', 'false');
   }
}
