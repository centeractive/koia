import { Page } from '@playwright/test';
import { Box, intersects } from '../support/box';
import { DashboardTile } from '../support/components/dashboard-tile';
import { expect, test } from '../support/fixtures';
import { DashboardPage } from '../support/pages/dashboard-page';
import { openSalesScene } from '../support/sales-scene';
import { SNAP_TOLERANCE_PX } from '../support/snap';
import { CAPTION_BAND_PX, VideoRecording } from './support/video-recording';

const ACTIVE = /\bkoia-toggle-active\b/;
const SELECTED = /\bdiv_tile_selected\b/;
const NOT_SELECTED = /^(?!.*\bdiv_tile_selected\b)/;

/**
 * expects the tiles fully in the viewport and above the band a caption covers
 */
async function expectAboveCaption(page: Page, ...tiles: DashboardTile[]): Promise<void> {
   for (const tile of tiles) {
      await expect(tile.root).toBeInViewport({ ratio: 1 });
      const box = await tile.root.boundingBox();
      expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height - CAPTION_BAND_PX);
   }
}

function rightOf(box: Box): number {
   return box.x + box.width;
}

function bottomOf(box: Box): number {
   return box.y + box.height;
}

test('dashboard layouts', async ({ page, front, scene, scenes, tabBar, dashboard }) => {
   const recording = new VideoRecording(page, 'dashboard-layouts');
   await openSalesScene(front, scene, scenes);
   await tabBar.addDashboard();
   await dashboard.launcher.addChart();
   await dashboard.sideBar.close();
   await dashboard.addSummaries(1);
   await dashboard.addChart();
   await dashboard.sideBar.close();
   await dashboard.addSummaries(1);
   await expect(dashboard.tiles).toHaveCount(4);
   await dashboard.setGridCellRatio('2:1');
   const tiles = [0, 1, 2, 3].map(i => dashboard.tile(i));
   recording.markStart();

   await recording.pointAt(dashboard.snapToGridButton);
   await expect(dashboard.snapToGridButton).toHaveClass(ACTIVE);
   await expectAboveCaption(page, ...tiles);
   await recording.caption('Snap to Grid lines the tiles up in the cells of a grid');

   const pitch = (await tiles[0].root.boundingBox()).width + DashboardPage.GRID_GAP_PX;
   await tiles[3].startResizeBy(pitch, 0);
   await expect(dashboard.resizePreview).toBeVisible();
   await expectAboveCaption(page, tiles[3]);
   await recording.caption('Drag the corner of a tile to span more cells');

   await tiles[3].release();
   await expect.poll(() => tiles[3].spans()).toEqual({ columns: 2, rows: 1 });
   await expectAboveCaption(page, tiles[3]);
   await recording.caption('Tiles snap to whole cells');

   const [gridBox0, , gridBox2] = await dashboard.tileBoxes();
   await tiles[0].startMoveBy(gridBox2.x - gridBox0.x, 0);
   await tiles[0].release();
   for (const [i, view] of ['koia-summary-table', 'koia-chart', 'koia-chart', 'koia-summary-table'].entries()) {
      await expect(tiles[i].root.locator(view)).toHaveCount(1);
   }
   await expectAboveCaption(page, ...tiles);
   await recording.caption('Drag a tile by its header to reorder the grid');

   await dashboard.snapToGridButton.click();
   await expect(dashboard.canvasContent).toBeVisible();
   await expect(dashboard.pagingToggles.monitorButton).toHaveClass(ACTIVE);
   await expectAboveCaption(page, ...tiles);
   await recording.caption('Switch Snap to Grid off – Screen View places tiles freely');

   await dashboard.allowOverlapButton.click();
   await expect(dashboard.allowOverlapButton).toHaveClass(ACTIVE);
   await recording.caption('Allow overlapping tiles to stack them');

   const box0 = await tiles[0].root.boundingBox();
   const box1 = await tiles[1].root.boundingBox();
   await tiles[1].startMoveBy(box0.x + box0.width / 2 - box1.x, box0.y + box0.height / 2 - box1.y);
   await tiles[1].release();
   expect(intersects(await tiles[0].root.boundingBox(), await tiles[1].root.boundingBox())).toBe(true);
   expect(await tiles[1].zIndex()).toBeGreaterThan(await tiles[0].zIndex());
   await expectAboveCaption(page, tiles[0], tiles[1]);
   await expect.poll(() => tiles[0].headerGapHitsTile()).toBe(true);
   await expect.poll(() => tiles[0].titleHitsTile()).toBe(true);
   await recording.caption('Drag a tile anywhere, e.g. onto another');

   await dashboard.chooseCanvasMenuItem(await tiles[0].headerGapPoint(), '.menu_item_to_front');
   await expect.poll(async () => await tiles[0].zIndex() > await tiles[1].zIndex()).toBe(true);
   await recording.caption('Right-click a tile to bring it to the front…');

   await tiles[0].sendToBack();
   await expect.poll(async () => await tiles[0].zIndex() < await tiles[1].zIndex()).toBe(true);
   await recording.caption('…or send it to the back from its menu');

   await dashboard.pagingToggles.landscapeButton.click();
   await expect(dashboard.sheets.first()).toBeVisible();
   await expect(dashboard.pagingToggles.landscapeButton).toHaveClass(ACTIVE);
   await recording.caption('Landscape Pages show the dashboard as it prints');

   const sheet = await dashboard.sheets.first().boundingBox();
   const [selectedBox0, selectedBox1] = await dashboard.tileBoxes();
   await dashboard.marqueeSelect({ x: sheet.x + 5, y: sheet.y + 5 }, {
      x: Math.max(rightOf(selectedBox0), rightOf(selectedBox1)) + 10,
      y: Math.max(bottomOf(selectedBox0), bottomOf(selectedBox1)) + 10
   });
   await expect(tiles[0].root).toHaveClass(SELECTED);
   await expect(tiles[1].root).toHaveClass(SELECTED);
   await expect(tiles[2].root).toHaveClass(NOT_SELECTED);
   await expect(tiles[3].root).toHaveClass(NOT_SELECTED);
   await expectAboveCaption(page, tiles[0], tiles[1]);
   await recording.caption('Draw a frame around tiles to select them');

   const scale = await dashboard.canvasScale();
   await expect.poll(() => tiles[0].titleHitsTile()).toBe(true);
   const before = await dashboard.tileBoxes();
   await tiles[0].startMoveBy(100 * scale, 0);
   await tiles[0].release();
   const after = await dashboard.tileBoxes();
   for (const i of [0, 1]) {
      expect(Math.abs(after[i].x - before[i].x - 100 * scale)).toBeLessThanOrEqual(SNAP_TOLERANCE_PX);
   }
   await expectAboveCaption(page, tiles[0], tiles[1]);
   await recording.caption('Drag one of them to move the whole selection');

   await dashboard.pagingToggles.portraitButton.click();
   await expect(dashboard.pagingToggles.portraitButton).toHaveClass(ACTIVE);
   const portraitSheet = await dashboard.sheets.first().boundingBox();
   expect(portraitSheet.height / portraitSheet.width).toBeCloseTo(297 / 210, 2);
   await recording.caption('Portrait Pages fit the tiles to the page width');

   await recording.pointAt(dashboard.pagingToggles.printButton);
   await expect(dashboard.pagingToggles.printButton).toBeEnabled();
   await recording.caption('Print the pages or save them as PDF');

   await recording.save();
});
