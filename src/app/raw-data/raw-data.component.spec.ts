import { CUSTOM_ELEMENTS_SCHEMA, NgZone, provideZoneChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { Column, DataType, ExportFormat, Page, Query, Route, Scene } from 'app/shared/model';
import { ConfigRecord } from 'app/shared/model/view-config';
import { DialogService, ExportService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { SortLimitationWorkaround } from 'app/shared/services/backend/couchdb';
import { queryToQueryDef } from 'app/shared/services/view-persistence/filter/query-to-filter-converter';
import { ColumnResizeDirective } from 'app/shared/directives/column-resize.directive';
import { SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { DomMetrics } from 'app/shared/ui/table-fit/dom-metrics';
import { TextMeasurer } from 'app/shared/ui/table-fit/text-measurer';
import { of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { ColumnAutoSizer } from './column-auto-sizer';
import { RawDataBlockCache } from './raw-data-block-cache';
import { RawDataComponent } from './raw-data.component';

describe('RawDataComponent', () => {

  const ROW_HEIGHT = RawDataComponent.ROW_HEIGHT;
  const FRAME_LIMIT = 120;
  const LONG_HOST = 'server-with-a-much-longer-host-name';

  let now: number;
  let scene: Scene;
  let columns: Column[];
  let total: number;
  let longDataFrom: number;
  let longHostFrom: number;
  let component: RawDataComponent;
  let fixture: ComponentFixture<RawDataComponent>;
  const dbService: DBService = new DBService(null);
  const dialogService = new DialogService(null);
  const notificationService = new NotificationServiceMock();
  let exportService: ExportService;
  let requestEntriesPageSpy: Mock;

  beforeEach(() => {
    now = new Date().getTime();
    total = 1234;
    longDataFrom = Number.MAX_SAFE_INTEGER;
    longHostFrom = Number.MAX_SAFE_INTEGER;
    columns = [
      { name: 'Time', dataType: DataType.TIME, width: 12, format: 'yyyy-MM-dd HH:mm:ss SSS' },
      { name: 'Level', dataType: DataType.TEXT, width: 5, indexed: true },
      { name: 'Data', dataType: DataType.TEXT, width: 20 },
      { name: 'Host', dataType: DataType.TEXT, width: 8 },
      { name: 'Nested', dataType: DataType.OBJECT, width: 6 },
      { name: 'Amount', dataType: DataType.NUMBER, width: 6, indexed: true }
    ];
    scene = SceneFactory.createScene('1', columns);
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [RawDataComponent, ColumnResizeDirective],
      imports: [MatProgressBarModule, MatMenuModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSnackBarModule, MatBottomSheetModule],
      providers: [
        provideZoneChangeDetection(),
        provideRouter([]),
        MatBottomSheet,
        { provide: DBService, useValue: dbService },
        { provide: DialogService, useValue: dialogService },
        { provide: NotificationService, useValue: notificationService }
      ]
    });
    vi.spyOn(dbService, 'getActiveScene').mockReturnValue(scene);
    vi.spyOn(dbService, 'isCouchDbInUse').mockReturnValue(false);
    requestEntriesPageSpy = vi.spyOn(dbService, 'requestEntriesPage').mockImplementation(pageOf);
    vi.spyOn(dialogService, 'showConfirmDialog').mockReturnValue(null);
    exportService = TestBed.inject(ExportService);
    fixture = TestBed.createComponent(RawDataComponent);
    component = fixture.componentInstance;
    fixture.nativeElement.style.height = '400px';
    fixture.nativeElement.style.width = '1200px';
  });

  function entryAt(index: number): object {
    const entry = {
      _id: String(index),
      Time: now - index * 1000,
      Level: ['INFO', 'WARN', 'ERROR'][index % 3],
      Data: index === 1 || index >= longDataFrom ? 'word '.repeat(60) + index : 'line ' + index,
      Host: index >= longHostFrom ? LONG_HOST : 'server-node-' + index % 2,
      Nested: index === 0 ? '{ "a": 1 }' : null,
      Amount: index * 10
    };
    return index % 7 === 0 ? { ...entry, bgcolor: '#ffeeee', fgcolor: '#990000' } : entry;
  }

  function pageOf(query: Query): Promise<Page> {
    const start = query.getPageIndex() * query.getRowsPerPage();
    const count = Math.max(0, Math.min(query.getRowsPerPage(), total - start));
    const entries = Array.from({ length: count }, (_, i) => entryAt(start + i));
    return Promise.resolve({ query, entries, totalRowCount: total });
  }

  function requestedQuery(call: number): Query {
    return requestEntriesPageSpy.mock.calls.at(call)[0];
  }

  function requestedBlocks(): number[] {
    return requestEntriesPageSpy.mock.calls.map(call => (call[0] as Query).getPageIndex());
  }

  function scroller(): HTMLDivElement {
    return fixture.nativeElement.querySelector('.vt');
  }

  function rowElement(index: number): HTMLDivElement {
    return fixture.nativeElement.querySelector('.vt-row[data-index="' + index + '"]');
  }

  function cellOf(index: number, columnName: string): HTMLDivElement {
    return rowElement(index).children[columns.findIndex(c => c.name === columnName)] as HTMLDivElement;
  }

  function columnIndex(name: string): number {
    return columns.findIndex(c => c.name === name);
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    await DomMetrics.waitStable(() => [component.gridHeight, component.gridWidth, component.virtualItems.length,
    fixture.nativeElement.querySelectorAll('.vt-loading').length, requestEntriesPageSpy.mock.calls.length].join(), 3, FRAME_LIMIT);
  }

  async function render(): Promise<void> {
    fixture.detectChanges();
    await settle();
  }

  async function scrollToRow(index: number): Promise<void> {
    scroller().scrollTop = index * ROW_HEIGHT;
    await DomMetrics.waitFrames(() => !!rowElement(index), FRAME_LIMIT);
    await settle();
  }

  function nextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));
  }

  describe('loading and rendering', () => {

    it('should load first block on init', async () => {

      // when
      await render();

      // then
      expect(requestedQuery(0).getPageIndex()).toBe(0);
      expect(requestedQuery(0).getRowsPerPage()).toBe(RawDataBlockCache.BLOCK_SIZE);
      expect(component.totalRowCount).toBe(1234);
      expect(fixture.nativeElement.querySelector('.row-count').textContent).toBe('1,234 rows');
    });

    it('should show progress bar while loading', () => {

      // given
      requestEntriesPageSpy.mockReturnValue(new Promise(() => undefined));

      // when
      fixture.detectChanges();

      // then
      expect(fixture.nativeElement.querySelector('mat-progress-bar')).not.toBeNull();
    });

    it('should render placeholder for rows not loaded', async () => {

      // given
      await render();
      requestEntriesPageSpy.mockReturnValue(new Promise(() => undefined));

      // when
      scroller().scrollTop = 600 * ROW_HEIGHT;
      await DomMetrics.waitFrames(() => !!rowElement(600), FRAME_LIMIT);

      // then
      expect(rowElement(600).querySelector('.vt-loading').textContent).toBe('…');
    });

    it('should size body for all rows in single-line mode', async () => {

      // when
      await render();

      // then
      expect(component.totalSize).toBe(1234 * ROW_HEIGHT);
      expect(fixture.nativeElement.querySelector('.vt-body').offsetHeight).toBe(1234 * ROW_HEIGHT);
      expect(rowElement(1).getBoundingClientRect().height).toBe(ROW_HEIGHT);
    });

    it('should request blocks of scrolled range', async () => {

      // given
      await render();

      // when
      await scrollToRow(600);

      // then
      expect(requestedBlocks()).toContain(6);
      expect(requestedBlocks()).not.toContain(2);
      expect(cellOf(600, 'Data').textContent).toBe('line 600');
    });

    it('should notify error in zone when block request fails', async () => {

      // given
      requestEntriesPageSpy.mockRejectedValue('server error');
      let inZone: boolean;
      vi.spyOn(component, 'notifyError').mockImplementation(() => inZone = NgZone.isInAngularZone());

      // when
      await render();

      // then
      expect(component.notifyError).toHaveBeenCalledWith('server error');
      expect(inZone).toBe(true);
      expect(component.loading).toBe(false);
    });
  });

  describe('row modes', () => {

    it('should cut long text and show it as title in single-line mode', async () => {

      // when
      await render();

      // then
      const cell = cellOf(1, 'Data');
      expect(cell.getAttribute('title')).toBe(cell.textContent);
      expect(cell.scrollWidth).toBeGreaterThan(cell.clientWidth);
      expect(rowElement(1).getBoundingClientRect().height).toBe(ROW_HEIGHT);
    });

    it('should grow row with content in multi-line mode', async () => {

      // given
      await render();

      // when
      component.toggleMultiLine();
      await settle();

      // then
      expect(rowElement(1).getBoundingClientRect().height).toBeGreaterThan(ROW_HEIGHT);
      expect(rowElement(2).getBoundingClientRect().height).toBe(ROW_HEIGHT);
      expect(cellOf(1, 'Data').hasAttribute('title')).toBe(false);
      expect(component.totalSize).toBeGreaterThan(1234 * ROW_HEIGHT);
    });

    it('#toggleMultiLine should return to fixed row height', async () => {

      // given
      await render();
      component.toggleMultiLine();
      await settle();

      // when
      component.toggleMultiLine();
      await settle();

      // then
      expect(rowElement(1).getBoundingClientRect().height).toBe(ROW_HEIGHT);
      expect(component.totalSize).toBe(1234 * ROW_HEIGHT);
    });

    it('#reload should forget measured heights', async () => {

      // given
      longDataFrom = 1200;
      await render();
      component.toggleMultiLine();
      await scrollToRow(1233);
      expect(component.totalSize).toBeGreaterThan(1234 * ROW_HEIGHT);
      longDataFrom = Number.MAX_SAFE_INTEGER;

      // when
      component.onFilterChanged(new Query());
      await settle();

      // then
      expect(rowElement(1).getBoundingClientRect().height).toBeGreaterThan(ROW_HEIGHT);
      expect(component.totalSize).toBe(1233 * ROW_HEIGHT + rowElement(1).getBoundingClientRect().height);
    });
  });

  describe('sort and filter', () => {

    it('#sortBy should cycle asc desc none and reload', async () => {

      // given
      await render();
      const level = columns[columnIndex('Level')];

      // when
      component.sortBy(level);
      await settle();
      const firstSort = requestedQuery(-1).getSort();
      component.sortBy(level);
      await settle();
      const secondSort = requestedQuery(-1).getSort();
      component.sortBy(level);
      await settle();

      // then
      expect(firstSort).toEqual({ active: 'Level', direction: 'asc' });
      expect(secondSort).toEqual({ active: 'Level', direction: 'desc' });
      expect(requestedQuery(-1).hasSort()).toBe(false);
      expect(requestedBlocks()).toEqual([0, 0, 0, 0]);
    });

    it('#click on sortable header should sort', async () => {

      // given
      await render();
      const header: HTMLElement = fixture.nativeElement.querySelectorAll('.vt-th')[columnIndex('Amount')];

      // when
      header.click();
      await settle();

      // then
      expect(component.query.getSort()).toEqual({ active: 'Amount', direction: 'asc' });
      expect(header.querySelector('.vt-sort').textContent).toBe('▲');
    });

    it('#sortBy should start asc when direction empty', async () => {

      // given
      await render();
      component.query.setSort({ active: 'Level', direction: '' });

      // when
      component.sortBy(columns[columnIndex('Level')]);

      // then
      expect(component.query.getSort()).toEqual({ active: 'Level', direction: 'asc' });
    });

    it('#sortBy should ignore not indexed column', async () => {

      // given
      await render();

      // when
      component.sortBy(columns[columnIndex('Data')]);
      await settle();

      // then
      expect(component.query.hasSort()).toBe(false);
      expect(requestedBlocks()).toEqual([0]);
    });

    it('#sortIndicator should show direction', async () => {

      // given
      await render();
      const level = columns[columnIndex('Level')];
      const amount = columns[columnIndex('Amount')];

      // when
      const unsorted = component.sortIndicator(level);
      component.query.setSort({ active: 'Level', direction: 'asc' });
      const asc = component.sortIndicator(level);
      const other = component.sortIndicator(amount);
      component.query.setSort({ active: 'Level', direction: 'desc' });
      const desc = component.sortIndicator(level);
      component.query.setSort({ active: 'Level', direction: '' });
      const empty = component.sortIndicator(level);

      // then
      expect([unsorted, asc, other, desc, empty]).toEqual(['', '▲', '', '▼', '']);
    });

    it('should show CouchDB sort info dialog once when first block loaded with sort', async () => {

      // given
      SortLimitationWorkaround.couchDbSortLimitationDialogData.rememberChoice = false;
      vi.mocked(dbService.isCouchDbInUse).mockReturnValue(true);
      await render();

      // when
      component.sortBy(columns[columnIndex('Level')]);
      await settle();
      await scrollToRow(600);

      // then
      expect(dialogService.showConfirmDialog).toHaveBeenCalledTimes(1);
      expect(dialogService.showConfirmDialog).toHaveBeenCalledWith(SortLimitationWorkaround.couchDbSortLimitationDialogData);
    });

    it('should not show CouchDB sort info dialog when user suppressed it', async () => {

      // given
      SortLimitationWorkaround.couchDbSortLimitationDialogData.rememberChoice = true;
      vi.mocked(dbService.isCouchDbInUse).mockReturnValue(true);
      await render();

      // when
      component.sortBy(columns[columnIndex('Level')]);
      await settle();

      // then
      expect(dialogService.showConfirmDialog).not.toHaveBeenCalled();
    });

    it('#onFilterChanged should keep sort and reload', async () => {

      // given
      await render();
      component.sortBy(columns[columnIndex('Level')]);
      await settle();
      const query = new Query();
      query.setFullTextFilter('x');

      // when
      component.onFilterChanged(query);
      await settle();

      // then
      expect(component.query).toBe(query);
      expect(requestedQuery(-1).getSort()).toEqual({ active: 'Level', direction: 'asc' });
      expect(requestedQuery(-1).getFullTextFilter()).toBe('x');
      expect(requestedQuery(-1).getPageIndex()).toBe(0);
    });

    it('#reload should request first block after scrolling', async () => {

      // given
      await render();
      await scrollToRow(1000);
      const callCount = requestEntriesPageSpy.mock.calls.length;

      // when
      component.onFilterChanged(new Query());
      await settle();

      // then
      expect(requestedBlocks().slice(callCount)).toEqual([0]);
      expect(scroller().scrollTop).toBe(0);
    });
  });

  describe('widths', () => {

    it('should convert em widths', async () => {

      // when
      await render();

      // then
      expect(component.widths[columnIndex('Level')]).toBe(5 * RawDataComponent.EM_PX);
      expect(fixture.nativeElement.querySelectorAll('.vt-th')[columnIndex('Level')].getBoundingClientRect().width).toBe(70);
    });

    it('should use px widths', async () => {

      // given
      scene.context = [{ name: 'Profile', value: 'Billing' }];

      // when
      await render();

      // then
      expect(component.widths[columnIndex('Level')]).toBe(5);
    });

    it('#resizeColumn should change width from drag start and refit', async () => {

      // given
      await render();
      const index = columnIndex('Data');
      const startWidth = component.widths[index];
      const gridWidth = component.gridWidth;

      // when
      component.resizeColumn(index, 50);
      component.resizeColumn(index, 80);

      // then
      expect(component.widths[index]).toBe(startWidth + 80);
      expect(component.columnsWidth).toBe(component.widths.reduce((a, b) => a + b));
      expect(component.gridWidth).toBe(gridWidth + 80);
      expect(component.customWidths).toEqual({ Data: startWidth + 80 });
    });

    it('#resizeColumn should not go below min width', async () => {

      // given
      await render();

      // when
      component.resizeColumn(columnIndex('Level'), -1000);

      // then
      expect(component.widths[columnIndex('Level')]).toBe(ColumnAutoSizer.MIN);
    });

    it('#endResize should start next drag from current width', async () => {

      // given
      await render();
      const index = columnIndex('Data');
      const startWidth = component.widths[index];
      component.resizeColumn(index, 50);
      component.endResize();

      // when
      component.resizeColumn(index, 30);

      // then
      expect(component.widths[index]).toBe(startWidth + 80);
    });

    it('#drag on resize handle should resize column without sorting', async () => {

      // given
      await render();
      const index = columnIndex('Level');
      const handle: HTMLElement = fixture.nativeElement.querySelectorAll('.vt-resize')[index];

      // when
      handle.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 100, bubbles: true }));
      handle.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 130, bubbles: true }));
      handle.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 130, bubbles: true }));
      handle.click();

      // then
      expect(component.widths[index]).toBe(70 + 30);
      expect(component.query.hasSort()).toBe(false);
    });

    it('#resizeColumn should add horizontal scrollbar height when columns overflow in route mode', async () => {

      // given
      vi.spyOn(DomMetrics, 'scrollbarWidth').mockReturnValue(15);
      await render();
      const gridHeight = component.gridHeight;

      // when
      component.resizeColumn(columnIndex('Data'), 2000);
      await settle();

      // then
      expect(component.gridHeight).toBe(gridHeight + 15);
    });

    it('#resizeColumn should keep custom width when widths reapplied', async () => {

      // given
      await render();
      component.resizeColumn(columnIndex('Level'), 30);
      component.endResize();

      // when
      component.onFilterChanged(new Query());
      await settle();

      // then
      expect(component.widths[columnIndex('Level')]).toBe(100);
    });

    it('#toggleConsiderColumnWidths should discard custom widths', async () => {

      // given
      await render();
      component.resizeColumn(columnIndex('Level'), 30);

      // when
      component.toggleConsiderColumnWidths();
      component.toggleConsiderColumnWidths();

      // then
      expect(component.customWidths).toEqual({});
      expect(component.widths[columnIndex('Level')]).toBe(70);
    });

    it('should auto size columns from loaded rows when widths ignored', async () => {

      // given
      await render();
      const measurer = new TextMeasurer(RawDataComponent.FONT);
      const texts = Array.from({ length: 100 }, (_, i) => String(component.formattedValueOf(columns[columnIndex('Host')], entryAt(i))));

      // when
      component.toggleConsiderColumnWidths();
      await settle();

      // then
      const headerWidth = ColumnAutoSizer.width(['Host'], t => measurer.width(t)) + RawDataComponent.SORT_WIDTH;
      expect(component.widths[columnIndex('Host')]).toBe(Math.max(headerWidth, ColumnAutoSizer.width(texts, t => measurer.width(t))));
      expect(component.widths[columnIndex('Data')]).toBe(ColumnAutoSizer.MAX);
    });

    it('#toggleConsiderColumnWidths should auto size from all cached blocks', async () => {

      // given
      longHostFrom = 1200;
      await render();
      await scrollToRow(1233);
      const measurer = new TextMeasurer(RawDataComponent.FONT);

      // when
      component.toggleConsiderColumnWidths();

      // then
      expect(component.widths[columnIndex('Host')]).toBe(ColumnAutoSizer.width([LONG_HOST], t => measurer.width(t)));
    });

    it('should not auto size header beyond max width', async () => {

      // given
      columns[columnIndex('Host')].name = 'H'.repeat(200);
      await render();

      // when
      component.toggleConsiderColumnWidths();

      // then
      expect(component.widths[columnIndex('H'.repeat(200))]).toBe(ColumnAutoSizer.MAX);
    });

    it('should auto size column without scene width when widths considered', async () => {

      // given
      columns[columnIndex('Host')].width = null;
      const measurer = new TextMeasurer(RawDataComponent.FONT);

      // when
      await render();

      // then
      const expected = ColumnAutoSizer.width(['server-node-0', 'server-node-1'], t => measurer.width(t));
      expect(expected).toBeGreaterThan(ColumnAutoSizer.width(['Host'], t => measurer.width(t)) + RawDataComponent.SORT_WIDTH);
      expect(component.widths[columnIndex('Host')]).toBe(expected);
    });
  });

  describe('interaction', () => {

    it('should select row on click', async () => {

      // given
      await render();

      // when
      rowElement(3).click();
      fixture.detectChanges();

      // then
      expect(component.selectedIndex).toBe(3);
      expect(rowElement(3).classList).toContain('selected');
      expect(getComputedStyle(rowElement(3)).backgroundColor).toBe('rgb(204, 232, 255)');
    });

    it('should render selection of row created while scrolling', async () => {

      // given
      fixture.autoDetectChanges();
      await settle();
      await scrollToRow(600);

      // when
      rowElement(601).click();
      await fixture.whenStable();

      // then
      expect(rowElement(601).classList).toContain('selected');
    });

    it('should color row from bgcolor and fgcolor when highlight on', async () => {

      // when
      await render();

      // then
      expect(getComputedStyle(rowElement(7)).backgroundColor).toBe('rgb(255, 238, 238)');
      expect(getComputedStyle(rowElement(7)).color).toBe('rgb(153, 0, 0)');
    });

    it('#toggleHighlight should remove row colors', async () => {

      // given
      await render();

      // when
      component.toggleHighlight();
      fixture.detectChanges();

      // then
      expect(getComputedStyle(rowElement(7)).backgroundColor).toBe('rgb(247, 247, 247)');
      expect(getComputedStyle(rowElement(7)).color).toBe('rgb(0, 0, 0)');
    });

    it('should open object dialog on object cell click', async () => {

      // given
      await render();

      // when
      cellOf(0, 'Nested').click();

      // then
      expect(dialogService.showConfirmDialog).toHaveBeenCalled();
    });

    it('should right align number cells', async () => {

      // when
      await render();

      // then
      expect(getComputedStyle(cellOf(1, 'Amount')).textAlign).toBe('right');
    });
  });

  describe('fit', () => {

    it('should fit height to content when few rows', async () => {

      // given
      total = 5;

      // when
      await render();

      // then
      expect(component.gridHeight).toBe(RawDataComponent.HEADER_HEIGHT + RawDataComponent.BORDER + 5 * ROW_HEIGHT);
      expect(scroller().offsetHeight).toBe(component.gridHeight);
    });

    it('should cap height at host when many rows', async () => {

      // when
      await render();

      // then
      const hostBottom = fixture.nativeElement.getBoundingClientRect().bottom;
      expect(scroller().getBoundingClientRect().bottom).toBeLessThanOrEqual(hostBottom);
      expect(scroller().scrollHeight).toBeGreaterThan(scroller().clientHeight);
    });

    it('should widen in dialog style by column widths', async () => {

      // given
      component.dialogStyle = true;
      component.hideToolbar = true;
      fixture.nativeElement.style.width = 'fit-content';

      // when
      await render();

      // then
      const expected = component.columnsWidth + DomMetrics.scrollbarWidth() + RawDataComponent.BORDER;
      expect(component.gridWidth).toBe(expected);
      expect(scroller().getBoundingClientRect().width).toBe(expected);
    });

    it('should refit when content width changes', async () => {

      // given
      vi.spyOn(DomMetrics, 'scrollbarWidth').mockReturnValue(15);
      await render();
      const gridHeight = component.gridHeight;

      // when
      fixture.nativeElement.style.width = '300px';
      await settle();
      const narrowGridHeight = component.gridHeight;
      fixture.nativeElement.style.width = '3000px';
      await settle();

      // then
      expect(narrowGridHeight).toBe(gridHeight + 15);
      expect(component.gridHeight).toBe(gridHeight);
    });

    it('should refit once per frame for several content resizes', async () => {

      // given
      await render();
      const onVirtualizerChange = vi.spyOn(component as unknown as { onVirtualizerChange: () => void }, 'onVirtualizerChange');

      // when
      component['scheduleContentRefit']();
      component['scheduleContentRefit']();
      component['scheduleContentRefit']();
      await nextFrame();

      // then
      expect(onVirtualizerChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('config and lifecycle', () => {

    it('#ngOnInit should navigate to scenes view when no scene is active', async () => {

      // given
      vi.mocked(dbService.getActiveScene).mockReturnValue(null);
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigateByUrl').mockReturnValue(undefined);

      // when
      component.ngOnInit();

      // then
      expect(router.navigateByUrl).toHaveBeenCalledWith(Route.SCENES);
    });

    it('#ngOnInit should not define new query when query is defined', async () => {

      // given
      const query = new Query();
      component.query = query;

      // when
      await render();

      // then
      expect(component.query).toBe(query);
    });

    it('#configToBeSaved should include flags, sort and custom column widths', async () => {

      // given
      await render();
      component.sortBy(columns[columnIndex('Level')]);
      component.toggleMultiLine();
      component.toggleHighlight();
      component.resizeColumn(columnIndex('Data'), 10);

      // when
      const config = component.configToBeSaved();

      // then
      expect(config.query.getSort()).toEqual({ active: 'Level', direction: 'asc' });
      expect(config.data).toEqual({
        considerColumnWidths: true, highlight: false, multiLine: true, columnWidths: { Data: 20 * RawDataComponent.EM_PX + 10 }
      });
      expect(config.data.columnWidths).not.toBe(component.customWidths);
    });

    it('#loadConfig should restore flags, custom column widths and sort and reload', async () => {

      // given
      await render();
      const query = new Query();
      query.setSort({ active: 'Amount', direction: 'desc' });
      const record: ConfigRecord = {
        route: Route.RAWDATA, name: 'my view', modifiedTime: now, query: queryToQueryDef(query),
        data: { considerColumnWidths: true, highlight: false, multiLine: true, columnWidths: { Level: 99, Unknown: 5 } }
      };

      // when
      component.loadConfig(record);
      await settle();

      // then
      expect(component.highlight).toBe(false);
      expect(component.multiLine).toBe(true);
      expect(component.widths[columnIndex('Level')]).toBe(99);
      expect(component.widths.length).toBe(columns.length);
      expect(requestedQuery(-1).getSort()).toEqual({ active: 'Amount', direction: 'desc' });
      expect(requestedQuery(-1).getPageIndex()).toBe(0);
    });

    it('#loadConfig should default multiLine to false and widths to scene widths for old records', async () => {

      // given
      await render();
      component.toggleMultiLine();
      const record: ConfigRecord = {
        route: Route.RAWDATA, name: 'old view', modifiedTime: now, query: queryToQueryDef(new Query()),
        data: { pageDef: { queryDef: queryToQueryDef(new Query()), totalRowCount: 9 }, considerColumnWidths: true, highlight: true }
      };

      // when
      component.loadConfig(record);
      await settle();

      // then
      expect(component.multiLine).toBe(false);
      expect(component.customWidths).toEqual({});
      expect(component.widths[columnIndex('Level')]).toBe(70);
    });

    it('#ngAfterViewInit should open view launcher when records exist', async () => {

      // given
      scene.config.records = [{ route: Route.RAWDATA, name: 'v', modifiedTime: now, query: queryToQueryDef(new Query()), data: {} }];
      vi.spyOn(dialogService, 'showConfigLauncherDialog').mockReturnValue(null);

      // when
      await render();

      // then
      expect(dialogService.showConfigLauncherDialog).toHaveBeenCalledWith(component);
    });

    it('#ngOnDestroy should cancel cache and remove listeners', async () => {

      // given
      await render();
      const cancel = vi.spyOn(RawDataBlockCache.prototype, 'cancel');
      const callCount = requestEntriesPageSpy.mock.calls.length;

      // when
      fixture.destroy();
      scroller().scrollTop = 600 * ROW_HEIGHT;
      await nextFrame();
      await nextFrame();

      // then
      expect(cancel).toHaveBeenCalled();
      expect(requestEntriesPageSpy.mock.calls.length).toBe(callCount);
    });

    it('#ngOnDestroy should ignore late observer callbacks', async () => {

      // given
      await render();
      const scrollerElement = scroller();
      const callCount = requestEntriesPageSpy.mock.calls.length;
      fixture.destroy();
      scrollerElement.scrollTop = 600 * ROW_HEIGHT;

      // when
      component['virtualizer'].options.onChange(component['virtualizer'], false);
      component['scheduleContentRefit']();
      await nextFrame();

      // then
      expect(requestEntriesPageSpy.mock.calls.length).toBe(callCount);
    });

    it('#ngOnDestroy should not fail when no scene was active', () => {

      // given
      vi.mocked(dbService.getActiveScene).mockReturnValue(null);
      vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockReturnValue(undefined);
      component.ngOnInit();

      // when
      const destroy = () => fixture.destroy();

      // then
      expect(destroy).not.toThrow();
    });
  });

  describe('values and export', () => {

    beforeEach(async () => {
      await render();
    });

    it('#formattedValueOf should return empty string when object value is null', () => {

      // given
      const column: Column = { name: 'Nested', dataType: DataType.OBJECT, width: 100 };
      const entry = { ID: 1, Nested: null };

      // when
      const formatted = component.formattedValueOf(column, entry);

      // then
      expect(formatted).toBe('');
    });

    it('#formattedValueOf should return ellipsis when object value is defined', () => {

      // given
      const column: Column = { name: 'Nested', dataType: DataType.OBJECT, width: 100 };
      const entry = { ID: 1, Nested: '{ a: \'x\' }' };

      // when
      const formatted = component.formattedValueOf(column, entry);

      // then
      expect(formatted).toBe('...');
    });

    it('#formattedValueOf should return empty string when number value is null', () => {

      // given
      const column: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 100 };
      const entry = { ID: 1, Amount: null };

      // when
      const formatted = component.formattedValueOf(column, entry);

      // then
      expect(formatted).toBe('');
    });

    it('#formattedValueOf should return formatted time using column displayFormat', () => {

      // given
      const column: Column = {
        name: 'Time', dataType: DataType.TIME, width: 100,
        format: 'yyyy-MM-dd HH:mm:ss SSS'
      };
      const time = new Date('2019-01-30T18:24:17').getTime() + 557;
      const entry = { ID: 1, Time: time };

      // when
      const formatted = component.formattedValueOf(column, entry);

      // then
      expect(formatted).toBe('2019-01-30 18:24:17 557');
    });

    it('#formattedValueOf should return formatted number using current locale', () => {

      // given
      const column: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 100 };
      const entry = { ID: 1, Amount: 15_000 };

      // when
      const formatted = component.formattedValueOf(column, entry);

      // then
      expect(formatted).toBe((15_000).toLocaleString());
    });

    it('#formattedValueOf should return value when value is text', () => {

      // given
      const column: Column = { name: 'Host', dataType: DataType.TEXT, width: 100 };
      const entry = { ID: 1, Host: 'server1' };

      // when
      const formatted = component.formattedValueOf(column, entry);

      // then
      expect(formatted).toBe('server1');
    });

    it('#displayValue should display dialog when data type is OBJECT', () => {

      // given
      const column: Column = { name: 'Data', dataType: DataType.OBJECT, width: 100 };
      const entry = { ID: 1, Data: '[ 1, 2, 3]' };

      // when
      component.displayValue(column, entry);

      // then
      expect(dialogService.showConfirmDialog).toHaveBeenCalled();
    });

    it('#displayValue should not display dialog when data type is not OBJECT', () => {

      // given
      const column: Column = { name: 'Host', dataType: DataType.TEXT, width: 100 };
      const entry = { ID: 1, Host: 'server1' };

      // when
      component.displayValue(column, entry);

      // then
      expect(dialogService.showConfirmDialog).not.toHaveBeenCalled();
    });

    it.each([ExportFormat.CSV, ExportFormat.EXCEL, ExportFormat.JSON])('#saveAs should save complete data as %s file', async exportFormat => {

      // given
      vi.spyOn(dbService, 'findEntries').mockReturnValue(of([entryAt(0)]));
      vi.spyOn(component.snackBar, 'open');
      vi.spyOn(exportService, 'exportData').mockImplementation(() => null);

      // when
      component.saveAs(exportFormat);
      await fixture.whenStable();

      // then
      expect(component.snackBar.open).toHaveBeenCalledWith('complete data is collected and saves as ' + exportFormat + ' in the background',
        undefined, { duration: 4000 });
      expect(exportService.exportData).toHaveBeenCalledWith([entryAt(0)], columns, exportFormat, 'Raw-Data');
    });

    it.each([ExportFormat.CSV, ExportFormat.EXCEL, ExportFormat.JSON])('#saveAs should save filtered data as %s file', async exportFormat => {

      // given
      vi.spyOn(dbService, 'findEntries').mockReturnValue(of([entryAt(0)]));
      vi.spyOn(component.snackBar, 'open');
      vi.spyOn(exportService, 'exportData').mockImplementation(() => null);
      component.query.setFullTextFilter('x');

      // when
      component.saveAs(exportFormat);
      await fixture.whenStable();

      // then
      expect(component.snackBar.open).toHaveBeenCalledWith('filtered data is collected and saves as ' + exportFormat + ' in the background',
        undefined, { duration: 4000 });
      expect(exportService.exportData).toHaveBeenCalledWith([entryAt(0)], columns, exportFormat, 'Raw-Data');
    });

    it('#saveAs should notify error', async () => {

      // given
      vi.spyOn(dbService, 'findEntries').mockReturnValue(throwError(() => ({ status: 404 })));
      vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);

      // when
      component.saveAs(ExportFormat.JSON);
      await fixture.whenStable();

      // then
      expect(notificationService.onError).toHaveBeenCalled();
    });

    it('#click on print button should print window', () => {

      // given
      const printButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_print')).nativeElement;
      vi.spyOn(window, 'print').mockReturnValue(undefined);

      // when
      printButton.click();

      // then
      expect(window.print).toHaveBeenCalled();
    });

    it('#click on multi-line button should toggle multi-line', () => {

      // given
      const button: HTMLButtonElement = fixture.debugElement.queryAll(By.css('#view_toolbar button'))
        .map(b => b.nativeElement).find(b => b.textContent.includes('format_line_spacing'));

      // when
      button.click();
      fixture.detectChanges();

      // then
      expect(component.multiLine).toBe(true);
      expect(scroller().classList).toContain('multi-line');
    });
  });
});
