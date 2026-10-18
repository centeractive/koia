import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideBarHeaderComponent } from './side-bar-header.component';

@Component({
  template: `
    <koia-side-bar-header [(multiExpandable)]="multiExpandable" (expandAll)="expanded = expanded + 1" (collapseAll)="collapsed = collapsed + 1" />`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  multiExpandable = true;
  expanded = 0;
  collapsed = 0;
}

describe('SideBarHeaderComponent', () => {

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, SideBarHeaderComponent],
      imports: [MatSlideToggleModule, MatButtonModule, MatIconModule, MatTooltipModule]
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  function element(selector: string): HTMLElement {
    return fixture.nativeElement.querySelector(selector);
  }

  function clickToggle(): void {
    element('.toggle_multi_expand button[role="switch"]').click();
    fixture.detectChanges();
  }

  it('should show expand and collapse buttons when multi expansion is on', () => {

    // when
    fixture.detectChanges();

    // then
    expect(element('#but_expand_all')).not.toBeNull();
    expect(element('#but_collapse_all')).not.toBeNull();
  });

  it('should hide expand and collapse buttons when multi expansion is off', () => {

    // given
    host.multiExpandable = false;

    // when
    fixture.detectChanges();

    // then
    expect(element('#but_expand_all')).toBeNull();
    expect(element('#but_collapse_all')).toBeNull();
  });

  it('#click on expand all button should emit expand all', () => {

    // given
    fixture.detectChanges();

    // when
    element('#but_expand_all').click();

    // then
    expect(host.expanded).toBe(1);
  });

  it('#click on collapse all button should emit collapse all', () => {

    // given
    fixture.detectChanges();

    // when
    element('#but_collapse_all').click();

    // then
    expect(host.collapsed).toBe(1);
  });

  it('unchecking multi expansion should update host and collapse all', () => {

    // given
    fixture.detectChanges();

    // when
    clickToggle();

    // then
    expect(host.multiExpandable).toBe(false);
    expect(host.collapsed).toBe(1);
    expect(element('#but_expand_all')).toBeNull();
  });

  it('checking multi expansion should update host without collapsing', () => {

    // given
    host.multiExpandable = false;
    fixture.detectChanges();

    // when
    clickToggle();

    // then
    expect(host.multiExpandable).toBe(true);
    expect(host.collapsed).toBe(0);
    expect(element('#but_expand_all')).not.toBeNull();
  });

  it('header should be white with bottom border', () => {

    // when
    fixture.detectChanges();

    // then
    const header = element('.div_accordion_options');
    const style = getComputedStyle(header);
    expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(style.borderBottomWidth).toBe('1px');
    expect(style.borderBottomColor).toBe('rgb(224, 224, 224)');
    expect(header.offsetHeight).toBe(48);
  });
});
