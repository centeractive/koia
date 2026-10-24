import { ChartType } from 'app/shared/model/chart/chart-type';
import { StatusType } from 'app/shared/model/status-type.enum';
import { LANGUAGE_NAMES } from 'app/shared/services/language/language';
import { expect, test } from './support/fixtures';
import { chartIndexOf, dashboardTabOf, fruitSalesOf, graphIndexOf, pivotTabOf } from './support/fruit-sales-sample';
import { Texts } from './support/texts';

const TOP_RIGHT_TILE = 1;
const en = new Texts('en');

for (const language of ['de', 'ja'] as const) {
   test(`${LANGUAGE_NAMES[language]} sample dashboard shows the top right chart without warning`, async ({ front, tabBar, dashboard, notifications }) => {
      const dashboardTab = dashboardTabOf(fruitSalesOf(language));
      await front.open(language);
      await front.openSample();

      await tabBar.open(dashboardTab.id);

      await expect(dashboard.tile(TOP_RIGHT_TILE).title).toHaveValue(dashboardTab.view.elements[TOP_RIGHT_TILE].title);
      await dashboard.tile(TOP_RIGHT_TILE).expectChartPainted();
      await expect(notifications.pane(StatusType.WARNING)).toHaveCount(0);
   });
}

test('English sample dashboard shows the top right chart without warning after switching to German', async ({ front, languageSelect, tabBar, dashboard, notifications }) => {
   const dashboardTab = dashboardTabOf(fruitSalesOf('en'));
   await front.open('en');
   await front.openSample();
   await languageSelect.switchTo('de');

   await tabBar.open(dashboardTab.id);

   await expect(dashboard.tile(TOP_RIGHT_TILE).title).toHaveValue(dashboardTab.view.elements[TOP_RIGHT_TILE].title);
   await dashboard.tile(TOP_RIGHT_TILE).expectChartPainted();
   await expect(notifications.pane(StatusType.WARNING)).toHaveCount(0);
});

test('configure button of the sample doughnut chart selects its type and switching to pie keeps it painted', async ({ front, tabBar, dashboard }) => {
   const dashboardTab = dashboardTabOf(fruitSalesOf('en'));
   const doughnut = chartIndexOf(dashboardTab, ChartType.DOUGHNUT);
   await front.open('en');
   await front.openSample();
   await tabBar.open(dashboardTab.id);

   await dashboard.tile(doughnut).configure();
   await expect(dashboard.sideBar.chartTypeButton(ChartType.DOUGHNUT)).toHaveClass(/\bmat-accent\b/);
   await dashboard.sideBar.switchChartType(ChartType.PIE);

   await expect(dashboard.sideBar.chartTypeButton(ChartType.PIE)).toHaveClass(/\bmat-accent\b/);
   await dashboard.tile(doughnut).expectChartPainted();
});

test('double click on a product node of the sample graph reveals the rows of its region, channel and product', async ({ front, tabBar, dashboard, rawDataDialog }) => {
   const dashboardTab = dashboardTabOf(fruitSalesOf('en'));
   await front.open('en');
   await front.openSample();
   await tabBar.open(dashboardTab.id);
   const tile = dashboard.tile(graphIndexOf(dashboardTab));
   const node = tile.graphNodes.filter({ hasText: /^Product: / }).first();
   const count = /\(([^)]*)\)$/.exec(await node.textContent())[1];

   await tile.doubleClickGraphNode(node);

   await expect(rawDataDialog.table.rowCount).toHaveText(en.get('ui.rows', { count }));
});

test('graph of dashboard tab resized while hidden is centered when shown again', async ({ page, front, tabBar, dashboard, pivot }) => {
   const sample = fruitSalesOf('en');
   const dashboardTab = dashboardTabOf(sample);
   const graphTile = dashboard.tile(graphIndexOf(dashboardTab));
   await front.open('en');
   await front.openSample();
   await tabBar.open(dashboardTab.id);
   await graphTile.graphRootNode.waitFor();
   await tabBar.open(pivotTabOf(sample).id);
   await pivot.valueCells.first().waitFor();
   await page.setViewportSize({ width: 1400, height: 1000 });

   await tabBar.open(dashboardTab.id);

   await expect.poll(async () => {
      const node = await graphTile.graphRootNode.boundingBox();
      const area = await graphTile.graphArea.boundingBox();
      const x = node.x + node.width / 2;
      const y = node.y + node.height / 2;
      return x > area.x + area.width / 4 && x < area.x + area.width * 3 / 4 &&
         y > area.y + area.height / 4 && y < area.y + area.height * 3 / 4;
   }).toBe(true);
});
