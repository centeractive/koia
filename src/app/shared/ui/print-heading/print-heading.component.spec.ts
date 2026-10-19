import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeadingComponent } from './page-heading.component';
import { PrintHeadingComponent } from './print-heading.component';
import { PORTRAIT_PRINT_CLASS, resetPrintOrientation } from './print-orientation';
import { PRINT_ZOOM_PROPERTY, resetPrintZoom } from './print-zoom';

@Component({
  template: `
    <div class="view_root">
      <div class="div_header"><koia-print-heading [title]="title" [sceneName]="sceneName" [portrait]="portrait"
        (printStart)="printStarts.push($event)" /></div>
      <div class="printable" style="width: 1960px"></div>
    </div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  title = 'Sales';
  sceneName = 'Fruits';
  portrait = false;
  printStarts: Date[] = [];
}

describe('PrintHeadingComponent', () => {

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, PageHeadingComponent, PrintHeadingComponent]
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.nativeElement.style.display = 'block';
    fixture.nativeElement.style.width = '2400px';
    fixture.detectChanges();
  });

  afterEach(() => {
    resetPrintZoom(document);
    resetPrintOrientation(document);
    vi.useRealTimers();
  });

  function element<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector);
  }

  function printZoom(): string {
    return document.documentElement.style.getPropertyValue(PRINT_ZOOM_PROPERTY);
  }

  it('should show koia logo, title and scene name', () => {

    // when
    const logo = element<HTMLImageElement>('koia-print-heading img');

    // then
    expect(logo.src.endsWith('/assets/koialogo_50x50.png')).toBe(true);
    expect(element('.span_print_title').textContent).toBe('Sales');
    expect(element('.span_print_details').textContent).toContain('Scene: Fruits');
  });

  it('should show print time when printing starts', () => {

    // given
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 16, 13, 25, 26));

    // when
    window.dispatchEvent(new Event('beforeprint'));

    // then
    expect(element('.span_print_details').textContent).toContain('Oct 16, 2026');
  });

  it('should fit printable content of its view to page when printing starts', () => {

    // when
    window.dispatchEvent(new Event('beforeprint'));

    // then
    expect(printZoom()).toBe('0.5');
  });

  it('should ignore printing when its view is not displayed', () => {

    // given
    element('.div_header').style.display = 'none';

    // when
    window.dispatchEvent(new Event('beforeprint'));

    // then
    expect(element('.span_print_details').textContent).toBe('Scene: Fruits');
    expect(printZoom()).toBe('');
  });

  it('should reset zoom when printing ends', () => {

    // given
    window.dispatchEvent(new Event('beforeprint'));

    // when
    window.dispatchEvent(new Event('afterprint'));

    // then
    expect(printZoom()).toBe('');
  });

  function isPortraitPrint(): boolean {
    return document.documentElement.classList.contains(PORTRAIT_PRINT_CLASS);
  }

  it('should print portrait sheets when printing portrait view starts', () => {

    // given
    fixture.componentInstance.portrait = true;
    fixture.detectChanges();

    // when
    window.dispatchEvent(new Event('beforeprint'));

    // then
    expect(isPortraitPrint()).toBe(true);
  });

  it('should print landscape sheets when printing landscape view starts', () => {

    // given
    document.documentElement.classList.add(PORTRAIT_PRINT_CLASS);

    // when
    window.dispatchEvent(new Event('beforeprint'));

    // then
    expect(isPortraitPrint()).toBe(false);
  });

  it('should keep print orientation when its view is not displayed', () => {

    // given
    fixture.componentInstance.portrait = true;
    fixture.detectChanges();
    element('.div_header').style.display = 'none';

    // when
    window.dispatchEvent(new Event('beforeprint'));

    // then
    expect(isPortraitPrint()).toBe(false);
    expect(fixture.componentInstance.printStarts).toEqual([]);
  });

  it('should reset print orientation when printing ends', () => {

    // given
    fixture.componentInstance.portrait = true;
    fixture.detectChanges();
    window.dispatchEvent(new Event('beforeprint'));

    // when
    window.dispatchEvent(new Event('afterprint'));

    // then
    expect(isPortraitPrint()).toBe(false);
  });

  it('should emit print time when printing starts', () => {

    // given
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 16, 13, 25, 26));

    // when
    window.dispatchEvent(new Event('beforeprint'));

    // then
    expect(fixture.componentInstance.printStarts).toEqual([new Date(2026, 9, 16, 13, 25, 26)]);
  });

  it('should be hidden on screen', () => {

    // when
    const display = getComputedStyle(element('koia-print-heading')).display;

    // then
    expect(display).toBe('none');
  });
});
