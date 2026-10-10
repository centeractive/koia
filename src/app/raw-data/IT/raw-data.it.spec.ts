import { CUSTOM_ELEMENTS_SCHEMA, provideZoneChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ColumnResizeDirective } from 'app/shared/directives/column-resize.directive';
import { Column, DataType, ExportFormat, Operator, PropertyFilter, Query, Route } from 'app/shared/model';
import { ConfigRecord } from 'app/shared/model/view-config';
import { DialogService, ExportService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { SortLimitationWorkaround } from 'app/shared/services/backend/couchdb';
import { queryToQueryDef } from 'app/shared/services/view-persistence/filter/query-to-filter-converter';
import { BACKENDS, BackendRun, IT_COLUMNS, IT_PROVIDERS, sceneData, scrollTableTo, setUpBackend, tearDownBackend } from 'app/shared/test/backend-fixture';
import { DomMetrics } from 'app/shared/ui/table-fit/dom-metrics';
import { page } from 'vitest/browser';
import type { Mock } from 'vitest';
import { RawDataViewComponent } from '../raw-data-view.component';
import { RawDataComponent } from '../raw-data.component';

const ENTRY_COUNT = 1234;
const ROW_HEIGHT = RawDataComponent.ROW_HEIGHT;
const TIMEOUT = 30_000;

describe.each(BACKENDS)('RawDataComponent IT ($name)', backend => {

  let run: BackendRun;
  let fixture: ComponentFixture<RawDataViewComponent>;
  let component: RawDataComponent;
  let requestEntriesPageSpy: Mock;

  beforeAll(() => page.viewport(1280, 800));

  afterAll(() => page.viewport(414, 896));

  beforeEach(async () => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [RawDataViewComponent, RawDataComponent, ColumnResizeDirective],
      imports: [MatSidenavModule, MatProgressBarModule, MatMenuModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSnackBarModule,
        MatBottomSheetModule],
      providers: [
        provideZoneChangeDetection(),
        ...IT_PROVIDERS,
        provideRouter([]),
        NotificationService,
        { provide: DBService, useFactory: () => run.db }
      ]
    });
    run = await setUpBackend(backend, [sceneData('it', ENTRY_COUNT)]);
    vi.spyOn(run.db, 'getActiveScene').mockReturnValue(run.scenes[0].scene);
    requestEntriesPageSpy = vi.spyOn(run.db, 'requestEntriesPage');
    SortLimitationWorkaround.couchDbSortLimitationDialogData.rememberChoice = false;
    fixture = TestBed.createComponent(RawDataViewComponent);
  }, TIMEOUT);

  afterEach(async () => {
    fixture.destroy();
    await tearDownBackend(run);
  }, TIMEOUT);

  function root(): HTMLElement {
    return fixture.nativeElement;
  }

  function scroller(): HTMLElement {
    return root().querySelector('.vt');
  }

  function rowElement(index: number): HTMLElement {
    return root().querySelector('.vt-row[data-index="' + index + '"]');
  }

  function cellText(index: number, columnName: string): string {
    return rowElement(index).children[IT_COLUMNS.findIndex(c => c.name === columnName)].textContent;
  }

  function column(name: string): Column {
    return IT_COLUMNS.find(c => c.name === name);
  }

  function formatted(columnName: string, value: number): string {
    return component.formattedValueOf(column(columnName), { [columnName]: value });
  }

  async function settle(): Promise<void> {
    await DomMetrics.waitFrames(() => !component.loading && !!rowElement(0)?.querySelector('.vt-td'), 600);
    await DomMetrics.waitStable(() => [component.gridHeight, component.gridWidth, root().querySelectorAll('.vt-loading').length].join(), 3, 120);
  }

  async function render(): Promise<void> {
    fixture.autoDetectChanges();
    await fixture.whenStable();
    component = fixture.debugElement.query(By.directive(RawDataComponent)).componentInstance;
    await settle();
  }

  async function reloaded(action: () => void): Promise<void> {
    action();
    await DomMetrics.waitFrames(() => component.loading, 60);
    await settle();
  }

  function filterQuery(columnName: string, operator: Operator, value: string, dataType?: DataType): Query {
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter(columnName, operator, value, dataType));
    return query;
  }

  it('should show total row count of all entries', async () => {

    // when
    await render();

    // then
    expect(component.totalRowCount).toBe(ENTRY_COUNT);
    expect(root().querySelector('.row-count').textContent).toBe('1,234 rows');
  }, TIMEOUT);

  it('should size scrollbar for all rows before scrolling', async () => {

    // when
    await render();

    // then
    expect(requestEntriesPageSpy).toHaveBeenCalledTimes(1);
    expect(scroller().scrollHeight).toBe(RawDataComponent.HEADER_HEIGHT + ENTRY_COUNT * ROW_HEIGHT);
  }, TIMEOUT);

  it('should load only rendered blocks when scrolled to bottom', async () => {

    // given
    await render();

    // when
    await scrollTableTo(root(), scroller().scrollHeight);

    // then
    const indexes = Array.from(root().querySelectorAll<HTMLElement>('.vt-row')).map(row => Number(row.dataset['index']));
    const firstBlock = Math.floor(Math.min(...indexes) / 100);
    const expectedBlocks = [0, ...Array.from({ length: 13 - firstBlock }, (_, i) => firstBlock + i)];
    const requestedBlocks = requestEntriesPageSpy.mock.calls.map(call => (call[0] as Query).getPageIndex());
    expect(new Set(requestedBlocks)).toEqual(new Set(expectedBlocks));
    expect(requestedBlocks.some(block => block >= 1 && block <= 10)).toBe(false);
    expect(cellText(ENTRY_COUNT - 1, 'ID')).toBe(formatted('ID', ENTRY_COUNT));
  }, TIMEOUT);

  it('should grow rows with wrapped text in multi-line mode', async () => {

    // given
    await render();

    // when
    component.toggleMultiLine();
    await DomMetrics.waitStable(() => rowElement(4).getBoundingClientRect().height, 3, 120);

    // then
    expect(rowElement(4).getBoundingClientRect().height).toBeGreaterThan(rowElement(3).getBoundingClientRect().height);
    expect(rowElement(3).getBoundingClientRect().height).toBe(ROW_HEIGHT);
  }, TIMEOUT);

  it('should reload sorted descending when Amount sorted desc', async () => {

    // given
    await render();
    await reloaded(() => component.sortBy(column('Amount')));

    // when
    await reloaded(() => component.sortBy(column('Amount')));

    // then
    expect(cellText(0, 'Amount')).toBe(formatted('Amount', 12340));
    expect(cellText(1, 'Amount')).toBe(formatted('Amount', 12330));
  }, TIMEOUT);

  if (backend.name === 'CouchDB') {
    it('should show sort limitation dialog once when sorted on CouchDB', async () => {

      // given
      await render();
      const dialogSpy = vi.spyOn(TestBed.inject(DialogService), 'showConfirmDialog').mockReturnValue(undefined);

      // when
      await reloaded(() => component.sortBy(column('Amount')));
      await scrollTableTo(root(), 600 * ROW_HEIGHT);

      // then
      expect(dialogSpy).toHaveBeenCalledTimes(1);
    }, TIMEOUT);
  } else {
    it('should not show sort limitation dialog when sorted on PouchDB', async () => {

      // given
      await render();
      const dialogSpy = vi.spyOn(TestBed.inject(DialogService), 'showConfirmDialog').mockReturnValue(undefined);

      // when
      await reloaded(() => component.sortBy(column('Amount')));
      await scrollTableTo(root(), 600 * ROW_HEIGHT);

      // then
      expect(dialogSpy).not.toHaveBeenCalled();
    }, TIMEOUT);
  }

  it('should reset to filtered rows when filter changed', async () => {

    // given
    await render();

    // when
    await reloaded(() => component.onFilterChanged(filterQuery('Level', Operator.EQUAL, 'ERROR')));

    // then
    expect(component.totalRowCount).toBe(411);
    const levels = Array.from(root().querySelectorAll<HTMLElement>('.vt-row')).map(row => row.children[1].textContent);
    expect(levels.length).toBeGreaterThan(0);
    expect(levels.every(level => level === 'ERROR')).toBe(true);
  }, TIMEOUT);

  it('should fit route table within viewport', async () => {

    // when
    await render();

    // then
    expect(scroller().getBoundingClientRect().bottom).toBeLessThanOrEqual(innerHeight);
    expect(scroller().scrollHeight).toBeGreaterThan(scroller().clientHeight);
  }, TIMEOUT);

  it('should fit height to content when few rows match', async () => {

    // given
    await render();

    // when
    await reloaded(() => component.onFilterChanged(filterQuery('ID', Operator.ANY_OF, '1;2;3', DataType.NUMBER)));

    // then
    expect(component.totalRowCount).toBe(3);
    expect(scroller().getBoundingClientRect().height).toBe(RawDataComponent.HEADER_HEIGHT + RawDataComponent.BORDER + 3 * ROW_HEIGHT);
    expect(rowElement(2).getBoundingClientRect().bottom).toBeLessThanOrEqual(scroller().getBoundingClientRect().bottom);
  }, TIMEOUT);

  it('should size em columns by 14px in route view', async () => {

    // when
    await render();

    // then
    const idHeader = root().querySelector<HTMLElement>('.vt-th');
    expect(idHeader.getBoundingClientRect().width).toBe(6 * 14);
  }, TIMEOUT);

  it('should color row from bgcolor and fgcolor when highlight on', async () => {

    // when
    await render();

    // then
    expect(getComputedStyle(rowElement(6)).backgroundColor).toBe('rgb(255, 238, 238)');
    expect(getComputedStyle(rowElement(6)).color).toBe('rgb(153, 0, 0)');
  }, TIMEOUT);

  it('should export all entries when saveAs CSV', async () => {

    // given
    await render();
    const exportSpy = vi.spyOn(TestBed.inject(ExportService), 'exportData').mockReturnValue(undefined);

    // when
    component.saveAs(ExportFormat.CSV);
    await DomMetrics.waitFrames(() => exportSpy.mock.calls.length > 0, 600);

    // then
    expect(exportSpy.mock.calls[0][0].length).toBe(ENTRY_COUNT);
  }, TIMEOUT);

  it('should save and restore view with sort, multi-line and resized column width', async () => {

    // given
    await render();
    await reloaded(() => component.sortBy(column('Amount')));
    await reloaded(() => component.sortBy(column('Amount')));
    component.toggleMultiLine();
    component.resizeColumn(IT_COLUMNS.findIndex(c => c.name === 'Data'), 50);
    component.endResize();
    const dataWidth = component.widths[3];
    const saved = component.configToBeSaved();
    const record: ConfigRecord = { route: Route.RAWDATA, name: 'sorted', modifiedTime: 0, query: queryToQueryDef(saved.query), data: saved.data };
    await reloaded(() => component.sortBy(column('Amount')));
    component.toggleMultiLine();
    component.toggleConsiderColumnWidths();

    // when
    await reloaded(() => component.loadConfig(record));

    // then
    expect(component.query.getSort()).toEqual({ active: 'Amount', direction: 'desc' });
    expect(cellText(0, 'Amount')).toBe(formatted('Amount', 12340));
    expect(component.multiLine).toBe(true);
    expect(component.widths[3]).toBe(dataWidth);
    expect(root().querySelectorAll<HTMLElement>('.vt-th')[3].getBoundingClientRect().width).toBe(dataWidth);
  }, TIMEOUT);
});
