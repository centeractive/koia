import { Locator } from '@playwright/test';
import { Route } from 'app/shared/model/route.enum';

export class NavButtons {

   constructor(private readonly root: Locator) {
   }

   async openFront(): Promise<void> {
      await this.root.locator('#butHome').click();
      await this.root.page().waitForURL('**/' + Route.FRONT);
   }
}
