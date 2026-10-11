import { ChangeDetectionStrategy, Component, provideZoneChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Column, DataType } from 'app/shared/model';
import { TableModeTogglesComponent } from './table-mode-toggles.component';

@Component({
  template: `<koia-table-mode-toggles [columns]="columns" [(multiLine)]="multiLine" [(showNestedObjects)]="showNestedObjects" />`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  columns: Column[] = [{ name: 'Data', dataType: DataType.TEXT, width: 10 }];
  multiLine = false;
  showNestedObjects = false;
}

describe('TableModeTogglesComponent', () => {

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent, TableModeTogglesComponent],
      imports: [MatButtonModule, MatIconModule, MatTooltipModule],
      providers: [provideZoneChangeDetection()]
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  function button(icon: string): HTMLButtonElement {
    return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(b => b.textContent.includes(icon));
  }

  it('#click on multi-line button should emit toggled value', () => {

    // given
    fixture.detectChanges();

    // when
    button('format_line_spacing').click();
    fixture.detectChanges();

    // then
    expect(host.multiLine).toBe(true);
  });

  it('should mark multi-line button accent when multi-line', () => {

    // given
    host.multiLine = true;

    // when
    fixture.detectChanges();

    // then
    expect(button('format_line_spacing').classList).toContain('mat-accent');
  });

  it('should hide nested objects button without object column', () => {

    // when
    fixture.detectChanges();

    // then
    expect(button('code')).toBeUndefined();
  });

  it('#click on nested objects button should emit toggled value', () => {

    // given
    host.columns = [...host.columns, { name: 'Nested', dataType: DataType.OBJECT, width: 10 }];
    fixture.detectChanges();

    // when
    button('code').click();
    fixture.detectChanges();

    // then
    expect(host.showNestedObjects).toBe(true);
  });

  it('should mark nested objects button accent when shown', () => {

    // given
    host.columns = [...host.columns, { name: 'Nested', dataType: DataType.OBJECT, width: 10 }];
    host.showNestedObjects = true;

    // when
    fixture.detectChanges();

    // then
    expect(button('code').classList).toContain('mat-accent');
  });
});
