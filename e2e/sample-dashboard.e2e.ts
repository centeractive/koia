import { ChartType } from 'app/shared/model/chart/chart-type';
import { StatusType } from 'app/shared/model/status-type.enum';
import { LANGUAGE_NAMES } from 'app/shared/services/language/language';
import { expect, test } from './support/fixtures';
import { chartIndexOf, dashboardTabOf, fruitSalesOf } from './support/fruit-sales-sample';

const TOP_RIGHT_TILE = 1;

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
