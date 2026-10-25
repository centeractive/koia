import { SALES_CSV } from '../../support/import-files';
import { FrontPage } from '../../support/pages/front-page';
import { ScenePage } from '../../support/pages/scene-page';
import { ScenesPage } from '../../support/pages/scenes-page';

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
