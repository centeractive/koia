import { centerXOf } from '../support/box';
import { DRAGGED_GRAPH_NODE_TOLERANCE_PX } from '../support/components/dashboard-tile';
import { expect, test } from '../support/fixtures';
import { openSalesScene } from '../support/sales-scene';
import { Texts } from '../support/texts';
import { CAPTION_BAND_PX, VideoRecording } from './support/video-recording';

const en = new Texts('en');

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

   await dashboard.sideBar.close();
   await dashboard.freeCanvasButton.click();
   await expect(dashboard.canvasContent).toBeVisible();
   await recording.caption('On the free canvas, tiles take any size and position');

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
   const lemonsOfWest = graph.graphNodes.filter({ hasText: 'Product: Lemons (14)' });
   await graph.hoverGraphNode(west);
   await expect(graph.graphTooltip).toHaveText(tooltipOf(69));
   await recording.caption('Hover a node to see its number of entries');

   await graph.hoverGraphNode(lemonsOfWest);
   await graph.doubleClickGraphNode(lemonsOfWest);
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(14));
   await recording.caption('Double-click a node, e.g. the lemons of West, to see its rows');
   await rawDataDialog.close();

   await dashboard.mainToolbar.addValueFilter('Channel', 'Online');
   const onlineLemonsOfWest = graph.graphNodes.filter({ hasText: 'Product: Lemons (10)' });
   await expect(onlineLemonsOfWest).toHaveCount(1);
   await recording.caption('Filters apply to the dashboard, e.g. online sales');

   await graph.hoverGraphNode(west);
   await expect(graph.graphTooltip).toHaveText(tooltipOf(34));
   await recording.caption('Nodes count the filtered rows only');

   const westStart = centerXOf(await graph.graphNodeBox(west));
   const leafStart = centerXOf(await graph.graphNodeBox(onlineLemonsOfWest));
   const dx = -(westStart - (await graph.root.boundingBox()).x) / 2;
   await graph.startGraphNodeDragBy(west, dx, 0);
   expect(Math.abs(centerXOf(await west.locator('circle').boundingBox()) - (westStart + dx))).toBeLessThanOrEqual(DRAGGED_GRAPH_NODE_TOLERANCE_PX);
   await expect.poll(async () => centerXOf(await onlineLemonsOfWest.locator('circle').boundingBox())).toBeLessThanOrEqual(leafStart - Math.abs(dx) / 2);
   await recording.caption('Drag a node and its branch follows');
   await graph.release();

   await recording.save();
});
