import { SALES_CSV } from './import-files';
import { FrontPage } from './pages/front-page';
import { ScenePage } from './pages/scene-page';
import { ScenesPage } from './pages/scenes-page';

/**
 * imports the sales demo data off camera and opens its scene in the raw data view
 */
export async function openSalesScene(front: FrontPage, scene: ScenePage, scenes: ScenesPage): Promise<void> {
   await front.open('en');
   await front.dismissCouchDBTip();
   await front.startWithFile();
   await scene.detectColumns(SALES_CSV);
   await scene.loadData();
   await scenes.activate(SALES_CSV.name);
}
