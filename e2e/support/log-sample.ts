import { FrontPage } from './pages/front-page';

/**
 * opens the app logs sample off camera in the raw data view
 */
export async function openLogSampleScene(front: FrontPage): Promise<void> {
   await front.open('en');
   await front.dismissCouchDBTip();
   await front.openLogSample();
}
