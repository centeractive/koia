import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { USER_MANUAL_URL } from 'app/shared/utils/user-manual';
import { ManualLinkComponent } from './manual-link.component';

@Component({
  template: '<koia-manual-link />',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent { }

describe('ManualLinkComponent', () => {

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, ManualLinkComponent],
      imports: [MatButtonModule, MatIconModule, MatTooltipModule]
    });
    fixture = TestBed.createComponent(HostComponent);
  });

  function manualLink(): HTMLAnchorElement {
    return fixture.nativeElement.querySelector('#butManual');
  }

  it('should open the user manual in a new tab', () => {

    // when
    fixture.detectChanges();

    // then
    const link = manualLink();
    expect([link.getAttribute('href'), link.target, link.rel, link.getAttribute('aria-label')])
      .toEqual([USER_MANUAL_URL, '_blank', 'noopener', 'User Manual']);
  });

  it('should show help icon with user manual tooltip', () => {

    // when
    fixture.detectChanges();

    // then
    expect(manualLink().querySelector('mat-icon').textContent).toBe('help_outline');
    expect(fixture.debugElement.query(By.css('#butManual')).injector.get(MatTooltip).message).toBe('User Manual');
  });

  it('host should not box manual link', () => {

    // when
    fixture.detectChanges();

    // then
    expect(getComputedStyle(fixture.nativeElement.querySelector('koia-manual-link')).display).toBe('contents');
  });
});
