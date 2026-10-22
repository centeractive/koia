import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { CanvasPaging } from 'app/shared/model';
import { PrintButtonComponent } from '../print-button/print-button.component';
import { PagingTogglesComponent } from './paging-toggles.component';

@Component({
  template: `
    <div id="toolbar"><koia-paging-toggles [paging]="paging" [showMonitor]="showMonitor" [printDisabled]="printDisabled"
      (pagingChange)="changes.push($event)" /></div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  paging: CanvasPaging | undefined = CanvasPaging.NONE;
  showMonitor = true;
  printDisabled = false;
  changes: CanvasPaging[] = [];
}

describe('PagingTogglesComponent', () => {

  const BUTTONS = [
    { id: 'but_monitor_view', paging: CanvasPaging.NONE, icon: 'monitor', tooltip: 'Screen View' },
    { id: 'but_landscape_pages', paging: CanvasPaging.LANDSCAPE, icon: 'crop_landscape', tooltip: 'Landscape Pages' },
    { id: 'but_portrait_pages', paging: CanvasPaging.PORTRAIT, icon: 'crop_portrait', tooltip: 'Portrait Pages' }
  ];

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, PagingTogglesComponent, PrintButtonComponent],
      imports: [MatButtonModule, MatIconModule, MatTooltipModule]
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  function button(id: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector('#' + id);
  }

  function activeButtons(): string[] {
    return BUTTONS.map(b => b.id).filter(id => button(id)?.classList.contains('koia-toggle-active'));
  }

  it.each(BUTTONS)('$id should show icon $icon with tooltip $tooltip', ({ id, icon, tooltip }) => {

    // when
    fixture.detectChanges();

    // then
    expect(button(id).querySelector('mat-icon').textContent).toBe(icon);
    expect(fixture.debugElement.query(By.css('#' + id)).injector.get(MatTooltip).message).toBe(tooltip);
  });

  it('should lay out buttons in toolbar of host, followed by print button and separator', () => {

    // when
    fixture.detectChanges();

    // then
    const toggles: HTMLElement = fixture.nativeElement.querySelector('koia-paging-toggles');
    expect(getComputedStyle(toggles).display).toBe('contents');
    expect(Array.from(toggles.children).map(c => c.id || c.tagName.toLowerCase() || c.className))
      .toEqual(['but_monitor_view', 'but_landscape_pages', 'but_portrait_pages', 'koia-print-button', 'span']);
    expect(toggles.lastElementChild.classList).toContain('koia-toolbar-separator');
  });

  it.each(BUTTONS)('only $id should be active for paging $paging', ({ id, paging }) => {

    // given
    host.paging = paging;

    // when
    fixture.detectChanges();

    // then
    expect(activeButtons()).toEqual([id]);
  });

  it('no button should be active without paging', () => {

    // given
    host.paging = undefined;

    // when
    fixture.detectChanges();

    // then
    expect(activeButtons()).toEqual([]);
  });

  it.each(BUTTONS)('click on $id should emit paging $paging', ({ id, paging }) => {

    // given
    fixture.detectChanges();

    // when
    button(id).click();

    // then
    expect(host.changes).toEqual([paging]);
  });

  it('should hide monitor button when not shown', () => {

    // given
    host.showMonitor = false;

    // when
    fixture.detectChanges();

    // then
    expect(button('but_monitor_view')).toBeNull();
    expect(button('but_landscape_pages')).not.toBeNull();
  });

  it.each([
    { paging: CanvasPaging.NONE, printDisabled: false, disabled: true },
    { paging: undefined, printDisabled: false, disabled: true },
    { paging: CanvasPaging.LANDSCAPE, printDisabled: false, disabled: false },
    { paging: CanvasPaging.PORTRAIT, printDisabled: false, disabled: false },
    { paging: CanvasPaging.LANDSCAPE, printDisabled: true, disabled: true }
  ])('print button should be disabled $disabled for paging $paging when print disabled $printDisabled', ({ paging, printDisabled, disabled }) => {

    // given
    host.paging = paging;
    host.printDisabled = printDisabled;

    // when
    fixture.detectChanges();

    // then
    expect(button('but_print').disabled).toBe(disabled);
  });
});
