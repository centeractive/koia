import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ViewToolbarComponent } from './view-toolbar.component';

@Component({
  template: `
    <koia-view-toolbar [moreMenu]="withMoreMenu ? moreMenu : undefined">
      <button id="but_custom" mat-icon-button>x</button>
    </koia-view-toolbar>
    <mat-menu #moreMenu="matMenu"><button id="menuItemCustom" mat-menu-item>Custom</button></mat-menu>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  withMoreMenu = true;
}

describe('ViewToolbarComponent', () => {

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, ViewToolbarComponent],
      imports: [MatMenuModule, MatButtonModule, MatIconModule, MatTooltipModule]
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  function element<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector);
  }

  it('more button should open more menu of host', fakeAsync(() => {

    // given
    fixture.detectChanges();

    // when
    element('.but_view_more').click();
    fixture.detectChanges();
    flush();

    // then
    expect(document.querySelector('#menuItemCustom')).not.toBeNull();
  }));

  it('more button should be hidden without more menu', () => {

    // given
    host.withMoreMenu = false;

    // when
    fixture.detectChanges();

    // then
    expect(element('.but_view_more')).toBeNull();
    expect(element('#but_custom')).not.toBeNull();
  });

  it('should omit separator without more menu', () => {

    // given
    host.withMoreMenu = false;

    // when
    fixture.detectChanges();

    // then
    expect(element('.koia-toolbar-separator')).toBeNull();
    expect(element('#but_custom')).not.toBeNull();
  });

  it('should project custom buttons after separator', () => {

    // when
    fixture.detectChanges();

    // then
    expect(element('.view_toolbar > .koia-toolbar-separator + #but_custom')).not.toBeNull();
  });

  it('toolbar should let header surface show through and have top border only', () => {

    // when
    fixture.detectChanges();

    // then
    const toolbar = element('.view_toolbar');
    const style = getComputedStyle(toolbar);
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(style.borderTopWidth).toBe('1px');
    expect(style.borderTopColor).toBe('rgb(197, 202, 233)');
    expect(style.borderBottomStyle).toBe('none');
    expect(toolbar.offsetHeight).toBe(48);
  });
});
