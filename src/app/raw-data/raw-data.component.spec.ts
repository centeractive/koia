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
import { ColumnResizeDirective } from 'app/shared/directives/column-resize.directive';
import { Column, DataType, ExportFormat, Page, Query, Route, Scene } from 'app/shared/model';
import { RawDataState } from 'app/shared/model/view-config';
import { DialogService, ExportService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { SortLimitationWorkaround } from 'app/shared/services/backend/couchdb';
import { RawDataStateService } from 'app/shared/services/saved-views';
import { queryToQueryDef } from 'app/shared/services/view-persistence/filter/query-to-filter-converter';
import { SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { DomMetrics } from 'app/shared/ui/table-fit/dom-metrics';
import { waitFrames, waitStable } from 'app/shared/test/animation-frames';
import { TextMeasurer } from 'app/shared/ui/table-fit/text-measurer';
import { ColumnAutoSizer } from 'app/shared/ui/virtual-table/column-auto-sizer';
import { ColumnWidthResolver } from 'app/shared/ui/virtual-table/column-width-resolver';
import { TableModeTogglesComponent } from 'app/shared/ui/virtual-table/table-mode-toggles.component';
import { VirtualTableComponent } from 'app/shared/ui/virtual-table/virtual-table.component';
import { of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { RawDataBlockCache } from './raw-data-block-cache';
import { RawDataComponent } from './raw-data.component';
import { PageHeadingComponent } from 'app/shared/ui/print-heading/page-heading.component';
import { PrintHeadingComponent } from 'app/shared/ui/print-heading/print-heading.component';
import { ViewToolbarComponent } from 'app/shared/ui/view-toolbar/view-toolbar.component';

describe('RawDataComponent', () => {

  const ROW_HEIGHT = VirtualTableComponent.ROW_HEIGHT;
  const EM_PX = ColumnWidthResolver.EM_PX;
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
      declarations: [RawDataComponent, VirtualTableComponent, TableModeTogglesComponent, ViewToolbarComponent, PageHeadingComponent, PrintHeadingComponent,
        ColumnResizeDirective],
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

  function table(): VirtualTableComponent {
    return fixture.debugElement.query(By.directive(VirtualTableComponent)).componentInstance;
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

  function toolbarButton(icon: string): HTMLButtonElement {
    return fixture.debugElement.queryAll(By.css('.view_toolbar button')).map(b => b.nativeElement).find(b => b.textContent.includes(icon));
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    await waitStable(() => [table().gridHeight, table().gridWidth, table().virtualItems.length,
    fixture.nativeElement.querySelectorAll('.vt-loading').length, requestEntriesPageSpy.mock.calls.length].join(), 3, FRAME_LIMIT);
  }

  async function render(): Promise<void> {
    fixture.detectChanges();
    await settle();
  }

  async function change(action: () => void): Promise<void> {
    action();
    fixture.detectChanges();
    await settle();
  }

  async function scrollToRow(index: number): Promise<void> {
    scroller().scrollTop = index * ROW_HEIGHT;
    await waitFrames(() => !!rowElement(index), FRAME_LIMIT);
    await settle();
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

    it('#toggleMultiLine should grow rows with content', async () => {

      // given
      await render();

      // when
      await change(() => component.toggleMultiLine());

      // then
      expect(component.multiLine).toBe(true);
      expect(rowElement(1).getBoundingClientRect().height).toBeGreaterThan(ROW_HEIGHT);
      expect(table().totalSize).toBeGreaterThan(1234 * ROW_HEIGHT);
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
      expect(component.widths[columnIndex('Level')]).toBe(5 * EM_PX);
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

    it('#onColumnResize should replace width and remember custom width', async () => {

      // given
      await render();
      const widths = component.widths;

      // when
      component.onColumnResize({ index: columnIndex('Data'), width: 300 });

      // then
      expect(component.widths[columnIndex('Data')]).toBe(300);
      expect(component.widths).not.toBe(widths);
      expect(component.customWidths).toEqual({ Data: 300 });
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

    it('#onColumnResize should keep custom width when widths reapplied', async () => {

      // given
      await render();
      component.onColumnResize({ index: columnIndex('Level'), width: 100 });

      // when
      component.onFilterChanged(new Query());
      await settle();

      // then
      expect(component.widths[columnIndex('Level')]).toBe(100);
    });

    it('#toggleConsiderColumnWidths should discard custom widths', async () => {

      // given
      await render();
      component.onColumnResize({ index: columnIndex('Level'), width: 100 });

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
      const measurer = new TextMeasurer(ColumnWidthResolver.FONT);
      const texts = Array.from({ length: 100 }, (_, i) => String(entryAt(i)['Host']));

      // when
      await change(() => component.toggleConsiderColumnWidths());

      // then
      const headerWidth = ColumnAutoSizer.width(['Host'], t => measurer.width(t)) + ColumnWidthResolver.SORT_WIDTH;
      expect(component.widths[columnIndex('Host')]).toBe(Math.max(headerWidth, ColumnAutoSizer.width(texts, t => measurer.width(t))));
      expect(component.widths[columnIndex('Data')]).toBe(ColumnAutoSizer.MAX);
    });

    it('#toggleConsiderColumnWidths should auto size from all cached blocks', async () => {

      // given
      longHostFrom = 1200;
      await render();
      await scrollToRow(1233);
      const measurer = new TextMeasurer(ColumnWidthResolver.FONT);

      // when
      component.toggleConsiderColumnWidths();

      // then
      expect(component.widths[columnIndex('Host')]).toBe(ColumnAutoSizer.width([LONG_HOST], t => measurer.width(t)));
    });

    it('#toggleShowNestedObjects should recompute auto widths', async () => {

      // given
      await render();
      component.toggleConsiderColumnWidths();
      const widthOfSpy = vi.spyOn(ColumnWidthResolver.prototype, 'widthOf');
      const loadedRows = component['cache'].loadedRows();

      // when
      await change(() => toolbarButton('code').click());

      // then
      expect(component.showNestedObjects).toBe(true);
      expect(widthOfSpy).toHaveBeenCalledWith(columns[columnIndex('Nested')], component.colWidthMeasurement, false, loadedRows, true);
      const resolver = new ColumnWidthResolver();
      expect(component.widths).toEqual(columns.map(c => resolver.widthOf(c, component.colWidthMeasurement, false, loadedRows, true)));
    });

    it('should auto size column without scene width when widths considered', async () => {

      // given
      columns[columnIndex('Host')].width = null;
      const measurer = new TextMeasurer(ColumnWidthResolver.FONT);

      // when
      await render();

      // then
      const expected = ColumnAutoSizer.width(['server-node-0', 'server-node-1'], t => measurer.width(t));
      expect(expected).toBeGreaterThan(ColumnAutoSizer.width(['Host'], t => measurer.width(t)) + ColumnWidthResolver.SORT_WIDTH);
      expect(component.widths[columnIndex('Host')]).toBe(expected);
    });
  });

  describe('interaction', () => {

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
  });

  describe('fit', () => {

    it('should widen in dialog style by column widths', async () => {

      // given
      component.dialogStyle = true;
      component.hideToolbar = true;
      fixture.nativeElement.style.width = 'fit-content';

      // when
      await render();

      // then
      const expected = table().columnsWidth + DomMetrics.scrollbarWidth() + VirtualTableComponent.BORDER;
      expect(table().gridWidth).toBe(expected);
      expect(scroller().getBoundingClientRect().width).toBe(expected);
    });

    it('dialog style should hide print button', async () => {

      // given
      component.dialogStyle = true;

      // when
      await render();

      // then
      expect(fixture.nativeElement.querySelector('#but_print')).toBeNull();
      expect(fixture.nativeElement.querySelector('.but_view_more')).not.toBeNull();
    });

    it('should show print heading with raw data title and scene name', async () => {

      // when
      await render();

      // then
      const heading: HTMLElement = fixture.nativeElement.querySelector('.div_header > koia-print-heading');
      expect(heading.querySelector('.span_print_title').textContent).toBe('Raw Data');
      expect(heading.querySelector('.span_print_details').textContent).toContain('Scene: Scene 1');
    });

    it('dialog style should not show print heading', async () => {

      // given
      component.dialogStyle = true;

      // when
      await render();

      // then
      expect(fixture.nativeElement.querySelector('koia-print-heading')).toBeNull();
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

    it('should render without table and mode toggles when no scene is active', () => {

      // given
      vi.mocked(dbService.getActiveScene).mockReturnValue(null);
      vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockReturnValue(undefined);

      // when
      const detectChanges = () => fixture.detectChanges();

      // then
      expect(detectChanges).not.toThrow();
      expect(fixture.nativeElement.querySelector('koia-virtual-table')).toBeNull();
      expect(fixture.nativeElement.querySelector('koia-table-mode-toggles')).toBeNull();
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

    it('#ngOnInit should register as raw data state provider', async () => {

      // given
      const rawDataStateService = TestBed.inject(RawDataStateService);
      vi.spyOn(rawDataStateService, 'register');

      // when
      await render();

      // then
      expect(rawDataStateService.register).toHaveBeenCalledWith(component);
    });

    it('#ngOnInit should not register in dialog style', async () => {

      // given
      const rawDataStateService = TestBed.inject(RawDataStateService);
      vi.spyOn(rawDataStateService, 'register');
      component.dialogStyle = true;

      // when
      await render();

      // then
      expect(rawDataStateService.register).not.toHaveBeenCalled();
    });

    it('#ngOnInit should adopt pending raw data state before first block is requested', async () => {

      // given
      const query = new Query();
      query.setSort({ active: 'Amount', direction: 'desc' });
      TestBed.inject(RawDataStateService).apply({
        query: queryToQueryDef(query),
        data: { considerColumnWidths: false, highlight: false, multiLine: true, columnWidths: { Level: 99 } }
      });

      // when
      await render();

      // then
      expect(requestedQuery(0).getSort()).toEqual({ active: 'Amount', direction: 'desc' });
      expect(component.restoredQuery).toBe(component.query);
      expect(component.considerColumnWidths).toBe(false);
      expect(component.highlight).toBe(false);
      expect(component.multiLine).toBe(true);
      expect(component.widths[columnIndex('Level')]).toBe(99);
    });

    it('#rawDataState should provide flags, sort and copy of custom column widths', async () => {

      // given
      await render();
      component.sortBy(columns[columnIndex('Level')]);
      component.toggleMultiLine();
      component.toggleHighlight();
      component.onColumnResize({ index: columnIndex('Data'), width: 20 * EM_PX + 10 });

      // when
      const state = component.rawDataState();

      // then
      expect(state.query.sort).toEqual({ active: 'Level', direction: 'asc' });
      expect(state.data).toEqual({
        considerColumnWidths: true, highlight: false, multiLine: true, columnWidths: { Data: 20 * EM_PX + 10 }
      });
      expect(state.data.columnWidths).not.toBe(component.customWidths);
    });

    it('#applyRawDataState should restore flags, custom column widths and sort and reload', async () => {

      // given
      await render();
      const query = new Query();
      query.setSort({ active: 'Amount', direction: 'desc' });
      const state: RawDataState = {
        query: queryToQueryDef(query),
        data: { considerColumnWidths: true, highlight: false, multiLine: true, columnWidths: { Level: 99, Unknown: 5 } }
      };

      // when
      component.applyRawDataState(state);
      await settle();

      // then
      expect(component.highlight).toBe(false);
      expect(component.multiLine).toBe(true);
      expect(component.widths[columnIndex('Level')]).toBe(99);
      expect(component.widths.length).toBe(columns.length);
      expect(requestedQuery(-1).getSort()).toEqual({ active: 'Amount', direction: 'desc' });
      expect(requestedQuery(-1).getPageIndex()).toBe(0);
    });

    it('#applyRawDataState should not share value ranges with state', async () => {

      // given
      await render();
      const query = new Query();
      query.addValueRangeFilter('Amount', 0, 10);
      const state: RawDataState = { query: queryToQueryDef(query), data: { considerColumnWidths: true, highlight: false } };

      // when
      component.applyRawDataState(state);
      await settle();

      // then
      const valueRange = component.query.findValueRangeFilter('Amount').valueRange;
      expect(valueRange).toEqual(state.query.valueRangeFilters[0].valueRange);
      expect(valueRange).not.toBe(state.query.valueRangeFilters[0].valueRange);
    });

    it('#applyRawDataState should not share column widths with state', async () => {

      // given
      await render();
      const state: RawDataState = {
        query: queryToQueryDef(new Query()), data: { considerColumnWidths: true, highlight: true, columnWidths: { Level: 99 } }
      };
      component.applyRawDataState(state);
      await settle();

      // when
      component.onColumnResize({ index: columnIndex('Level'), width: 50 });

      // then
      expect(state.data.columnWidths).toEqual({ Level: 99 });
    });

    it('#applyRawDataState should default multiLine to false and widths to scene widths for legacy state', async () => {

      // given
      await render();
      component.toggleMultiLine();
      const state = {
        query: queryToQueryDef(new Query()),
        data: { pageDef: { queryDef: queryToQueryDef(new Query()), totalRowCount: 9 }, considerColumnWidths: true, highlight: true }
      } as RawDataState;

      // when
      component.applyRawDataState(state);
      await settle();

      // then
      expect(component.multiLine).toBe(false);
      expect(component.customWidths).toEqual({});
      expect(component.widths[columnIndex('Level')]).toBe(70);
    });

    it('#ngOnDestroy should unregister as raw data state provider', async () => {

      // given
      await render();
      const rawDataStateService = TestBed.inject(RawDataStateService);
      vi.spyOn(rawDataStateService, 'unregister');

      // when
      fixture.destroy();

      // then
      expect(rawDataStateService.unregister).toHaveBeenCalledWith(component);
    });

    it('#ngOnDestroy should cancel cache', async () => {

      // given
      await render();
      const cancel = vi.spyOn(RawDataBlockCache.prototype, 'cancel');

      // when
      fixture.destroy();

      // then
      expect(cancel).toHaveBeenCalled();
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

  describe('export and toolbar', () => {

    beforeEach(async () => {
      await render();
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
      expect(component.snackBar.open).toHaveBeenCalledWith('complete data is collected and saved as ' + exportFormat + ' in the background',
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
      expect(component.snackBar.open).toHaveBeenCalledWith('filtered data is collected and saved as ' + exportFormat + ' in the background',
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

    it('wrap text button should be marked active while column widths are observed', () => {

      // when
      const wrapTextButton = toolbarButton('wrap_text');

      // then
      expect(component.considerColumnWidths).toBe(true);
      expect(wrapTextButton.classList).toContain('koia-toggle-active');
    });

    it('wrap text button should not be marked active while column widths are ignored', async () => {

      // when
      await change(() => toolbarButton('wrap_text').click());

      // then
      expect(component.considerColumnWidths).toBe(false);
      expect(toolbarButton('wrap_text').classList).not.toContain('koia-toggle-active');
    });

    it('highlight button should be marked active while rows are highlighted', () => {

      // when
      const highlightButton = toolbarButton('highlight');

      // then
      expect(component.highlight).toBe(true);
      expect(highlightButton.classList).toContain('koia-toggle-active');
    });

    it('highlight button should not be marked active while rows are not highlighted', () => {

      // when
      toolbarButton('highlight').click();
      fixture.detectChanges();

      // then
      expect(component.highlight).toBe(false);
      expect(toolbarButton('highlight').classList).not.toContain('koia-toggle-active');
    });

    it('#click on multi-line button should toggle multi-line', () => {

      // when
      toolbarButton('format_line_spacing').click();
      fixture.detectChanges();

      // then
      expect(component.multiLine).toBe(true);
      expect(scroller().classList).toContain('multi-line');
    });

    it('#click on nested objects button should show object values', async () => {

      // when
      await change(() => toolbarButton('code').click());

      // then
      expect(component.showNestedObjects).toBe(true);
      expect(cellOf(0, 'Nested').textContent).toBe('{ "a": 1 }');
    });
  });
});
