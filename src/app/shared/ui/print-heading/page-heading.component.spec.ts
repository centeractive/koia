import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeadingComponent } from './page-heading.component';

describe('PageHeadingComponent', () => {

  let fixture: ComponentFixture<PageHeadingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PageHeadingComponent]
    });
    fixture = TestBed.createComponent(PageHeadingComponent);
  });

  function element<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector);
  }

  it('should show koia logo, title, scene name and print time', () => {

    // given
    fixture.componentRef.setInput('title', 'Sales');
    fixture.componentRef.setInput('sceneName', 'Fruits');
    fixture.componentRef.setInput('printedAt', new Date(2026, 9, 16, 13, 25, 26));

    // when
    fixture.detectChanges();

    // then
    expect(element<HTMLImageElement>('img').getAttribute('src')).toBe('/assets/koialogo_50x50.png');
    expect(element('.span_print_title').textContent).toBe('Sales');
    expect(element('.span_print_details').textContent).toContain('Scene: Fruits');
    expect(element('.span_print_details').textContent).toContain('Oct 16, 2026');
  });

  it('should not box its content', () => {

    // when
    fixture.detectChanges();

    // then
    expect(getComputedStyle(fixture.nativeElement).display).toBe('contents');
  });
});
