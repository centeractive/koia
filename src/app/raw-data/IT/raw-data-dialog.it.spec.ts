import { CUSTOM_ELEMENTS_SCHEMA, getDebugNode, NgZone, provideZoneChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideRouter } from '@angular/router';
import { ColumnResizeDirective } from 'app/shared/directives/column-resize.directive';
import { Operator, PropertyFilter, Query } from 'app/shared/model';
import { NotificationService, RawDataRevealService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { BACKENDS, BackendRun, IT_COLUMNS, IT_PROVIDERS, sceneData, setUpBackend, tearDownBackend } from 'app/shared/test/backend-fixture';
import { DomMetrics } from 'app/shared/ui/table-fit/dom-metrics';
import { TableModeTogglesComponent } from 'app/shared/ui/virtual-table/table-mode-toggles.component';
import { VirtualTableComponent } from 'app/shared/ui/virtual-table/virtual-table.component';
import { page } from 'vitest/browser';
import { RawDataDialogComponent } from '../raw-data-dialog.component';
import { RawDataComponent } from '../raw-data.component';
import { ViewToolbarComponent } from 'app/shared/ui/view-toolbar/view-toolbar.component';

const TIMEOUT = 30_000;
const FILTERED_COUNT = 411;
const DATA_INDEX = IT_COLUMNS.findIndex(c => c.name === 'Data');

describe.each(BACKENDS)('RawDataDialogComponent IT ($name)', backend => {

  let run: BackendRun;

  beforeAll(() => page.viewport(1280, 800));

  afterAll(() => page.viewport(414, 896));

  beforeEach(async () => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [RawDataDialogComponent, RawDataComponent, VirtualTableComponent, TableModeTogglesComponent, ViewToolbarComponent, ColumnResizeDirective],
      imports: [MatDialogModule, MatProgressBarModule, MatMenuModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSnackBarModule,
        MatBottomSheetModule],
      providers: [
        provideZoneChangeDetection(),
        ...IT_PROVIDERS,
        provideRouter([]),
        NotificationService,
        { provide: DBService, useFactory: () => run.db }
      ]
    });
    run = await setUpBackend(backend, [sceneData('dialog', 1234)]);
    vi.spyOn(run.db, 'getActiveScene').mockReturnValue(run.scenes[0].scene);
  }, TIMEOUT);

  afterEach(async () => {
    TestBed.inject(MatDialog).closeAll();
    await DomMetrics.waitFrames(() => !pane(), 60);
    await tearDownBackend(run);
  }, TIMEOUT);

  function pane(): HTMLElement {
    return document.querySelector('.cdk-overlay-pane.dialog-container');
  }

  function scroller(): HTMLElement {
    return pane().querySelector('.vt');
  }

  function rawDataComponent(): RawDataComponent {
    return getDebugNode(pane().querySelector('koia-raw-data')).componentInstance;
  }

  function table(): VirtualTableComponent {
    return getDebugNode(pane().querySelector('koia-virtual-table')).componentInstance;
  }

  function paneWidth(): number {
    return pane().getBoundingClientRect().width;
  }

  async function openDialog(): Promise<void> {
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'ERROR'));
    TestBed.inject(RawDataRevealService).show(query);
    await DomMetrics.waitFrames(() => !!pane()?.querySelector('.vt-td'), 600);
    await DomMetrics.waitFrames(() => !rawDataComponent().loading, 600);
    await DomMetrics.waitStable(paneWidth, 3, 120);
  }

  async function resizeData(delta: number): Promise<void> {
    TestBed.inject(NgZone).run(() => {
      table().onResizing(DATA_INDEX, delta);
      table().onResized();
    });
    await DomMetrics.waitStable(paneWidth, 3, 120);
  }

  async function widenUntilTableDecidesWidth(): Promise<void> {
    const shortfall = pane().clientWidth - scroller().getBoundingClientRect().width;
    await resizeData(Math.max(0, shortfall) + 100);
  }

  it('should fit dialog within viewport', async () => {

    // when
    await openDialog();

    // then
    const rect = pane().getBoundingClientRect();
    expect(rect.height).toBeLessThanOrEqual(innerHeight - 40);
    expect(rect.width).toBeLessThanOrEqual(innerWidth - 40);
    expect(scroller().getBoundingClientRect().bottom).toBeLessThanOrEqual(rect.bottom);
  }, TIMEOUT);

  it('should show filtered count', async () => {

    // when
    await openDialog();

    // then
    expect(pane().querySelector('.row-count').textContent).toBe(FILTERED_COUNT + ' rows');
  }, TIMEOUT);

  it('should close on ESC', async () => {

    // given
    await openDialog();

    // when
    pane().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
    await DomMetrics.waitFrames(() => !pane(), 60);

    // then
    expect(pane()).toBeNull();
  }, TIMEOUT);

  it('should widen dialog when column widened', async () => {

    // given
    await openDialog();
    await widenUntilTableDecidesWidth();
    const width = paneWidth();

    // when
    await resizeData(200);

    // then
    expect(paneWidth()).toBeCloseTo(width + 200, 0);
  }, TIMEOUT);

  it('should narrow dialog when column narrowed', async () => {

    // given
    await openDialog();
    await widenUntilTableDecidesWidth();
    const width = paneWidth();

    // when
    await resizeData(-50);

    // then
    expect(paneWidth()).toBeCloseTo(width - 50, 0);
  }, TIMEOUT);

  it('should show horizontal scrollbar when columns exceed max dialog width', async () => {

    // given
    await openDialog();

    // when
    await resizeData(3000);

    // then
    expect(paneWidth()).toBeCloseTo(innerWidth - 40, 0);
    expect(scroller().scrollWidth).toBeGreaterThan(scroller().clientWidth);
  }, TIMEOUT);

  it('should hide horizontal scrollbar when columns narrowed below max width', async () => {

    // given
    await openDialog();
    await resizeData(3000);

    // when
    await resizeData(-3000);

    // then
    expect(paneWidth()).toBeLessThan(innerWidth - 40);
    expect(scroller().scrollWidth).toBeLessThanOrEqual(scroller().clientWidth);
  }, TIMEOUT);
});
