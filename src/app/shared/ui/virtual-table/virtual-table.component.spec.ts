import { ChangeDetectionStrategy, Component, provideZoneChangeDetection, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ColumnResizeDirective } from 'app/shared/directives/column-resize.directive';
import { Column, DataType } from 'app/shared/model';
import { DialogService } from 'app/shared/services/dialog.service';
import { DomMetrics } from '../table-fit/dom-metrics';
import { ColumnAutoSizer } from './column-auto-sizer';
import { ColumnWidthResolver } from './column-width-resolver';
import { ColumnResize, VirtualTableSource } from './virtual-table-source';
import { VirtualTableComponent } from './virtual-table.component';

const ROW_HEIGHT = VirtualTableComponent.ROW_HEIGHT;
const FRAME_LIMIT = 120;

function entryAt(index: number, longData: boolean): object {
  const entry = {
    _id: String(index),
    Time: 1_000_000 - index * 1000,
    Level: ['INFO', 'WARN', 'ERROR'][index % 3],
    Data: longData ? 'word '.repeat(60) + index : 'line ' + index,
    Host: 'server-node-' + index % 2,
    Nested: index === 0 ? '{ "a": 1 }' : null,
    Amount: index * 10
  };
  return index % 7 === 0 ? { ...entry, bgcolor: '#ffeeee', fgcolor: '#990000' } : entry;
}

class TestSource implements VirtualTableSource {

  missingFrom = Number.MAX_SAFE_INTEGER;
  longDataFrom = Number.MAX_SAFE_INTEGER;
  ranges: number[][] = [];

  constructor(public count: number | undefined, private longFirstRows = true) { }

  rowCount(): number | undefined {
    return this.count;
  }

  rowAt(index: number): object | undefined {
    if (index >= (this.count ?? 0)) {
      throw new Error('row ' + index + ' is out of range');
    }
    const longData = index === 1 && this.longFirstRows || index >= this.longDataFrom;
    return index < this.missingFrom ? entryAt(index, longData) : undefined;
  }

  requestRange(first: number, last: number): void {
    this.ranges.push([first, last]);
  }
}

@Component({
  template: `<div [style.height]="height" [style.width]="width" style="display: flex; flex-direction: column;">
               <koia-virtual-table [columns]="columns" [widths]="widths" [source]="source" [multiLine]="multiLine"
                 [showNestedObjects]="showNestedObjects" [dialogStyle]="dialogStyle" [sortable]="sortable"
                 [sortIndicatorOf]="sortIndicatorOf" [rowStyleOf]="rowStyleOf" [rowMarker]="withMarker ? marker : undefined"
                 (sort)="sorted.push($event)" (columnResize)="onColumnResize($event)" />
             </div>
             <ng-template #marker let-index><span class="marker">#{{ index }}</span></ng-template>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {

  height = '400px';
  width = '1200px';
  columns: Column[] = [
    { name: 'Time', dataType: DataType.TIME, width: 12, format: 'yyyy-MM-dd HH:mm:ss SSS' },
    { name: 'Level', dataType: DataType.TEXT, width: 5, indexed: true },
    { name: 'Data', dataType: DataType.TEXT, width: 20 },
    { name: 'Host', dataType: DataType.TEXT, width: 8 },
    { name: 'Nested', dataType: DataType.OBJECT, width: 6 },
    { name: 'Amount', dataType: DataType.NUMBER, width: 6, indexed: true }
  ];
  widths = this.columns.map(c => c.width * ColumnWidthResolver.EM_PX);
  source: VirtualTableSource = new TestSource(1234);
  multiLine = false;
  showNestedObjects = false;
  dialogStyle = false;
  sortable = true;
  withMarker = false;
  sorted: Column[] = [];
  resizes: ColumnResize[] = [];
  sortIndicatorOf: (column: Column) => string = () => '';
  rowStyleOf: (entry: object) => object | null = () => null;

  onColumnResize(resize: ColumnResize): void {
    this.resizes.push(resize);
    this.widths = this.widths.map((width, i) => i === resize.index ? resize.width : width);
  }
}

describe('VirtualTableComponent', () => {

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let source: TestSource;
  const dialogService = new DialogService(null);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, VirtualTableComponent, ColumnResizeDirective],
      providers: [
        provideZoneChangeDetection(),
        { provide: DialogService, useValue: dialogService }
      ]
    });
    vi.spyOn(dialogService, 'showConfirmDialog').mockReturnValue(null);
    createFixture();
  });

  function createFixture(): void {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    source = host.source as TestSource;
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

  function columnIndex(name: string): number {
    return host.columns.findIndex(c => c.name === name);
  }

  function cellOf(index: number, columnName: string): HTMLDivElement {
    return rowElement(index).children[columnIndex(columnName)] as HTMLDivElement;
  }

  function header(columnName: string): HTMLDivElement {
    return fixture.nativeElement.querySelectorAll('.vt-th')[columnIndex(columnName)];
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    await DomMetrics.waitStable(() => [table().gridHeight, table().gridWidth, table().totalSize, table().virtualItems.length,
    fixture.nativeElement.querySelectorAll('.vt-row').length].join(), 3, FRAME_LIMIT);
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
    await DomMetrics.waitFrames(() => !!rowElement(index), FRAME_LIMIT);
    await settle();
  }

  function nextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));
  }

  describe('rendering', () => {

    it('should render placeholder for rows not loaded', async () => {

      // given
      source.missingFrom = 600;
      await render();

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
      expect(table().totalSize).toBe(1234 * ROW_HEIGHT);
      expect(fixture.nativeElement.querySelector('.vt-body').offsetHeight).toBe(1234 * ROW_HEIGHT);
      expect(rowElement(1).getBoundingClientRect().height).toBe(ROW_HEIGHT);
    });

    it('should request range of scrolled rows', async () => {

      // given
      await render();

      // when
      await scrollToRow(600);

      // then
      const [first, last] = source.ranges.at(-1);
      expect(first).toBeLessThanOrEqual(600);
      expect(last).toBeGreaterThanOrEqual(600);
      expect(cellOf(600, 'Data').textContent).toBe('line 600');
    });

    it('should show row count', async () => {

      // when
      await render();

      // then
      expect(fixture.nativeElement.querySelector('.row-count').textContent).toBe('1,234 rows');
    });

    it('should show no rows while row count unknown', async () => {

      // given
      source.count = undefined;

      // when
      await render();

      // then
      expect(fixture.nativeElement.querySelector('.row-count').textContent).toBe(' rows');
      expect(fixture.nativeElement.querySelectorAll('.vt-row').length).toBe(0);
      expect(source.ranges).toEqual([]);
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
      await change(() => host.multiLine = true);

      // then
      expect(rowElement(1).getBoundingClientRect().height).toBeGreaterThan(ROW_HEIGHT);
      expect(rowElement(2).getBoundingClientRect().height).toBe(ROW_HEIGHT);
      expect(cellOf(1, 'Data').hasAttribute('title')).toBe(false);
      expect(table().totalSize).toBeGreaterThan(1234 * ROW_HEIGHT);
    });

    it('should return to fixed row height when multi-line switched off', async () => {

      // given
      await render();
      await change(() => host.multiLine = true);

      // when
      await change(() => host.multiLine = false);

      // then
      expect(rowElement(1).getBoundingClientRect().height).toBe(ROW_HEIGHT);
      expect(table().totalSize).toBe(1234 * ROW_HEIGHT);
    });

    it('should re-measure rows when source changes', async () => {

      // given
      await render();
      await change(() => host.multiLine = true);

      // when
      await change(() => host.source = new TestSource(1234, false));

      // then
      expect(rowElement(1).getBoundingClientRect().height).toBe(ROW_HEIGHT);
      expect(table().totalSize).toBe(1234 * ROW_HEIGHT);
    });

    it('#reset should forget measured heights in multi-line mode', async () => {

      // given
      source.longDataFrom = 1200;
      await render();
      await change(() => host.multiLine = true);
      await scrollToRow(1233);
      expect(table().totalSize).toBeGreaterThan(1234 * ROW_HEIGHT);
      source.longDataFrom = Number.MAX_SAFE_INTEGER;

      // when
      table().reset();
      table().refresh();
      await settle();

      // then
      expect(rowElement(1).getBoundingClientRect().height).toBeGreaterThan(ROW_HEIGHT);
      expect(table().totalSize).toBe(1233 * ROW_HEIGHT + rowElement(1).getBoundingClientRect().height);
    });

    it('should drop rows beyond new row count when source changes', async () => {

      // given
      await render();

      // when
      host.source = new TestSource(3);
      fixture.detectChanges();

      // then
      expect(fixture.nativeElement.querySelectorAll('.vt-row').length).toBe(3);
      expect(fixture.nativeElement.querySelector('.row-count').textContent).toBe('3 rows');
    });
  });

  describe('widths', () => {

    it('should size header cells from widths', async () => {

      // when
      await render();

      // then
      expect(header('Level').getBoundingClientRect().width).toBe(5 * ColumnWidthResolver.EM_PX);
      expect(table().templateColumns).toBe(host.widths.map(w => w + 'px').join(' '));
    });

    it('#onResizing should emit width from drag start', async () => {

      // given
      await render();
      const index = columnIndex('Data');

      // when
      table().onResizing(index, 50);
      table().onResizing(index, 80);

      // then
      expect(host.resizes).toEqual([{ index, width: 280 + 50 }, { index, width: 280 + 80 }]);
    });

    it('#onResizing should not go below min width', async () => {

      // given
      await render();

      // when
      table().onResizing(columnIndex('Level'), -1000);

      // then
      expect(host.resizes).toEqual([{ index: columnIndex('Level'), width: ColumnAutoSizer.MIN }]);
    });

    it('#onResized should start next drag from current width', async () => {

      // given
      await render();
      const index = columnIndex('Data');
      table().onResizing(index, 50);
      fixture.detectChanges();
      table().onResized();

      // when
      table().onResizing(index, 30);

      // then
      expect(host.resizes.at(-1)).toEqual({ index, width: 280 + 80 });
    });

    it('#drag on resize handle should emit resize without sort', async () => {

      // given
      await render();
      const index = columnIndex('Level');
      const handle: HTMLElement = fixture.nativeElement.querySelectorAll('.vt-resize')[index];

      // when
      handle.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 100, bubbles: true }));
      handle.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 130, bubbles: true }));
      handle.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 130, bubbles: true }));
      handle.click();
      fixture.detectChanges();
      await settle();

      // then
      expect(host.resizes).toEqual([{ index, width: 70 + 30 }]);
      expect(header('Level').getBoundingClientRect().width).toBe(100);
      expect(host.sorted).toEqual([]);
    });

    it('#drag narrowing column should keep its edge under pointer when scrolled to the right', async () => {

      // given
      host.width = '600px';
      await render();
      scroller().scrollLeft = scroller().scrollWidth;
      await settle();
      const handle: HTMLElement = fixture.nativeElement.querySelectorAll('.vt-resize')[columnIndex('Data')];
      const x0 = header('Data').getBoundingClientRect().right;

      // when
      handle.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: x0, bubbles: true }));
      handle.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: x0 - 100, bubbles: true }));
      fixture.detectChanges();
      await settle();

      // then
      expect(header('Data').getBoundingClientRect().right).toBeCloseTo(x0 - 100, 0);
    });

    it('#onResizing should keep content width of drag start when narrowing', async () => {

      // given
      await render();
      const columnsWidth = table().columnsWidth;

      // when
      table().onResizing(columnIndex('Data'), -100);
      fixture.detectChanges();

      // then
      expect(table().columnsWidth).toBe(columnsWidth - 100);
      expect(table().contentWidth).toBe(columnsWidth);
    });

    it('#onResizing should grow content width when widening', async () => {

      // given
      await render();
      const columnsWidth = table().columnsWidth;

      // when
      table().onResizing(columnIndex('Data'), 100);
      fixture.detectChanges();

      // then
      expect(table().contentWidth).toBe(columnsWidth + 100);
    });

    it('#onResized should release content width', async () => {

      // given
      await render();
      table().onResizing(columnIndex('Data'), -100);
      fixture.detectChanges();

      // when
      table().onResized();
      fixture.detectChanges();

      // then
      expect(table().contentWidth).toBe(table().columnsWidth);
      expect(fixture.nativeElement.querySelector('.vt-body').style.width).toBe(table().columnsWidth + 'px');
    });

    it('should add horizontal scrollbar height when columns overflow in route mode', async () => {

      // given
      vi.spyOn(DomMetrics, 'scrollbarWidth').mockReturnValue(15);
      createFixture();
      await render();
      const gridHeight = table().gridHeight;

      // when
      await change(() => host.widths = host.widths.map((w, i) => i === columnIndex('Data') ? w + 2000 : w));

      // then
      expect(table().gridHeight).toBe(gridHeight + 15);
    });

    it('should refit when widths change', async () => {

      // given
      await render();
      const gridWidth = table().gridWidth;

      // when
      await change(() => host.widths = host.widths.map((w, i) => i === columnIndex('Data') ? w + 80 : w));

      // then
      expect(table().gridWidth).toBe(gridWidth + 80);
      expect(table().columnsWidth).toBe(host.widths.reduce((a, b) => a + b));
      expect(header('Data').getBoundingClientRect().width).toBe(280 + 80);
    });
  });

  describe('sort', () => {

    it('#click on indexed header should emit sort when sortable', async () => {

      // given
      await render();

      // when
      header('Amount').click();

      // then
      expect(host.sorted).toEqual([host.columns[columnIndex('Amount')]]);
    });

    it('#click on not indexed header should not emit sort', async () => {

      // given
      await render();

      // when
      header('Data').click();

      // then
      expect(host.sorted).toEqual([]);
    });

    it('#click on header should not emit sort when not sortable', async () => {

      // given
      host.sortable = false;
      await render();

      // when
      header('Amount').click();

      // then
      expect(host.sorted).toEqual([]);
    });

    it('should mark only indexed headers sortable when sortable', async () => {

      // when
      await render();

      // then
      const sortable = Array.from(fixture.nativeElement.querySelectorAll('.vt-th')).map((th: HTMLElement) => th.classList.contains('sortable'));
      expect(sortable).toEqual([false, true, false, false, false, true]);
    });

    it('should show sort indicator of column', async () => {

      // given
      host.sortIndicatorOf = column => column.name === 'Level' ? '▲' : '';

      // when
      await render();

      // then
      expect(header('Level').querySelector('.vt-sort').textContent).toBe('▲');
      expect(header('Amount').querySelector('.vt-sort').textContent).toBe('');
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
      expect(table().selectedIndex).toBe(3);
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

    it('should color row from rowStyleOf', async () => {

      // given
      host.rowStyleOf = entry => entry['bgcolor'] ? { background: entry['bgcolor'], color: entry['fgcolor'] } : null;

      // when
      await render();

      // then
      expect(getComputedStyle(rowElement(7)).backgroundColor).toBe('rgb(255, 238, 238)');
      expect(getComputedStyle(rowElement(7)).color).toBe('rgb(153, 0, 0)');
      expect(getComputedStyle(rowElement(8)).backgroundColor).toBe('rgb(255, 255, 255)');
    });

    it('should open object dialog on object cell click', async () => {

      // given
      await render();

      // when
      cellOf(0, 'Nested').click();

      // then
      expect(dialogService.showConfirmDialog).toHaveBeenCalledTimes(1);
    });

    it('#displayValue should not display dialog when data type is not OBJECT', async () => {

      // given
      await render();

      // when
      cellOf(0, 'Host').click();

      // then
      expect(dialogService.showConfirmDialog).not.toHaveBeenCalled();
    });

    it('should right align number cells', async () => {

      // when
      await render();

      // then
      expect(getComputedStyle(cellOf(1, 'Amount')).textAlign).toBe('right');
    });

    it('should render row marker in first cell with row index', async () => {

      // given
      host.withMarker = true;

      // when
      await render();

      // then
      expect(cellOf(3, 'Time').querySelector('.marker').textContent).toBe('#3');
      expect(rowElement(3).querySelectorAll('.marker').length).toBe(1);
    });

    it('should not render row marker without template', async () => {

      // when
      await render();

      // then
      expect(fixture.nativeElement.querySelector('.marker')).toBeNull();
    });
  });

  describe('fit', () => {

    it('should fit height to content when few rows', async () => {

      // given
      source.count = 5;

      // when
      await render();

      // then
      expect(table().gridHeight).toBe(VirtualTableComponent.HEADER_HEIGHT + VirtualTableComponent.BORDER + 5 * ROW_HEIGHT);
      expect(scroller().offsetHeight).toBe(table().gridHeight);
    });

    it('should cap height at host when many rows', async () => {

      // when
      await render();

      // then
      const hostBottom = fixture.nativeElement.firstElementChild.getBoundingClientRect().bottom;
      expect(scroller().getBoundingClientRect().bottom).toBeLessThanOrEqual(hostBottom);
      expect(scroller().scrollHeight).toBeGreaterThan(scroller().clientHeight);
    });

    it('should widen in dialog style by column widths', async () => {

      // given
      host.dialogStyle = true;
      host.width = 'fit-content';

      // when
      await render();

      // then
      const expected = table().columnsWidth + DomMetrics.scrollbarWidth() + VirtualTableComponent.BORDER;
      expect(table().gridWidth).toBe(expected);
      expect(scroller().getBoundingClientRect().width).toBe(expected);
    });

    it('should refit when content width changes', async () => {

      // given
      vi.spyOn(DomMetrics, 'scrollbarWidth').mockReturnValue(15);
      createFixture();
      await render();
      const gridHeight = table().gridHeight;

      // when
      await change(() => host.width = '300px');
      const narrowGridHeight = table().gridHeight;
      await change(() => host.width = '3000px');

      // then
      expect(narrowGridHeight).toBe(gridHeight + 15);
      expect(table().gridHeight).toBe(gridHeight);
    });

    it('should refit once per frame for several content resizes', async () => {

      // given
      await render();
      const onVirtualizerChange = vi.spyOn(table() as unknown as { onVirtualizerChange: () => void }, 'onVirtualizerChange');

      // when
      table()['scheduleRefit'](false);
      table()['scheduleRefit'](false);
      table()['scheduleRefit'](false);
      await nextFrame();

      // then
      expect(onVirtualizerChange).toHaveBeenCalledTimes(1);
    });

    it('#reset should scroll to top, clear selection and empty rows', async () => {

      // given
      await render();
      await scrollToRow(600);
      rowElement(601).click();

      // when
      table().reset();

      // then
      expect(scroller().scrollTop).toBe(0);
      expect(table().selectedIndex).toBeUndefined();
      expect(table().virtualItems).toEqual([]);
      expect(fixture.nativeElement.querySelectorAll('.vt-row').length).toBe(0);
    });

    it('#refresh should adopt new row count', async () => {

      // given
      await render();
      source.count = 10;

      // when
      table().refresh();

      // then
      expect(table().totalSize).toBe(10 * ROW_HEIGHT);
      expect(fixture.nativeElement.querySelectorAll('.vt-row').length).toBe(10);
    });
  });

  describe('formatting', () => {

    it('#formattedValueOf should hide nested objects', async () => {

      // when
      await render();

      // then
      expect(cellOf(0, 'Nested').textContent).toBe('...');
    });

    it('#formattedValueOf should show nested objects when enabled', async () => {

      // given
      await render();

      // when
      await change(() => host.showNestedObjects = true);

      // then
      expect(cellOf(0, 'Nested').textContent).toBe('{ "a": 1 }');
    });
  });

  describe('lifecycle', () => {

    it('#ngOnDestroy should remove listeners', async () => {

      // given
      await render();
      const scrollerElement = scroller();
      const rangeCount = source.ranges.length;

      // when
      fixture.destroy();
      scrollerElement.scrollTop = 600 * ROW_HEIGHT;
      await nextFrame();
      await nextFrame();

      // then
      expect(source.ranges.length).toBe(rangeCount);
    });

    it('#ngOnDestroy should ignore late observer callbacks', async () => {

      // given
      await render();
      const component = table();
      const rangeCount = source.ranges.length;
      fixture.destroy();

      // when
      component['virtualizer'].options.onChange(component['virtualizer'], false);
      component['scheduleRefit'](false);
      await nextFrame();

      // then
      expect(source.ranges.length).toBe(rangeCount);
    });

    it('#ngOnDestroy should not fail before view init', () => {

      // given
      const tableFixture = TestBed.createComponent(VirtualTableComponent);

      // when
      const destroy = () => tableFixture.destroy();

      // then
      expect(destroy).not.toThrow();
    });

    it('#ngOnChanges before init should only apply template', () => {

      // given
      const component = TestBed.createComponent(VirtualTableComponent).componentInstance;
      component.widths = [10, 20];

      // when
      component.ngOnChanges({ widths: new SimpleChange(undefined, component.widths, true) });

      // then
      expect(component.columnsWidth).toBe(30);
      expect(component.templateColumns).toBe('10px 20px');
    });
  });
});
