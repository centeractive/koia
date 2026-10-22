import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CanvasPaging } from 'app/shared/model';
import { PageHeadingComponent } from '../print-heading/page-heading.component';
import { RowSpan } from './page-breaks';
import { PageFormat } from './page-format';
import { SheetComponent } from './sheet.component';
import { TableSheetsComponent } from './table-sheets.component';

@Component({
  template: `
    <koia-table-sheets [paging]="paging" [title]="'Sales'" [sceneName]="'Fruits'" [rows]="rows"
      [naturalHeight]="naturalHeight" [gridLine]="gridLine" [pageTemplate]="page" />
    <ng-template #page let-start let-height="height"><p class="p_clip">{{ start }}/{{ height }}</p></ng-template>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  paging = CanvasPaging.LANDSCAPE;
  rows: RowSpan[];
  naturalHeight: number;
  gridLine: number;
}

describe('TableSheetsComponent', () => {

  const LANDSCAPE = PageFormat.LANDSCAPE;
  const PAGE_HEIGHT = LANDSCAPE.printContentHeight - LANDSCAPE.printTopPadding;

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, TableSheetsComponent, SheetComponent, PageHeadingComponent]
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.nativeElement.style.display = 'flex';
    fixture.nativeElement.style.flexDirection = 'column';
    fixture.nativeElement.style.width = '1184px';
    host = fixture.componentInstance;
  });

  afterEach(() => vi.useRealTimers());

  function element<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector);
  }

  function sheets(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.div_canvas_sheet'));
  }

  function clips(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.p_clip')).map((p: HTMLElement) => p.textContent);
  }

  function rowsOf(height: number, count: number): RowSpan[] {
    return Array.from({ length: count }, (_, i) => ({ top: i * height, bottom: (i + 1) * height }));
  }

  async function resized(): Promise<void> {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  it('should lay sheets on desk within gutter', () => {

    // when
    fixture.detectChanges();

    // then
    const desk = element('koia-table-sheets');
    expect(desk.classList).toContain('div_content');
    expect(desk.classList).toContain('div_canvas_desk');
    expect(getComputedStyle(desk).paddingTop).toBe(PageFormat.DESK_GUTTER_PX + 'px');
  });

  it('should show content on one sheet without rows', () => {

    // when
    fixture.detectChanges();

    // then
    expect(sheets().length).toBe(1);
    expect(clips()).toEqual(['0/' + PAGE_HEIGHT]);
    expect(sheets()[0].querySelector('.span_print_title').textContent).toBe('Sales');
    expect(sheets()[0].querySelector('.span_print_details').textContent).toContain('Scene: Fruits');
    expect(sheets()[0].querySelector('.div_canvas_sheet_footer').textContent.trim()).toBe('Page 1 of 1');
  });

  it('should break rows into pages showing grid line of page break on both pages', () => {

    // given
    host.rows = rowsOf(100, 9);
    host.naturalHeight = 900;
    host.gridLine = 1;

    // when
    fixture.detectChanges();

    // then
    expect(sheets().length).toBe(2);
    expect(clips()).toEqual(['0/601', '599/301']);
    expect(sheets()[1].querySelector('.div_canvas_sheet_footer').textContent.trim()).toBe('Page 2 of 2');
  });

  it('should break rows into pages of page height without grid line', () => {

    // given
    host.rows = rowsOf(PAGE_HEIGHT / 2, 3);

    // when
    fixture.detectChanges();

    // then
    expect(clips()).toEqual(['0/' + PAGE_HEIGHT, PAGE_HEIGHT + '/' + PAGE_HEIGHT]);
  });

  it('should scale content of window to width of pages', async () => {

    // given
    fixture.detectChanges();

    // when
    await resized();

    // then
    const pagesWidth = element('.div_canvas_pages').clientWidth;
    const scale = element('.div_sheet_scale');
    expect(parseFloat(scale.style.transform.replace('scale(', ''))).toBeCloseTo(pagesWidth / LANDSCAPE.printWidthPx, 4);
    expect(parseFloat(scale.style.width)).toBeCloseTo(LANDSCAPE.printContentWidth, 1);
    expect(parseFloat(scale.style.height)).toBeCloseTo(LANDSCAPE.printContentHeight, 1);
  });

  it('should show content of window unscaled on desk wider than print width', async () => {

    // given
    fixture.nativeElement.style.width = '2000px';
    fixture.detectChanges();

    // when
    await resized();

    // then
    expect(element('.div_canvas_pages').clientWidth).toBe(LANDSCAPE.printWidthPx);
    expect(element('.div_sheet_scale').style.transform).toBe('scale(1)');
  });

  it('should show content of window zoomed out on desk narrower than print width', async () => {

    // given
    fixture.nativeElement.style.width = '624px';
    fixture.detectChanges();

    // when
    await resized();

    // then
    expect(element('.div_canvas_pages').clientWidth).toBe(560);
    expect(element('.div_sheet_scale').style.transform).toBe('scale(0.5)');
  });

  it.each([CanvasPaging.LANDSCAPE, CanvasPaging.PORTRAIT])('should show %s pages at most at their print width', paging => {

    // given
    host.paging = paging;

    // when
    fixture.detectChanges();

    // then
    expect(element('.div_canvas_pages').style.maxWidth).toBe(PageFormat.of(paging).printWidthPx + 'px');
  });

  it.each([CanvasPaging.LANDSCAPE, CanvasPaging.PORTRAIT])('should print %s pages unzoomed at their print width', paging => {

    // given
    host.paging = paging;

    // when
    fixture.detectChanges();

    // then
    const pages = element('.div_canvas_pages');
    expect(pages.classList).toContain('printable');
    expect(pages.style.getPropertyValue('--koia-print-width')).toBe(PageFormat.of(paging).printWidthPx + 'px');
    expect(pages.style.getPropertyValue('--koia-print-zoom')).toBe('1');
  });

  it('should refresh print time when printing starts', () => {

    // given
    fixture.detectChanges();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 16, 13, 25, 26));

    // when
    window.dispatchEvent(new Event('beforeprint'));

    // then
    expect(sheets()[0].querySelector('.span_print_details').textContent).toContain('Oct 16, 2026');
  });

  it('should stop observing size of pages when destroyed', () => {

    // given
    fixture.detectChanges();
    const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');

    // when
    fixture.destroy();

    // then
    expect(disconnect).toHaveBeenCalled();
  });
});
