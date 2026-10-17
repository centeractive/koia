import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SavedView, ViewToolbarComponent } from './view-toolbar.component';

@Component({
  template: `
    <koia-view-toolbar [moreMenu]="moreMenu" [persistable]="persistable" [hasContent]="hasContent" [savedViews]="savedViews"
      (save)="saved = true" (restore)="restored = $event">
      <button id="but_custom" mat-icon-button>x</button>
    </koia-view-toolbar>
    <mat-menu #moreMenu="matMenu"><button id="menuItemCustom" mat-menu-item>Custom</button></mat-menu>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  persistable = true;
  hasContent = true;
  savedViews: SavedView[] = [];
  saved = false;
  restored: SavedView;
}

describe('ViewToolbarComponent', () => {

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, ViewToolbarComponent],
      imports: [MatMenuModule, MatButtonModule, MatIconModule, MatBadgeModule, MatTooltipModule]
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  function element<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector);
  }

  function views(): SavedView[] {
    return [{ name: 'View A', modifiedTime: 1 }, { name: 'View B', modifiedTime: 2 }];
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

  it('should show print, save and restore buttons when persistable', () => {

    // when
    fixture.detectChanges();

    // then
    expect(element('#but_print')).not.toBeNull();
    expect(element('#but_save_view')).not.toBeNull();
    expect(element('#but_restore_view')).not.toBeNull();
  });

  it('should hide print, save and restore buttons when not persistable', () => {

    // given
    host.persistable = false;

    // when
    fixture.detectChanges();

    // then
    expect(element('#but_print')).toBeNull();
    expect(element('#but_save_view')).toBeNull();
    expect(element('#but_restore_view')).toBeNull();
    expect(element('.but_view_more')).not.toBeNull();
    expect(element('#but_custom')).not.toBeNull();
  });

  it('#click on print button should print window', () => {

    // given
    fixture.detectChanges();
    vi.spyOn(window, 'print').mockReturnValue(undefined);

    // when
    element('#but_print').click();

    // then
    expect(window.print).toHaveBeenCalled();
  });

  it('should disable print and save buttons when view has no content', () => {

    // given
    host.hasContent = false;

    // when
    fixture.detectChanges();

    // then
    expect(element<HTMLButtonElement>('#but_print').disabled).toBe(true);
    expect(element<HTMLButtonElement>('#but_save_view').disabled).toBe(true);
  });

  it('#click on save button should emit save', () => {

    // given
    fixture.detectChanges();

    // when
    element('#but_save_view').click();

    // then
    expect(host.saved).toBe(true);
  });

  it('should disable restore button when no views are saved', () => {

    // when
    fixture.detectChanges();

    // then
    expect(element<HTMLButtonElement>('#but_restore_view').disabled).toBe(true);
  });

  it('should show number of saved views as badge', () => {

    // given
    host.savedViews = views();

    // when
    fixture.detectChanges();

    // then
    expect(element('#but_restore_view .mat-badge-content').textContent).toBe('2');
    expect(element<HTMLButtonElement>('#but_restore_view').disabled).toBe(false);
  });

  it('selecting saved view should emit restore', fakeAsync(() => {

    // given
    host.savedViews = views();
    fixture.detectChanges();
    element('#but_restore_view').click();
    fixture.detectChanges();
    flush();

    // when
    document.querySelectorAll<HTMLButtonElement>('.menu_item_details')[1].click();

    // then
    expect(host.restored).toBe(host.savedViews[1]);
  }));

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
