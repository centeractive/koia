import { rowsOf } from 'app/dashboard/generator/generated-grid';
import { ChartType } from 'app/shared/model/chart/chart-type';
import { DataType } from 'app/shared/model/data-type.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { ExportFormat } from 'app/shared/model/export-format.enum';
import { StatusType } from 'app/shared/model/status-type.enum';
import { StringUtils } from 'app/shared/utils/string-utils';
import { SUMMARY_TABLE_STYLE } from 'app/summary-table/summary-table-style';
import { Page } from '@playwright/test';
import { DashboardTile } from './support/components/dashboard-tile';
import { downloadOf, exportFileName } from './support/downloads';
import { expect, test } from './support/fixtures';
import { firstColumnOf, fruitSalesOf } from './support/fruit-sales-sample';
import { DashboardPage } from './support/pages/dashboard-page';
import { Texts } from './support/texts';

const VIEW_NAME = 'Regions overview';
const GRID_GAP_PX = 10;
const en = new Texts('en');
const column = firstColumnOf(fruitSalesOf('en'), DataType.TEXT);

test.beforeEach(async ({ front, tabBar }) => {
   await front.open('en');
   await front.openSample();
   await tabBar.addDashboard();
});

test('switching to pie chart selects its type instead of bar and keeps the chart painted', async ({ dashboard }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.selectColumn(column);

   await dashboard.sideBar.switchChartType(ChartType.PIE);

   await expect(dashboard.sideBar.chartTypeButton(ChartType.PIE)).toHaveClass(/\bmat-accent\b/);
   await expect(dashboard.sideBar.chartTypeButton(ChartType.BAR)).not.toHaveClass(/\bmat-accent\b/);
   await dashboard.tile(0).expectChartPainted();
});

test('count of a summary table opens a raw data dialog with the counted rows', async ({ dashboard, rawDataDialog }) => {
   await dashboard.launcher.addSummary();
   await dashboard.sideBar.selectColumn(column);
   await dashboard.sideBar.close();

   const count = (await dashboard.tile(0).firstCountLink.innerText()).trim();
   await dashboard.tile(0).firstCountLink.click();

   await expect(rawDataDialog.table.rowCount).toHaveText(en.get('ui.rows', { count }));
});

test('double click on the graph root node reveals all rows', async ({ dashboard, rawDataDialog }) => {
   await dashboard.launcher.addGraph();
   await dashboard.sideBar.close();

   await dashboard.tile(0).graphRootNode.dblclick();

   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(fruitSalesOf('en').entries.length));
});

test('saved view restores the removed element', async ({ dashboard, notifications }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.close();

   await dashboard.viewToolbar.saveView(VIEW_NAME);
   const message = await notifications.dismiss(StatusType.SUCCESS);
   await dashboard.tile(0).remove();
   await dashboard.viewToolbar.restoreView(VIEW_NAME);

   expect(message).toBe(en.get('view.saved', { name: VIEW_NAME }));
   await expect(dashboard.tiles).toHaveCount(1);
   await expect(dashboard.tile(0).title).toHaveValue(en.get('element.title.dataUndefined'));
});

test('chart is saved as PNG file named after its title', async ({ page, dashboard }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.selectColumn(column);
   await dashboard.sideBar.close();
   await dashboard.tile(0).expectChartPainted();

   const download = await downloadOf(page, () => dashboard.tile(0).saveAs(
      en.get('element.saveAs', { format: en.get(EnumLabelKeys.exportFormat(ExportFormat.PNG)) })));

   expect(download.suggestedFilename()).toMatch(exportFileName(en.get('chart.title.countDistinctValuesOf', { columns: column }), ExportFormat.PNG));
});

test('summary table is saved as CSV file named after its title', async ({ page, dashboard }) => {
   await dashboard.launcher.addSummary();
   await dashboard.sideBar.selectColumn(column);
   await dashboard.sideBar.close();
   await dashboard.tile(0).firstCountLink.waitFor();

   const download = await downloadOf(page, () => dashboard.tile(0).saveAs(
      en.get('element.saveAs', { format: en.get(EnumLabelKeys.exportFormat(ExportFormat.CSV)) })));

   expect(download.suggestedFilename()).toMatch(exportFileName(en.get('element.title.distinctValuesOf', { column: StringUtils.quote(column) }), ExportFormat.CSV));
});

test('column span widens the tile of the element', async ({ dashboard }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.close();

   await dashboard.tile(0).setColumnSpan(en.get('element.columns', { count: 2 }));

   await expect(dashboard.tile(0).root).toHaveCSS('grid-column-end', 'span 2');
});

test('snap to grid button switches between grid and free canvas', async ({ dashboard }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.close();
   await expect(dashboard.snapToGridButton).toHaveClass(/\bkoia-toggle-active\b/);
   await expect(dashboard.snapToGridButton.locator('svg path')).toHaveCount(2);
   await expect(dashboard.gridContent).toBeVisible();

   await dashboard.snapToGridButton.click();
   await expect(dashboard.canvasContent).toBeVisible();
   await expect(dashboard.snapToGridButton).not.toHaveClass(/\bkoia-toggle-active\b/);

   await dashboard.snapToGridButton.click();
   await expect(dashboard.gridContent).toBeVisible();
});

test('resizing a lone grid tile snaps it to the covered grid cells', async ({ page, dashboard }) => {
   await page.setViewportSize({ width: 1512, height: 1400 });
   await dashboard.launcher.addChart();
   await dashboard.sideBar.close();

   await expectGridResizeBy(dashboard, 50, 2);
});

test('resizing one of two grid tiles snaps it to the covered grid cells', async ({ page, dashboard }) => {
   await page.setViewportSize({ width: 1512, height: 1400 });
   await dashboard.launcher.addChart();
   await dashboard.sideBar.close();
   await dashboard.addSummary();
   await dashboard.sideBar.close();

   await expectGridResizeBy(dashboard, 50, 2);
});

test('resizing a grid tile within the gap keeps its cells', async ({ page, dashboard }) => {
   await page.setViewportSize({ width: 1512, height: 1400 });
   await dashboard.launcher.addChart();
   await dashboard.sideBar.close();

   await expectGridResizeBy(dashboard, 5, 1);
});

test('grid tile grows by a row in the default window', async ({ dashboard }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.close();
   const tile = dashboard.tile(0);

   await tile.startResizeBy(0, 50);
   await tile.release();

   await expect(tile.root).toHaveCSS('grid-row-end', 'span 2');
   await expect(tile.root).toHaveCSS('grid-column-end', 'span 1');
});

async function expectGridResizeBy(dashboard: DashboardPage, offset: number, expectedSpan: number): Promise<void> {
   const tile = dashboard.tile(0);
   const box = await tile.root.boundingBox();
   const pitch = box.width + 10;

   await tile.startResizeBy(offset, offset);
   const preview = await dashboard.resizePreview.boundingBox();
   await tile.release();

   expect(Math.abs(preview.x - box.x)).toBeLessThanOrEqual(2);
   expect(Math.abs(preview.y - box.y)).toBeLessThanOrEqual(2);
   expect(Math.abs(preview.width - (expectedSpan * pitch - 10))).toBeLessThanOrEqual(2);
   expect(Math.abs(preview.height - (expectedSpan * pitch - 10))).toBeLessThanOrEqual(2);
   await expect(tile.root).toHaveCSS('grid-column-end', 'span ' + expectedSpan);
   await expect(tile.root).toHaveCSS('grid-row-end', 'span ' + expectedSpan);
   await expect(tile.root).toBeVisible();
   await expect(dashboard.resizePreview).toHaveCount(0);
}

test('switching to free canvas keeps tile positions and sizes', async ({ page, dashboard }) => {
   await page.setViewportSize({ width: 1512, height: 1400 });
   await dashboard.launcher.addChart();
   await dashboard.sideBar.close();
   await dashboard.setGridColumns(en.get('element.columns', { count: 2 }));
   await dashboard.setGridCellRatio('2:1');
   await dashboard.tile(0).setRowSpan(en.get('element.rows', { count: 2 }));
   await dashboard.addSummary();
   await dashboard.sideBar.close();
   await dashboard.addGraph();
   await dashboard.sideBar.close();
   const gridBoxes = await tileBoxes(dashboard);

   await dashboard.snapToGridButton.click();
   await expect(dashboard.canvasContent).toBeVisible();

   const canvasBoxes = await tileBoxes(dashboard);
   expect(canvasBoxes.length).toBe(3);
   canvasBoxes.forEach((box, i) => {
      expect(Math.abs(box.x - gridBoxes[i].x)).toBeLessThanOrEqual(1);
      expect(Math.abs(box.y - gridBoxes[i].y)).toBeLessThanOrEqual(1);
      expect(Math.abs(box.width - gridBoxes[i].width)).toBeLessThanOrEqual(1);
      expect(Math.abs(box.height - gridBoxes[i].height)).toBeLessThanOrEqual(1);
   });
});

test('moving a canvas tile snaps it to the right edge of another tile', async ({ page, dashboard }) => {
   await page.setViewportSize({ width: 1512, height: 1400 });
   const scale = await startCanvasWithCharts(dashboard, 2);
   const [first, second] = [dashboard.tile(0), dashboard.tile(1)];

   await second.startMoveBy(603 * scale, -410 * scale);
   await expect(dashboard.canvasGuide.first()).toBeVisible();
   await second.release();

   const [firstBox, secondBox] = await tileBoxes(dashboard);
   expect(Math.abs(secondBox.x - (firstBox.x + firstBox.width))).toBeLessThanOrEqual(1);
   expect(Math.abs(secondBox.y - firstBox.y)).toBeLessThanOrEqual(1);
   await expect(dashboard.canvasGuide).toHaveCount(0);
   expect(await second.zIndex()).toBeGreaterThan(await first.zIndex());
});

test('resizing a canvas tile snaps its right edge to the page center', async ({ page, dashboard }) => {
   await page.setViewportSize({ width: 1512, height: 1400 });
   const scale = await startCanvasWithCharts(dashboard, 1);
   const tile = dashboard.tile(0);

   await tile.startResizeBy(100 * scale + 3, 0);
   await expect(dashboard.canvasGuide).toHaveCount(1);
   await tile.release();

   const box = await tile.root.boundingBox();
   expect(Math.abs(box.width - 700 * scale)).toBeLessThanOrEqual(1);
   await expect(dashboard.resizePreview).toHaveCount(0);
});

test('canvas tile sent to back is stacked below other tile', async ({ dashboard }) => {
   await startCanvasWithCharts(dashboard, 2);

   await dashboard.tile(1).sendToBack();

   expect(await dashboard.tile(1).zIndex()).toBeLessThan(await dashboard.tile(0).zIndex());
});

test('canvas tile brought to front is stacked above other tile', async ({ dashboard }) => {
   await startCanvasWithCharts(dashboard, 2);

   await dashboard.tile(0).bringToFront();

   expect(await dashboard.tile(0).zIndex()).toBeGreaterThan(await dashboard.tile(1).zIndex());
});

test('free canvas prints one sheet per page', async ({ page, dashboard }) => {
   await page.setViewportSize({ width: 1512, height: 1400 });
   await dashboard.launcher.cancel();
   await dashboard.snapToGridButton.click();
   await dashboard.addChart();
   await dashboard.sideBar.selectColumn(column);
   await dashboard.sideBar.close();
   const tile = dashboard.tile(0);
   await tile.expectChartPainted();
   const scale = await dashboard.canvasScale();
   const sheetsOfOnePage = await printedSheets(page);

   await tile.startMoveBy(0, 950 * scale + 2);
   await tile.release();

   await tile.expectChartPainted();
   expect(sheetsOfOnePage).toEqual({ A4: 1, Letter: 1 });
   expect(await printedSheets(page)).toEqual({ A4: 2, Letter: 2 });
});

async function startCanvasWithCharts(dashboard: DashboardPage, chartCount: number): Promise<number> {
   await dashboard.launcher.cancel();
   await dashboard.snapToGridButton.click();
   for (let i = 0; i < chartCount; i++) {
      await dashboard.addChart();
      await dashboard.sideBar.close();
   }
   await expect(dashboard.tiles).toHaveCount(chartCount);
   return dashboard.canvasScale();
}

async function tileBoxes(dashboard: DashboardPage): Promise<{ x: number; y: number; width: number; height: number }[]> {
   return Promise.all((await dashboard.tiles.all()).map(tile => tile.boundingBox()));
}

async function printedSheets(page: Page): Promise<{ A4: number; Letter: number }> {
   await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
   const sheetsOf = async (format: string) => {
      const pdf = await page.pdf({ format, landscape: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } });
      return pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g).length;
   };
   const sheets = { A4: await sheetsOf('A4'), Letter: await sheetsOf('Letter') };
   await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
   return sheets;
}

test('pressing outside the shown chart margin hides it and resets the margin button', async ({ dashboard }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.selectColumn(column);
   await dashboard.sideBar.close();
   const tile = dashboard.tile(0);
   await tile.marginButton.click();
   await expect(tile.margin).toBeVisible();

   await tile.title.click();

   await expect(tile.margin).toHaveCount(0);
   await expect(tile.marginButton).not.toHaveClass(/\bkoia-toggle-active\b/);
});

test('margin button hides the shown chart margin', async ({ dashboard }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.selectColumn(column);
   await dashboard.sideBar.close();
   const tile = dashboard.tile(0);
   await tile.marginButton.click();
   await expect(tile.marginButton).toHaveClass(/\bkoia-toggle-active\b/);

   await tile.marginButton.click();

   await expect(tile.margin).toHaveCount(0);
   await expect(tile.marginButton).not.toHaveClass(/\bkoia-toggle-active\b/);
});

test('generated dashboard fills the grid with painted charts and one summary table without warning', async ({ dashboard, notifications }) => {
   await dashboard.launcher.generateDashboard();

   const columns = await generatedGridColumns(dashboard);
   expect(columns).not.toBe(3);
   expect([4, 5]).toContain(columns);
   await expect.poll(() => dashboard.occupiedCellCount()).toBe(columns * rowsOf(columns));
   await expect(dashboard.summaryTables).toHaveCount(1);
   for (const tile of await dashboard.chartTiles.all()) {
      await new DashboardTile(tile).expectChartPainted();
   }
   await expect(notifications.pane(StatusType.WARNING)).toHaveCount(0);
   await expect(dashboard.tiles.locator('.but_warning')).toHaveCount(0);
});

test('generated dashboard starts with a time chart spanning the full first row', async ({ dashboard }) => {
   await dashboard.launcher.generateDashboard();

   const columns = await generatedGridColumns(dashboard);
   expect(await dashboard.tile(0).spans()).toEqual({ columns, rows: 1 });
   await expect(dashboard.tile(0).root.locator('koia-chart')).toHaveCount(1);
});

test('generated dashboard uses square cells up to the vertical scrollbar share of container width units', async ({ dashboard }) => {
   await dashboard.launcher.generateDashboard();

   const columns = await generatedGridColumns(dashboard);
   const { rowHeight, columnWidths, scrollbarWidth } = await dashboard.gridTracks();
   const excess = scrollbarWidth / columns;
   for (const columnWidth of columnWidths) {
      expect(Math.abs(rowHeight - columnWidth)).toBeLessThanOrEqual(excess + 1);
   }
   for (const tile of await dashboard.tiles.all()) {
      const spans = await new DashboardTile(tile).spans();
      if (spans.columns === 1 && spans.rows === 1) {
         const { width, height } = await tile.boundingBox();
         expect(Math.abs(height - width)).toBeLessThanOrEqual(excess + 2);
      }
   }
});

test('regeneration asks for confirmation and replaces tiles and grid resolution', async ({ dashboard, confirmDialog }) => {
   await dashboard.launcher.generateDashboard();
   const previousColumns = await generatedGridColumns(dashboard);
   const previousTile = await dashboard.tiles.first().elementHandle();

   await dashboard.regenerate();
   const question = await confirmDialog.confirm();

   expect(question).toBe(en.get('dashboard.regenerateQuestion'));
   await expect.poll(() => previousTile.evaluate(e => e.isConnected)).toBe(false);
   await expect.poll(async () => (await dashboard.gridTracks()).columnWidths.length).not.toBe(previousColumns);
   const columns = (await dashboard.gridTracks()).columnWidths.length;
   await expect.poll(() => dashboard.occupiedCellCount()).toBe(columns * rowsOf(columns));
});

test('declining regeneration keeps tiles and grid resolution', async ({ dashboard, confirmDialog }) => {
   await dashboard.launcher.generateDashboard();
   const previousColumns = await generatedGridColumns(dashboard);
   const previousTileCount = await dashboard.tiles.count();
   const previousTile = await dashboard.tiles.first().elementHandle();

   await dashboard.regenerate();
   await confirmDialog.decline();

   expect(await previousTile.evaluate(e => e.isConnected)).toBe(true);
   await expect(dashboard.tiles).toHaveCount(previousTileCount);
   expect((await dashboard.gridTracks()).columnWidths.length).toBe(previousColumns);
});

test('summary table style matches width estimator constants', async ({ dashboard }) => {
   await dashboard.launcher.addSummary();
   await dashboard.sideBar.selectColumn(column);
   await dashboard.sideBar.close();

   const styles = await dashboard.tile(0).tableCellStyles();

   for (const part of ['header', 'cell', 'footer'] as const) {
      const expected = SUMMARY_TABLE_STYLE[part];
      expect(styles[part].fontWeight).toBe(expected.fontWeight);
      expect(styles[part].fontSize).toBe(expected.fontSize);
      expect(styles[part].fontFamily).toBe(expected.fontFamily);
      expect(styles[part].letterSpacing).toBeCloseTo(expected.letterSpacing, 2);
      expect(styles[part].horizontalPadding).toBe(expected.horizontalPadding);
   }
   expect(styles.sortArrowWidth).toBe(SUMMARY_TABLE_STYLE.sortArrowWidth);
});

test('generated summary table spans one cell only when its content fits', async ({ page, dashboard }) => {
   await dashboard.launcher.generateDashboard();

   const columns = await generatedGridColumns(dashboard);
   const tile = new DashboardTile(dashboard.tiles.filter({ has: page.locator('koia-summary-table') }));
   const { rendered, maxContent, columnCount } = await tile.tableWidths();
   const { offsetWidth, scrollbarWidth } = await dashboard.scrollerWidth();
   if ((await tile.spans()).columns === 1) {
      expect(Math.abs(rendered - maxContent)).toBeLessThanOrEqual(0.5);
   } else {
      const cellWidth = (offsetWidth - scrollbarWidth) / columns - GRID_GAP_PX;
      expect(maxContent + SUMMARY_TABLE_STYLE.marginRight + scrollbarWidth + columnCount).toBeGreaterThanOrEqual(cellWidth - 1);
   }
});

async function generatedGridColumns(dashboard: DashboardPage): Promise<number> {
   await dashboard.tiles.first().waitFor();
   return (await dashboard.gridTracks()).columnWidths.length;
}
