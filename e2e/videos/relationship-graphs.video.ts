import { CategoricalColorScheme } from 'app/shared/color/categorical-color-scheme.enum';
import { expect, test } from '../support/fixtures';
import { Texts } from '../support/texts';
import { openSalesScene } from './support/sales-scene';
import { VideoRecording } from './support/video-recording';

const en = new Texts('en');

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
   await dashboard.setGridCellRatio('2:3');
   await graph.setColumnSpan(en.get('element.columns', { count: 3 }));
   await recording.caption('Give the graph room to arrange its nodes');

   await graph.hoverGraphNode(graph.graphNodes.filter({ hasText: 'Region: West' }));
   await expect(graph.graphTooltip).toHaveText('Region: West ' + en.get('graph.tooltip.entries', { count: en.number(69) })
      + en.get('graph.tooltip.doubleClick'));
   await recording.caption('Hover a node to see its number of entries');

   const westLemons = graph.graphNodes.filter({ hasText: 'Product: Lemons (14)' });
   await graph.hoverGraphNode(westLemons);
   await graph.doubleClickGraphNode(westLemons);
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(14));
   await recording.caption('Double-click a node to see its rows');

   await rawDataDialog.close();
   await recording.save();
});
