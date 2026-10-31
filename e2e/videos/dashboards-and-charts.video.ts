import { ExportFormat } from 'app/shared/model/export-format.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { averageRevenueTourOf, expectAverageRevenueChart } from '../support/average-revenue-tour';
import { downloadOf } from '../support/downloads';
import { expect, test } from '../support/fixtures';
import { DashboardPage } from '../support/pages/dashboard-page';
import { openSalesScene } from '../support/sales-scene';
import { Texts } from '../support/texts';
import { CAPTION_BAND_PX, VideoRecording } from './support/video-recording';

const en = new Texts('en');

test('dashboards and charts', async ({ page, front, scene, scenes, tabBar, dashboard }) => {
   const recording = new VideoRecording(page, 'dashboards-and-charts');
   await openSalesScene(front, scene, scenes);
   recording.markStart();

   await tabBar.addDashboard();
   await recording.caption('A new dashboard starts with this launcher');

   await dashboard.launcher.generateDashboard();
   const gridColumns = await dashboard.generatedGridColumns();
   await recording.caption('Koia can generate a whole dashboard from your data');

   const chart = dashboard.tile(0);
   await chart.expectChartPainted();
   const box = await chart.root.boundingBox();
   await chart.startResizeBy(-2 * (box.width + DashboardPage.GRID_GAP_PX) / gridColumns, 0);
   await expect(dashboard.resizePreview).toBeVisible();
   await recording.caption('Drag the corner of a tile to resize it');
   await chart.release();
   await expect.poll(() => chart.spans()).toEqual({ columns: gridColumns - 2, rows: 1 });
   await recording.caption('Tiles snap to the cells of the grid');

   await chart.configure();
   await expect(chart.root).toBeInViewport({ ratio: 1 });
   const configuredBox = await chart.root.boundingBox();
   expect(configuredBox.y + configuredBox.height).toBeLessThanOrEqual(page.viewportSize().height - CAPTION_BAND_PX);
   await recording.caption('Configure a chart with its settings button');

   for (const step of averageRevenueTourOf(dashboard.sideBar, en)) {
      await step.run();
      await recording.caption(step.caption);
   }
   await expectAverageRevenueChart(chart, dashboard.sideBar, en);

   await dashboard.sideBar.close();

   await downloadOf(page, () => chart.saveAs(en.get('element.saveAs', { format: en.get(EnumLabelKeys.exportFormat(ExportFormat.PNG)) })));
   await recording.caption('Save the chart as PNG image');

   await recording.save();
});
