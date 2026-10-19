import { rowsOf } from 'app/dashboard/generator/generated-grid';
import { ChartType } from 'app/shared/model/chart/chart-type';
import { DataType } from 'app/shared/model/data-type.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { ExportFormat } from 'app/shared/model/export-format.enum';
import { StatusType } from 'app/shared/model/status-type.enum';
import { StringUtils } from 'app/shared/utils/string-utils';
import { SUMMARY_TABLE_STYLE } from 'app/summary-table/summary-table-style';
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, FONT_FAMILIES, FONT_SIZES } from 'app/text-box/text-box-style';
import { Locator, Page } from '@playwright/test';
import { DashboardTile } from './support/components/dashboard-tile';
import { TextBox } from './support/components/text-box';
import { downloadOf, exportFileName } from './support/downloads';
import { expect, test } from './support/fixtures';
import { firstColumnOf, fruitSalesOf } from './support/fruit-sales-sample';
import { DashboardPage } from './support/pages/dashboard-page';
import { Texts } from './support/texts';

const VIEW_NAME = 'Regions overview';
const GRID_GAP_PX = 10;
/** half a snap step of 10 page units */
const SNAP_TOLERANCE_PX = 6;
/** minimum width of 40 page units of a text box added with 300 page units */
const TEXT_BOX_MIN_WIDTH_RATIO = 40 / 300;
const TEXT_BOX_MIN_HEIGHT = 30;
/** width in page units a note keeps when shrunk to a shorter text */
const NOTE_MIN_FIT_WIDTH = 120;
/** padding of the text box frame around its editor */
const TEXT_BOX_FRAME_PADDING_PX = 2 * 6;
const BOTTOM_RIGHT_QUADRANT = { x: 0.7, y: 0.7 };
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

test('narrowing grid columns below a tile span asks for confirmation and narrows the tile', async ({ dashboard, confirmDialog }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.close();
   await dashboard.tile(0).setColumnSpan(en.get('element.columns', { count: 3 }));

   await dashboard.setGridColumns(en.get('element.columns', { count: 2 }));
   const question = await confirmDialog.confirm();

   expect(question).toBe(en.get('dashboard.confirmResize'));
   await expect.poll(async () => (await dashboard.tile(0).spans()).columns).toBe(2);
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
   await dispatchWindowEvent(page, 'beforeprint');
   const sheetsOf = async (format: string) => {
      const pdf = await page.pdf({ format, landscape: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } });
      return pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g).length;
   };
   const sheets = { A4: await sheetsOf('A4'), Letter: await sheetsOf('Letter') };
   await dispatchWindowEvent(page, 'afterprint');
   return sheets;
}

async function dispatchWindowEvent(page: Page, type: string): Promise<void> {
   await page.evaluate((t: string) => window.dispatchEvent(new Event(t)), type);
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

   const columns = await dashboard.generatedGridColumns();
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

   const columns = await dashboard.generatedGridColumns();
   expect(await dashboard.tile(0).spans()).toEqual({ columns, rows: 1 });
   await expect(dashboard.tile(0).root.locator('koia-chart')).toHaveCount(1);
});

test('generated dashboard uses square cells up to the vertical scrollbar share of container width units', async ({ dashboard }) => {
   await dashboard.launcher.generateDashboard();

   const columns = await dashboard.generatedGridColumns();
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
   const previousColumns = await dashboard.generatedGridColumns();
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
   const previousColumns = await dashboard.generatedGridColumns();
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

test('summary table rows are dense, striped and highlighted on hover', async ({ dashboard }) => {
   await dashboard.launcher.addSummary();
   await dashboard.sideBar.selectColumn(column);
   await dashboard.sideBar.close();
   const tile = dashboard.tile(0);

   const { heights, backgrounds } = await tile.tableRowStyles();
   await tile.hoverFirstTableRow();

   for (const height of heights) {
      expect(height).toBeLessThanOrEqual(23);
   }
   expect(backgrounds).toEqual(['rgb(239, 239, 239)', 'rgba(0, 0, 0, 0)']);
   expect((await tile.tableRowStyles()).backgrounds[0]).toBe('rgb(229, 243, 255)');
});

test('summary table scrollbar stays above resize handle', async ({ dashboard }) => {
   await dashboard.launcher.addSummary();
   await dashboard.sideBar.selectColumn(column);
   await dashboard.sideBar.close();

   const { scrollerBottom, handleTop } = await dashboard.tile(0).tableScrollerBottomAndHandleTop();

   expect(scrollerBottom).toBeLessThanOrEqual(handleTop);
});

test('generated summary table spans one cell only when its content fits', async ({ dashboard }) => {
   await dashboard.launcher.generateDashboard();

   const columns = await dashboard.generatedGridColumns();
   const tile = new DashboardTile(dashboard.summaryTiles);
   const { rendered, maxContent, columnCount } = await tile.tableWidths();
   const { offsetWidth, scrollbarWidth } = await dashboard.scrollerWidth();
   if ((await tile.spans()).columns === 1) {
      expect(Math.abs(rendered - maxContent)).toBeLessThanOrEqual(0.5);
   } else {
      const cellWidth = (offsetWidth - scrollbarWidth) / columns - GRID_GAP_PX;
      expect(maxContent + SUMMARY_TABLE_STYLE.marginRight + scrollbarWidth + columnCount).toBeGreaterThanOrEqual(cellWidth - 1);
   }
});

test('enter and shift enter split text box text into two paragraphs and a line break', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.focus();

   await textBox.type('first');
   await textBox.press('Enter');
   await textBox.type('second');
   await textBox.press('Shift+Enter');
   await textBox.type('third');

   await expect(textBox.paragraphs).toHaveCount(2);
   await expect(textBox.paragraphs.nth(0)).toHaveText('first');
   await expect(textBox.paragraphs.nth(1)).toHaveText('secondthird');
   await expect(textBox.lineBreaksOf(1)).toHaveCount(1);
});

test('long text box text wraps only after spaces', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.focus();

   await textBox.insert(Array.from({ length: 60 }, (_, i) => 'word' + i).join(' '));

   const wrapped = await textBox.charactersBeforeWraps();
   expect(wrapped.length).toBeGreaterThan(1);
   expect(new Set(wrapped)).toEqual(new Set([' ']));
});

test('bold, font size and colour apply only to the selected word of a text box', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.focus();
   await textBox.type('one two three');
   await textBox.press('ArrowLeft', 6);
   await textBox.press('Shift+ArrowLeft', 3);

   await textBox.toolbar.toggleBold();
   await textBox.toolbar.setFontSize(FONT_SIZES.at(-1));
   await textBox.toolbar.setTextColor('#ff0000');

   expect(await textBox.styleOf('two')).toMatchObject({ fontWeight: 700, fontSize: FONT_SIZES.at(-1), color: 'rgb(255, 0, 0)' });
   for (const word of ['one', 'three']) {
      expect(await textBox.styleOf(word)).toMatchObject({ fontWeight: 400, fontSize: DEFAULT_FONT_SIZE, color: 'rgb(0, 0, 0)' });
   }
});

test('text box style changed at the cursor applies to subsequently typed text', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.focus();
   await textBox.type('plain ');
   const fontFamily = FONT_FAMILIES.at(-2);

   await textBox.toolbar.toggleBold();
   await textBox.toolbar.setFontFamily(fontFamily.label);
   await expect(textBox.editor).toBeFocused();
   await textBox.type('styled');

   expect(await textBox.styleOf('styled')).toMatchObject({ fontWeight: 700, fontFamily: fontFamily.value });
   expect(await textBox.styleOf('plain')).toMatchObject({ fontWeight: 400, fontFamily: DEFAULT_FONT_FAMILY });
});

test('text box background colour is applied to its tile', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.focus();

   await textBox.toolbar.setBackgroundColor('#ffff00');

   await expect(textBox.tile).toHaveCSS('background-color', 'rgb(255, 255, 0)');
});

test('text box toolbar closes after clicking outside the text box', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.focus();

   await dashboard.pressOutsideTextBoxes();

   await expect(textBox.toolbar.root).toBeHidden();
});

test('text box toolbar of a text box with room above it is shown above the text box', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const columns = (await dashboard.gridTracks()).columnWidths.length;
   await dashboard.addSummaries(columns + 1);
   const textBox = await dashboard.addNote();
   await dropOnto(textBox, dashboard.summaryTiles.nth(columns), { x: 0.1, y: 0.1 });

   await textBox.focus();

   const tile = await textBox.tile.boundingBox();
   const toolbar = await textBox.toolbar.root.boundingBox();
   expect(toolbar.y + toolbar.height).toBeLessThanOrEqual(tile.y + 1);
});

test('text box toolbar of a first row text box is shown below the text box within the grid', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addTextTile();

   await textBox.focus();

   const tile = await textBox.tile.boundingBox();
   const toolbar = await textBox.toolbar.root.boundingBox();
   const grid = await dashboard.gridContent.boundingBox();
   expect(toolbar.y).toBeGreaterThanOrEqual(tile.y + tile.height - 1);
   expect(toolbar.y).toBeGreaterThanOrEqual(grid.y);
});

test('scrolling the text box out of view closes its toolbar', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   await dashboard.addSummaries((await dashboard.gridTracks()).columnWidths.length * 6);
   await dashboard.gridContent.evaluate((e: HTMLElement) => e.scrollTop = 0);
   const textBox = await dashboard.addNote();
   await textBox.focus();
   const tile = await textBox.tile.boundingBox();
   const grid = await dashboard.gridContent.boundingBox();

   await dashboard.gridContent.evaluate((e: HTMLElement, top: number) => e.scrollTop = top, tile.y + tile.height - grid.y + 10);

   await expect(textBox.toolbar.root).toBeHidden();
});

test('click near the bottom of a one line text box appends typed text to its end', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.focus();
   await textBox.type('hello');
   await textBox.press('Home');
   const editor = await textBox.editor.boundingBox();

   await textBox.editor.click({ position: { x: editor.width / 2, y: editor.height - 10 } });
   await textBox.type(' world');

   await expect(textBox.editor).toHaveText('hello world');
});

test('drag selecting text of a grid text box does not move it', async ({ page, dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.focus();
   await textBox.type('drag to select');
   const tile = await textBox.tile.boundingBox();
   const text = await textBox.paragraphs.first().boundingBox();

   await page.mouse.move(text.x + 1, text.y + text.height / 2);
   await page.mouse.down();
   await page.mouse.move(text.x + text.width - 1, text.y + text.height / 2 + 40, { steps: 10 });
   const draggedTile = await textBox.tile.boundingBox();
   await page.mouse.up();

   expect(draggedTile).toEqual(tile);
   expect(await textBox.tile.boundingBox()).toEqual(tile);
   expect(await textBox.selectedText()).toBe('drag to select');
});

test('dragging the frame of a grid text box moves it', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   const tile = await textBox.tile.boundingBox();

   await textBox.startMoveBy(200, 100);
   await textBox.release();

   const moved = await textBox.tile.boundingBox();
   expect(Math.abs(moved.x - tile.x - 200)).toBeLessThanOrEqual(SNAP_TOLERANCE_PX);
   expect(Math.abs(moved.y - tile.y - 100)).toBeLessThanOrEqual(SNAP_TOLERANCE_PX);
});

test('resizing a grid text box shrinks it down to its minimum size, but not below its text', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   const tile = await textBox.tile.boundingBox();

   await textBox.startResizeBy(5 - tile.width, 5 - tile.height);
   await textBox.release();

   const resized = await textBox.tile.boundingBox();
   expect(resized.width / tile.width).toBeCloseTo(TEXT_BOX_MIN_WIDTH_RATIO, 2);
   const scale = await dashboard.gridScale();
   const fitHeight = Math.ceil(Math.ceil(await textBox.contentHeight() + TEXT_BOX_FRAME_PADDING_PX) / scale) * scale;
   expect(Math.abs(resized.height - Math.max(TEXT_BOX_MIN_HEIGHT * scale, fitHeight))).toBeLessThanOrEqual(0.5);
});

test('text tile takes the grid cell after a summary', async ({ dashboard }) => {
   await dashboard.launcher.addSummary();
   await dashboard.sideBar.close();

   const textTile = await dashboard.addTextTile();

   const [summary, tile] = await tileBoxes(dashboard);
   expect(tile.y).toBeCloseTo(summary.y, 0);
   expect(tile.x).toBeCloseTo(summary.x + summary.width + GRID_GAP_PX, 0);
   expect(tile.width).toBeCloseTo(summary.width, 0);
   expect(await new DashboardTile(textTile.tile).spans()).toEqual({ columns: 1, rows: 1 });
});

test('text tile grows by grid rows while typing and shrinks back when its text is deleted', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textTile = await dashboard.addTextTile();
   const tile = new DashboardTile(textTile.tile);
   await textTile.focus();

   await typeLines(textTile, 30);

   await expect.poll(async () => (await tile.spans()).rows).toBeGreaterThan(1);
   expect(await textTile.fitsContent()).toBe(true);

   await textTile.press('ControlOrMeta+a');
   await textTile.press('Backspace');

   await expect.poll(async () => (await tile.spans()).rows).toBe(1);
});

test('grown text tile keeps its rows when reordered', async ({ dashboard }) => {
   await dashboard.launcher.addSummary();
   await dashboard.sideBar.close();
   const textTile = await dashboard.addTextTile();
   await textTile.focus();
   await typeLines(textTile, 30);
   const tile = new DashboardTile(textTile.tile);
   await expect.poll(async () => (await tile.spans()).rows).toBeGreaterThan(1);
   const rows = (await tile.spans()).rows;
   const [summary, grown] = await tileBoxes(dashboard);

   await dashboard.tile(0).startMoveBy(grown.x - summary.x, 0);
   await dashboard.tile(0).release();

   await expect(dashboard.tile(1).root.locator('koia-summary-table')).toHaveCount(1);
   expect((await tile.spans()).rows).toBe(rows);
   expect(await textTile.fitsContent()).toBe(true);
});

test('note grows with its text', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const note = await dashboard.addNote();
   const tile = await note.tile.boundingBox();
   await note.focus();

   await typeLines(note, 20);

   await expect.poll(async () => (await note.tile.boundingBox()).height).toBeGreaterThan(tile.height);
   expect(await note.fitsContent()).toBe(true);
});

test('empty text tile shows its placeholder only while hovered', async ({ page, dashboard }) => {
   await dashboard.launcher.cancel();
   const textTile = await dashboard.addTextTile();
   await dashboard.pressOutsideTextBoxes();
   await page.mouse.move(0, 0);
   expect(await textTile.placeholderShown()).toBe(false);

   await textTile.tile.hover();

   await expect.poll(() => textTile.placeholderShown()).toBe(true);
});

test('border of a text box is solid, also when printed while focused', async ({ page, dashboard }) => {
   await dashboard.launcher.cancel();
   const note = await dashboard.addNote();
   await note.focus();

   await note.toolbar.toggleBorder();
   await dashboard.pressOutsideTextBoxes();

   await expect.poll(() => note.frameBorderStyle()).toBe('solid');
   await note.focus();
   await page.emulateMedia({ media: 'print' });
   expect(await note.frameBorderStyle()).toBe('solid');
});

test('new note is translucent yellow, starts editing and shows its frame while edited or hovered', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await expect(textBox.tile).toHaveCSS('background-color', 'rgba(255, 249, 196, 0.8)');
   await expect(textBox.editor).toBeFocused();
   await expect(textBox.toolbar.root).toBeVisible();
   expect(await textBox.frameOutlineStyle()).toBe('dashed');
   await dashboard.pressOutsideTextBoxes();
   await expect.poll(() => textBox.frameOutlineStyle()).toBe('none');
   await expect(textBox.resizeHandle).toBeHidden();

   await textBox.hover();

   await expect.poll(() => textBox.frameOutlineStyle()).toBe('dashed');
   await expect(textBox.resizeHandle).toBeVisible();
});

test('new text tile has a light solid border and starts editing', async ({ dashboard }) => {
   await dashboard.launcher.cancel();

   const textTile = await dashboard.addTextTile();

   await expect(textTile.editor).toBeFocused();
   expect(await textTile.frameBorderStyle()).toBe('solid');
   expect(await textTile.frameBorderWidth()).toBe('1px');
   expect(await textTile.frameBorderColor()).toBe('rgb(224, 224, 224)');
});

test('new text tile in free layout is in view and starts editing', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   await dashboard.addSummaries((await dashboard.gridTracks()).columnWidths.length * 4);
   await dashboard.snapToGridButton.click();

   const textTile = await dashboard.addTextTile();

   await expect(textTile.editor).toBeFocused();
   await expect(textTile.tile).toBeInViewport();
});

test('new note is centred in the visible grid', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   await dashboard.addSummaries((await dashboard.gridTracks()).columnWidths.length * 4);
   await dashboard.gridContent.evaluate((e: HTMLElement) => e.scrollTop = 200);

   const textBox = await dashboard.addNote();

   await expectCentredIn(textBox, dashboard.gridContent);
});

test('new note is centred in the visible canvas', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   await dashboard.addSummary();
   await dashboard.sideBar.close();
   await dashboard.snapToGridButton.click();

   const textBox = await dashboard.addNote();

   await expectCentredIn(textBox, dashboard.canvasContent);
});

test('picked background and text colours are kept when the picker is closed by pressing elsewhere', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.type('coloured');
   await textBox.press('Control+a');

   await textBox.toolbar.inputColor(textBox.toolbar.backgroundColorInput, '#00ffff');
   await textBox.toolbar.inputColor(textBox.toolbar.textColorInput, '#ff0000');
   await dashboard.pressOutsideTextBoxes();

   await expect(textBox.tile).toHaveCSS('background-color', 'rgb(0, 255, 255)');
   expect((await textBox.styleOf('coloured')).color).toBe('rgb(255, 0, 0)');
});

test('border width and colour are applied and switch the border on', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();

   await textBox.toolbar.setBorderWidth('4px');
   await textBox.toolbar.setBorderColor('#0000ff');

   expect(await textBox.frameBorderStyle()).toBe('solid');
   expect(await textBox.frameBorderWidth()).toBe('4px');
   expect(await textBox.frameBorderColor()).toBe('rgb(0, 0, 255)');
});

test('note shrinks to its one line text after editing', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   const initial = await textBox.tile.boundingBox();
   await textBox.type('Hi');
   const lineHeight = await textBox.paragraphs.first().evaluate((p: HTMLElement) => p.getBoundingClientRect().height);

   await dashboard.pressOutsideTextBoxes();

   const minFitWidth = NOTE_MIN_FIT_WIDTH * await dashboard.gridScale();
   await expect.poll(async () => (await textBox.tile.boundingBox()).width).toBeLessThan(initial.width / 2);
   expect(Math.abs((await textBox.tile.boundingBox()).width - minFitWidth)).toBeLessThanOrEqual(1);
   expect((await textBox.tile.boundingBox()).height).toBeLessThan(initial.height);
   expect(await textBox.fitsContent()).toBe(true);
   expect(await textBox.paragraphs.first().evaluate((p: HTMLElement) => p.getBoundingClientRect().height)).toBe(lineHeight);
});

test('note without text keeps its size after editing ends', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   const initial = await textBox.tile.boundingBox();
   await textBox.type('x');
   await textBox.press('Backspace');

   await dashboard.pressOutsideTextBoxes();

   await expect(textBox.toolbar.root).toBeHidden();
   expect(await textBox.tile.boundingBox()).toEqual(initial);
});

test('move button appears only while the upper right corner is hovered and moves the note', async ({ page, dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await dashboard.pressOutsideTextBoxes();
   await page.mouse.move(0, 0);
   await expect(textBox.moveButton).toBeHidden();
   const before = await textBox.tile.boundingBox();

   await textBox.moveZone.hover();
   await expect(textBox.moveButton).toBeVisible();
   await textBox.startMoveByButton(100, 50);
   await textBox.release();

   const after = await textBox.tile.boundingBox();
   expect(Math.abs(after.x - before.x - 100)).toBeLessThan(10);
   expect(Math.abs(after.y - before.y - 50)).toBeLessThan(10);
});

test('edited note moved by its move button follows the pointer and shrinks after release', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.type('Hi');
   const before = await textBox.tile.boundingBox();

   await textBox.startMoveByButton(100, 50);
   const moving = await textBox.tile.boundingBox();
   await textBox.release();

   expect(moving.width).toBe(before.width);
   expect(Math.abs(moving.x - before.x - 100)).toBeLessThan(10);
   await expect.poll(async () => (await textBox.tile.boundingBox()).width).toBeLessThan(before.width / 2);
   const after = await textBox.tile.boundingBox();
   expect(Math.abs(after.x - before.x - 100)).toBeLessThan(10);
});

test('edited note resized right after editing keeps the resized size', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.type('Hi');
   const before = await textBox.tile.boundingBox();

   await textBox.startResizeBy(50, 30);
   await textBox.release();

   await expect.poll(async () => (await textBox.tile.boundingBox()).width).toBeGreaterThan(before.width + 30);
   await dashboard.pressOutsideTextBoxes();
   expect((await textBox.tile.boundingBox()).width).toBeGreaterThan(before.width + 30);
});

test('shrunk one line note is still resized by its handle', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.type('Hi');
   const initialWidth = (await textBox.tile.boundingBox()).width;
   await dashboard.pressOutsideTextBoxes();
   await expect.poll(async () => (await textBox.tile.boundingBox()).width).toBeLessThan(initialWidth);
   const shrunk = await textBox.tile.boundingBox();

   await textBox.startResizeBy(50, 50);
   await textBox.release();

   await expect.poll(async () => (await textBox.tile.boundingBox()).width).toBeGreaterThan(shrunk.width + 30);
});

test('click on the move zone of a note without moving starts editing its text', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.type('Hi');
   await dashboard.pressOutsideTextBoxes();
   await expect(textBox.toolbar.root).toBeHidden();

   await textBox.moveZone.click();

   await expect(textBox.editor).toBeFocused();
   await expect(textBox.toolbar.root).toBeVisible();
});

test('tile delete button shows the trash icon of the text box toolbar', async ({ dashboard }) => {
   await dashboard.launcher.cancel();

   await dashboard.addSummary();

   await expect(dashboard.summaryTiles.first().locator('.but_close mat-icon')).toHaveAttribute('svgicon', 'lucide_trash_2');
});

test('empty text box area entered from outside lets the pointer reach the tile below', async ({ page, dashboard }) => {
   const textBox = await addSummaryChartAndTextBox(dashboard);
   const { x, y } = await emptyPointOf(textBox);

   await page.mouse.move(x, y + 40);
   await page.mouse.move(x, y, { steps: 5 });

   await expect(textBox.resizeHandle).toBeHidden();
   expect(await isHitAt(dashboard.summaryTiles, x, y)).toBe(true);
});

test('empty text box area entered from its text keeps the text box revealed', async ({ page, dashboard }) => {
   const textBox = await addSummaryChartAndTextBox(dashboard);
   const { x, y } = await emptyPointOf(textBox);
   await textBox.hover();

   await page.mouse.move(x, y, { steps: 5 });

   await expect(textBox.resizeHandle).toBeVisible();
   expect(await isHitAt(textBox.tile, x, y)).toBe(true);
});

test('text box deleted from its toolbar is removed with the toolbar', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.focus();

   await textBox.toolbar.delete();

   await expect(dashboard.tiles).toHaveCount(0);
   await expect(textBox.toolbar.root).toBeHidden();
});

test('text box dropped onto a grid tile keeps its spot on the tile when the tile is reordered', async ({ dashboard }) => {
   const textBox = await addSummaryChartAndTextBox(dashboard);
   const spot = await dropOnto(textBox, dashboard.summaryTiles, BOTTOM_RIGHT_QUADRANT);
   const [summary, chart] = await tileBoxes(dashboard);

   await dashboard.tile(0).startMoveBy(chart.x - summary.x, 0);
   await dashboard.tile(0).release();

   await expect(dashboard.tile(1).root.locator('koia-summary-table')).toHaveCount(1);
   expectSameSpot(await spotOf(textBox, dashboard.summaryTiles), spot);
});

test('text box dropped onto a grid tile keeps its spot on the tile when the grid columns change', async ({ dashboard }) => {
   const textBox = await addSummaryChartAndTextBox(dashboard);
   const spot = await dropOnto(textBox, dashboard.summaryTiles, BOTTOM_RIGHT_QUADRANT);
   const summary = await dashboard.summaryTiles.boundingBox();

   await dashboard.setGridColumns(en.get('element.columns', { count: 2 }));

   await expect.poll(async () => (await dashboard.summaryTiles.boundingBox()).width).toBeGreaterThan(summary.width + 1);
   expectSameSpot(await spotOf(textBox, dashboard.summaryTiles), spot);
});

test('text box dropped onto a grid tile keeps its spot on the tile when printing zooms out', async ({ page, dashboard }) => {
   const textBox = await addSummaryChartAndTextBox(dashboard);
   const spot = await dropOnto(textBox, dashboard.summaryTiles, BOTTOM_RIGHT_QUADRANT);

   await page.emulateMedia({ media: 'print' });
   await dispatchWindowEvent(page, 'beforeprint');

   expect(await printZoom(page)).toBeLessThan(1);
   expectSameSpot(await spotOf(textBox, dashboard.summaryTiles), spot);
});

test('switching layout back and forth keeps a text box on its spot of the tile', async ({ dashboard }) => {
   const textBox = await addSummaryChartAndTextBox(dashboard);
   const spot = await dropOnto(textBox, dashboard.chartTiles, BOTTOM_RIGHT_QUADRANT);

   await dashboard.snapToGridButton.click();
   await expect(dashboard.canvasContent).toBeVisible();
   const canvasSpot = await spotOf(textBox, dashboard.chartTiles);
   await dashboard.snapToGridButton.click();
   await expect(dashboard.gridContent).toBeVisible();

   expectSameSpot(canvasSpot, spot);
   expectSameSpot(await spotOf(textBox, dashboard.chartTiles), spot);
});

test('switching layout back and forth keeps formatted text box content and background', async ({ dashboard }) => {
   await dashboard.launcher.cancel();
   const textBox = await dashboard.addNote();
   await textBox.focus();
   await textBox.type('one two three');
   await textBox.press('ArrowLeft', 6);
   await textBox.press('Shift+ArrowLeft', 3);
   await textBox.toolbar.toggleBold();
   await textBox.toolbar.setBackgroundColor('#ffff00');

   await dashboard.snapToGridButton.click();
   await expect(dashboard.canvasContent).toBeVisible();
   await dashboard.snapToGridButton.click();
   await expect(dashboard.gridContent).toBeVisible();

   const restored = dashboard.textBox(0);
   await expect(restored.editor).toHaveText('one two three');
   await expect(restored.editor.locator('strong')).toHaveText('two');
   await expect(restored.tile).toHaveCSS('background-color', 'rgb(255, 255, 0)');
});

test('printing hides text box toolbar, frame and placeholder', async ({ page, dashboard }) => {
   await dashboard.launcher.cancel();
   const empty = await dashboard.addNote();
   await dashboard.pressOutsideTextBoxes();
   const filled = await dashboard.addNote();
   await filled.type('printed');
   expect(await filled.frameOutlineStyle()).toBe('dashed');
   expect(await empty.placeholderShown()).toBe(true);

   await page.emulateMedia({ media: 'print' });

   await expect(filled.toolbar.root).toBeHidden();
   expect(await filled.frameOutlineStyle()).toBe('none');
   expect(await empty.placeholderShown()).toBe(false);
});

interface Spot {
   x: number;
   y: number;
}

async function typeLines(textBox: TextBox, count: number): Promise<void> {
   for (let i = 0; i < count; i++) {
      await textBox.type('line');
      await textBox.press('Enter');
   }
}

/**
 * the note is dropped onto the summary, which also ends its editing
 */
async function addSummaryChartAndTextBox(dashboard: DashboardPage): Promise<TextBox> {
   await dashboard.launcher.addSummary();
   await dashboard.sideBar.close();
   await dashboard.addChart();
   await dashboard.sideBar.close();
   const textBox = await dashboard.addNote();
   await dropOnto(textBox, dashboard.summaryTiles.first(), { x: 0.1, y: 0.1 });
   return textBox;
}

async function expectCentredIn(textBox: TextBox, content: Locator): Promise<void> {
   const tile = await textBox.tile.boundingBox();
   const center = await content.evaluate((e: HTMLElement) => {
      const rect = e.getBoundingClientRect();
      return { x: rect.left + e.clientLeft + e.clientWidth / 2, y: rect.top + e.clientTop + e.clientHeight / 2 };
   });
   expect(Math.abs(tile.x + tile.width / 2 - center.x)).toBeLessThanOrEqual(2);
   expect(Math.abs(tile.y + tile.height / 2 - center.y)).toBeLessThanOrEqual(2);
}

/**
 * @returns the spot the text box was dropped at after snapping
 */
async function dropOnto(textBox: TextBox, tile: Locator, spot: Spot): Promise<Spot> {
   const box = await textBox.tile.boundingBox();
   const target = await tile.boundingBox();
   await textBox.startMoveBy(target.x + spot.x * target.width - box.x, target.y + spot.y * target.height - box.y);
   await textBox.release();
   return spotOf(textBox, tile);
}

/**
 * @returns the top left corner of the text box as fractions of the tile size
 */
async function spotOf(textBox: TextBox, tile: Locator): Promise<Spot> {
   const box = await textBox.tile.boundingBox();
   const anchor = await tile.boundingBox();
   return { x: (box.x - anchor.x) / anchor.width, y: (box.y - anchor.y) / anchor.height };
}

function expectSameSpot(actual: Spot, expected: Spot): void {
   expect(actual.x).toBeCloseTo(expected.x, 2);
   expect(actual.y).toBeCloseTo(expected.y, 2);
}

/**
 * @returns a point of the text box below its single empty line
 */
async function emptyPointOf(textBox: TextBox): Promise<Spot> {
   const box = await textBox.tile.boundingBox();
   return { x: box.x + box.width / 2, y: box.y + box.height - 20 };
}

function isHitAt(element: Locator, x: number, y: number): Promise<boolean> {
   return element.evaluate((e: HTMLElement, point: Spot) => e.contains(document.elementFromPoint(point.x, point.y)), { x, y });
}

function printZoom(page: Page): Promise<number> {
   return page.evaluate(() => Number(getComputedStyle(document.documentElement).getPropertyValue('--koia-print-zoom')));
}
