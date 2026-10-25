import { SORT_INDICATORS } from 'app/raw-data/sort-indicators';
import { CategoricalColorScheme } from 'app/shared/color/categorical-color-scheme.enum';
import { expect, test } from '../support/fixtures';
import { openSalesScene } from '../support/sales-scene';
import { Texts } from '../support/texts';
import { CAPTION_BAND_PX, VideoRecording } from './support/video-recording';

const en = new Texts('en');
const REVENUE = 'Revenue';

function tooltipOf(entries: number): string {
   return 'Region: West ' + en.get('graph.tooltip.entries', { count: en.number(entries) }) + en.get('graph.tooltip.doubleClick');
}

test('relationship graphs', async ({ page, front, scene, scenes, tabBar, dashboard, rawDataDialog }) => {
   const recording = new VideoRecording(page, 'relationship-graphs');
   await openSalesScene(front, scene, scenes);
   recording.markStart();

   await tabBar.addDashboard();
   await dashboard.launcher.addGraph();
   const graph = dashboard.tile(0);
   await graph.graphRootNode.waitFor();
   await recording.caption('Add a relationship graph to the dashboard');

   await dashboard.sideBar.dragGroupByColumn('Product');
   await expect(graph.graphNodes).toHaveCount(7);
   await recording.caption('Drag a column into the data hierarchy, e.g. Product');

   await dashboard.sideBar.dragGroupByColumn('Region');
   await expect(graph.graphNodes).toHaveCount(29);
   await recording.caption('Drop Region on top to group the products by region');

   await dashboard.sideBar.selectColorScheme(CategoricalColorScheme.SET_1);
   await recording.caption('Pick a color scheme');

   await dashboard.sideBar.close();
   await dashboard.freeCanvasButton.click();
   await expect(dashboard.canvasContent).toBeVisible();
   await recording.caption('Switch to the free canvas to place tiles freely');

   const sheet = await dashboard.canvasPageContent.boundingBox();
   const box = await graph.root.boundingBox();
   await graph.startResizeBy(sheet.x + sheet.width - (box.x + box.width), page.viewportSize().height - CAPTION_BAND_PX - (box.y + box.height));
   await expect(dashboard.resizePreview).toBeVisible();
   await recording.caption('Drag the corner to give the graph more room');
   await graph.release();
   await expect(dashboard.resizePreview).toHaveCount(0);
   await expect(graph.root).toBeInViewport({ ratio: 1 });
   await recording.caption('The graph arranges its nodes in the new space');

   const west = graph.graphNodes.filter({ hasText: 'Region: West' });
   await graph.hoverGraphNode(west);
   await expect(graph.graphTooltip).toHaveText(tooltipOf(69));
   await recording.caption('Hover a node to see its number of entries');

   const westLemons = graph.graphNodes.filter({ hasText: 'Product: Lemons (14)' });
   await graph.hoverGraphNode(westLemons);
   await graph.doubleClickGraphNode(westLemons);
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(14));
   await recording.caption('Double-click a node to see its rows');

   await rawDataDialog.table.sortBy(REVENUE);
   await expect(rawDataDialog.table.sortIndicator(REVENUE)).toHaveText(SORT_INDICATORS.asc);
   await recording.caption('Click a header to sort the rows');
   await rawDataDialog.close();

   await dashboard.mainToolbar.addValueFilter('Channel', 'Online');
   await expect(graph.graphNodes.filter({ hasText: 'Product: Lemons (10)' })).toHaveCount(1);
   await recording.caption('Filters apply to the dashboard, e.g. online sales');

   await graph.hoverGraphNode(west);
   await expect(graph.graphTooltip).toHaveText(tooltipOf(34));
   await recording.caption('Nodes count the filtered rows only');

   await recording.save();
});
