import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeadingComponent } from '../print-heading/page-heading.component';
import { PageFormat } from './page-format';
import { SheetComponent } from './sheet.component';
import { SheetLayout } from './sheet-layout';

@Component({
  template: `
    <div id="sheet" koiaSheet [layout]="layout" [page]="page" [count]="3" [spare]="spare" [title]="'Sales'" [sceneName]="'Fruits'"
      [printedAt]="printedAt"><p id="content">content</p></div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  layout = new SheetLayout();
  page = 1;
  spare = false;
  printedAt = new Date(2026, 9, 16, 13, 25, 26);
}

describe('SheetComponent', () => {

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, SheetComponent, PageHeadingComponent]
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  function sheet(): HTMLElement {
    return fixture.nativeElement.querySelector('#sheet');
  }

  it('should be page drawn as sheet styled by its layout', () => {

    // when
    fixture.detectChanges();

    // then
    expect(sheet().classList).toContain('div_canvas_page');
    expect(sheet().classList).toContain('div_canvas_sheet');
    expect(sheet().classList).not.toContain('div_canvas_page_spare');
    expect(sheet().style.marginTop).toBe(PageFormat.DESK_GUTTER_PX + 'px');
  });

  it('should show heading, content and page number', () => {

    // when
    fixture.detectChanges();

    // then
    const children = Array.from(sheet().children);
    expect(children.map(c => c.className || c.id)).toEqual(['div_canvas_sheet_header', 'content', 'div_canvas_sheet_footer']);
    expect(sheet().querySelector('.div_canvas_sheet_header .span_print_title').textContent).toBe('Sales');
    expect(sheet().querySelector('.div_canvas_sheet_header .span_print_details').textContent).toContain('Scene: Fruits');
    expect(sheet().querySelector('.div_canvas_sheet_header .span_print_details').textContent).toContain('Oct 16, 2026');
    expect(sheet().querySelector('.div_canvas_sheet_footer').textContent.trim()).toBe('Page 2 of 3');
  });

  it('spare sheet should show neither heading nor page number', () => {

    // given
    host.spare = true;

    // when
    fixture.detectChanges();

    // then
    expect(sheet().classList).toContain('div_canvas_page_spare');
    expect(sheet().querySelector('.div_canvas_sheet_header').children.length).toBe(0);
    expect(sheet().querySelector('.div_canvas_sheet_footer').textContent.trim()).toBe('');
  });

  it('unpaged page should show content only, without sheet', () => {

    // given
    host.layout = new SheetLayout(PageFormat.UNPAGED);

    // when
    fixture.detectChanges();

    // then
    expect(sheet().classList).toContain('div_canvas_page');
    expect(sheet().classList).not.toContain('div_canvas_sheet');
    expect(Array.from(sheet().children).map(c => c.id)).toEqual(['content']);
    expect(sheet().getAttribute('style')).toBeNull();
  });
});
