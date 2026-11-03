import { Page } from '@playwright/test';
import { FrontPage } from './pages/front-page';
import { ScenesPage } from './pages/scenes-page';

/**
 * the active scene lives in memory only, a new page activates it from the database while the first page completes its writes
 */
export async function activateSceneInNewPage(page: Page, sceneName: string): Promise<void> {
   const front = new FrontPage(page);
   await front.open('en');
   await front.continueWithScenes();
   await new ScenesPage(page).activate(sceneName);
}
