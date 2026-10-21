import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { PrintButtonComponent } from './print-button.component';

@Component({
  template: '<koia-print-button [disabled]="disabled" />',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  disabled: boolean;
}

describe('PrintButtonComponent', () => {

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, PrintButtonComponent],
      imports: [MatButtonModule, MatIconModule, MatTooltipModule]
    });
    fixture = TestBed.createComponent(HostComponent);
  });

  function printButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('#but_print');
  }

  it('should show print icon with print tooltip', () => {

    // when
    fixture.detectChanges();

    // then
    expect(printButton().querySelector('mat-icon').textContent).toBe('print');
    expect(fixture.debugElement.query(By.css('#but_print')).injector.get(MatTooltip).message).toBe('Print current view');
  });

  it('host should not box print button', () => {

    // when
    fixture.detectChanges();

    // then
    expect(getComputedStyle(fixture.nativeElement.querySelector('koia-print-button')).display).toBe('contents');
  });

  it('should be enabled by default', () => {

    // given
    const standalone = TestBed.createComponent(PrintButtonComponent);

    // when
    standalone.detectChanges();

    // then
    expect(standalone.nativeElement.querySelector('#but_print').disabled).toBe(false);
  });

  it('should be disabled when disabled', () => {

    // given
    fixture.componentInstance.disabled = true;

    // when
    fixture.detectChanges();

    // then
    expect(printButton().disabled).toBe(true);
  });

  it('#click should print window', () => {

    // given
    fixture.detectChanges();
    vi.spyOn(window, 'print').mockReturnValue(undefined);

    // when
    printButton().click();

    // then
    expect(window.print).toHaveBeenCalled();
  });
});
