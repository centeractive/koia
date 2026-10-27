import { ChangeDetectionStrategy, Component, provideZoneChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { ColumnResizeDirective } from 'app/shared/directives/column-resize.directive';
import { Column, ColumnPair, DataType } from 'app/shared/model';
import { DialogService } from 'app/shared/services/dialog.service';
import { waitStable } from 'app/shared/test/animation-frames';
import { ColumnWidthResolver } from 'app/shared/ui/virtual-table/column-width-resolver';
import { TableModeTogglesComponent } from 'app/shared/ui/virtual-table/table-mode-toggles.component';
import { VirtualTableComponent } from 'app/shared/ui/virtual-table/virtual-table.component';
import { ColumnMappingComponent } from '../column-mapping/column-mapping.component';
import { MappingResult } from '../column-mapping/mapper';
import { ScenePreviewComponent } from './scene-preview.component';

const EM_PX = ColumnWidthResolver.EM_PX;

@Component({
  template: `@for (pair of pairs; track $index) {
               @if (!pair.skip) {
                 <koia-column-mapping [mapping]="pair" />
               }
             }
             <div style="height: 1000px; width: 1000px; display: flex; flex-direction: column;">
               <koia-scene-preview [columnPairs]="pairs" [mappingResults]="results" />
             </div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  pairs: ColumnPair[] = [pair('Name', DataType.TEXT, 10), pair('Skipped', DataType.TEXT, 5, true), pair('Amount', DataType.NUMBER, 6)];
  results: MappingResult[] = [
    { entry: { Name: 'a', Amount: 1 }, errors: [] },
    { entry: undefined, errors: ['first error', 'second error'] },
    { entry: { Name: 'c', Amount: 3 }, errors: [] }
  ];
}

function pair(name: string, dataType: DataType, width: number, skip?: boolean): ColumnPair {
  return { source: { name, dataType, width }, target: { name, dataType, width }, skip };
}

describe('ScenePreviewComponent', () => {

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const dialogService = new DialogService(null);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, ScenePreviewComponent, VirtualTableComponent, TableModeTogglesComponent, ColumnResizeDirective,
        ColumnMappingComponent],
      imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule, MatIconModule,
        MatButtonModule],
      providers: [
        provideZoneChangeDetection(),
        { provide: DialogService, useValue: dialogService }
      ]
    });
    vi.spyOn(dialogService, 'showConfirmDialog').mockReturnValue(null);
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  function table(): VirtualTableComponent {
    return fixture.debugElement.query(By.directive(VirtualTableComponent)).componentInstance;
  }

  function preview(): HTMLElement {
    return fixture.nativeElement.querySelector('koia-scene-preview');
  }

  function headers(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.vt-th'));
  }

  function headerWidth(index: number): number {
    return headers()[index].getBoundingClientRect().width;
  }

  function rowElement(index: number): HTMLElement {
    return fixture.nativeElement.querySelector('.vt-row[data-index="' + index + '"]');
  }

  function cellTexts(index: number): string[] {
    return Array.from(rowElement(index).children).map(cell => cell.textContent);
  }

  function widthInputs(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.column_width input'));
  }

  function button(icon: string): HTMLButtonElement {
    return Array.from<HTMLButtonElement>(preview().querySelectorAll('button')).find(b => b.textContent.includes(icon));
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    await waitStable(() => [table().gridHeight, table().gridWidth, table().virtualItems.length,
    fixture.nativeElement.querySelectorAll('.vt-row').length].join(), 3, 120);
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

  function dragHandle(index: number, delta: number): void {
    const handle: HTMLElement = preview().querySelectorAll<HTMLElement>('.vt-resize')[index];
    handle.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 100, bubbles: true }));
    handle.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 100 + delta, bubbles: true }));
    handle.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 100 + delta, bubbles: true }));
  }

  it('should hide skipped columns', async () => {

    // when
    await render();

    // then
    expect(headers().map(h => h.textContent)).toEqual(['Name', 'Amount']);
  });

  it('should size header cells by chars', async () => {

    // when
    await render();

    // then
    expect(headerWidth(0)).toBe(10 * EM_PX);
    expect(headerWidth(1)).toBe(6 * EM_PX);
  });

  it('should render mapped values', async () => {

    // when
    await render();

    // then
    expect(cellTexts(0)).toEqual(['a', '1']);
    expect(cellTexts(2)).toEqual(['c', '3']);
  });

  it('should color row from bgcolor', async () => {

    // given
    host.results[0].entry['bgcolor'] = '#ff785a';

    // when
    await render();

    // then
    expect(getComputedStyle(rowElement(0)).backgroundColor).toBe('rgb(255, 120, 90)');
    expect(getComputedStyle(rowElement(2)).backgroundColor).not.toBe('rgb(255, 120, 90)');
  });

  it('should show row count', async () => {

    // when
    await render();

    // then
    expect(preview().querySelector('.row-count').textContent).toBe('3 rows');
  });

  it('should render empty cells and warning for row with errors only', async () => {

    // when
    await render();

    // then
    expect(cellTexts(1)).toEqual(['', '']);
    expect(rowElement(1).children[0].querySelector('.img_row_warning')).not.toBeNull();
  });

  it('should show joined errors as warning tooltip', async () => {

    // when
    await render();

    // then
    const tooltip = fixture.debugElement.query(By.css('.img_row_warning')).injector.get(MatTooltip);
    expect(tooltip.message).toBe('first error\nsecond error');
  });

  it('should not render warning for valid row', async () => {

    // when
    await render();

    // then
    expect(rowElement(0).querySelector('.img_row_warning')).toBeNull();
    expect(preview().querySelectorAll('.img_row_warning').length).toBe(1);
  });

  it('#drag on resize handle should snap column width to chars', async () => {

    // given
    await render();

    // when
    dragHandle(0, 30);
    fixture.detectChanges();
    await settle();

    // then
    expect(host.pairs[0].target.width).toBe(12);
    expect(headerWidth(0)).toBe(12 * EM_PX);
  });

  it('#drag on resize handle should update width in column definition', async () => {

    // given
    await render();

    // when
    dragHandle(1, -28);
    fixture.detectChanges();
    await fixture.whenStable();

    // then
    expect(widthInputs().map(input => input.value)).toEqual(['10', '4']);
  });

  it('#typing width in column definition should resize preview column', async () => {

    // given
    await render();
    const input = widthInputs()[1];

    // when
    input.value = '9';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await settle();

    // then
    expect(host.pairs[2].target.width).toBe(9);
    expect(headerWidth(1)).toBe(9 * EM_PX);
  });

  it('should auto size column with cleared width', async () => {

    // given
    host.pairs[0].target.width = null;
    const column: Column = host.pairs[0].target;
    const entries = host.results.map(result => result.entry ?? {});

    // when
    await render();

    // then
    expect(headerWidth(0)).toBe(new ColumnWidthResolver().widthOf(column, 'em', true, entries, false));
  });

  it('should place compact mode buttons left aligned close above table', async () => {

    // when
    await render();

    // then
    const previewRect = preview().getBoundingClientRect();
    const buttonRect = button('format_line_spacing').getBoundingClientRect();
    const tableRect = preview().querySelector('.vt').getBoundingClientRect();
    expect(buttonRect.left).toBeCloseTo(tableRect.left, 0);
    expect(tableRect.left).toBeCloseTo(previewRect.left, 0);
    expect(tableRect.right).toBeCloseTo(previewRect.right, 0);
    expect(buttonRect.height).toBe(32);
    expect(tableRect.top - buttonRect.bottom).toBeGreaterThanOrEqual(0);
    expect(tableRect.top - buttonRect.bottom).toBeLessThanOrEqual(2);
    expect(getComputedStyle(preview().querySelector('.div_buttons')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('#click on multi-line button should switch preview to multi-line', async () => {

    // given
    await render();

    // when
    await change(() => button('format_line_spacing').click());

    // then
    expect(preview().querySelector('.vt').classList).toContain('multi-line');
  });

  it('#click on nested objects button should show object values', async () => {

    // given
    host.pairs = [...host.pairs, pair('Nested', DataType.OBJECT, 8)];
    host.results = [{ entry: { Name: 'a', Amount: 1, Nested: '{"x":1}' }, errors: [] }];
    await render();
    expect(cellTexts(0)[2]).toBe('...');

    // when
    await change(() => button('code').click());

    // then
    expect(cellTexts(0)[2]).toBe('{"x":1}');
  });

  it('#toggleShowNestedObjects should recompute widths of columns without width', async () => {

    // given
    const nested = pair('Nested', DataType.OBJECT, null);
    host.pairs = [...host.pairs, nested];
    host.results = [{ entry: { Name: 'a', Amount: 1, Nested: '{"x":"a nested value that is long"}' }, errors: [] }];
    const entries = host.results.map(result => result.entry);
    await render();
    const resolver = new ColumnWidthResolver();
    expect(headerWidth(2)).toBe(resolver.widthOf(nested.target, 'em', true, entries, false));

    // when
    await change(() => button('code').click());

    // then
    expect(headerWidth(2)).toBe(resolver.widthOf(nested.target, 'em', true, entries, true));
    expect(headerWidth(2)).toBeGreaterThan(resolver.widthOf(nested.target, 'em', true, entries, false));
  });

  it('should render new mapping results', async () => {

    // given
    await render();

    // when
    await change(() => host.results = [{ entry: { Name: 'x', Amount: 7 }, errors: [] }]);

    // then
    expect(cellTexts(0)).toEqual(['x', '7']);
    expect(preview().querySelector('.row-count').textContent).toBe('1 rows');
  });

  it('should render remaining rows when column deletion reduces mapping results', async () => {

    // given
    await render();
    host.pairs[2].skip = true;
    host.results = [{ entry: { Name: 'a' }, errors: [] }];

    // when
    fixture.detectChanges();
    await settle();

    // then
    expect(headers().map(h => h.textContent)).toEqual(['Name']);
    expect(preview().querySelectorAll('.vt-row').length).toBe(1);
    expect(cellTexts(0)).toEqual(['a']);
  });

  it('should cap height and scroll many rows', async () => {

    // given
    host.results = Array.from({ length: 100 }, (_, i) => ({ entry: { Name: 'n' + i, Amount: i }, errors: [] }));

    // when
    await render();

    // then
    const scroller: HTMLElement = preview().querySelector('.vt');
    expect(preview().getBoundingClientRect().height).toBeLessThanOrEqual(parseFloat(getComputedStyle(preview()).maxHeight));
    expect(scroller.getBoundingClientRect().bottom).toBeLessThanOrEqual(preview().getBoundingClientRect().bottom);
    expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
  });
});
