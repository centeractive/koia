import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { ColumnPair, DataType } from 'app/shared/model';
import { KoiaFormDirective } from 'app/shared/directives/koia-form.directive';
import { ColumnMappingComponent } from './column-mapping.component';
import { ColumnMappingGenerator } from './mapper';

@Component({
  template: `<div koiaForm>
    <koia-column-mapping [mapping]="plain" />
    <koia-column-mapping [mapping]="message" [canAddPattern]="true" />
    <koia-column-mapping [mapping]="pattern" />
  </div>`,
  standalone: false
})
class ColumnMappingsHostComponent {
  plain: ColumnPair = { source: { name: 'Amount', dataType: DataType.NUMBER, width: 10 }, target: { name: 'Amount', dataType: DataType.NUMBER, width: 10 } };
  message: ColumnPair = { source: { name: 'Message', dataType: DataType.TEXT, width: 40 }, target: { name: 'Message', dataType: DataType.TEXT, width: 40 } };
  pattern: ColumnPair = {
    source: { name: 'Message', dataType: DataType.TEXT, width: 40 },
    target: { name: 'Message pattern', dataType: DataType.TEXT, width: 40, patternOf: 'Message' }
  };
}

describe('ColumnMappingComponent', () => {
  let component: ColumnMappingComponent;
  let fixture: ComponentFixture<ColumnMappingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ColumnMappingComponent, ColumnMappingsHostComponent, KoiaFormDirective],
      imports: [
        MatButtonModule, MatIconModule, MatTooltipModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
        MatSelectModule
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ColumnMappingComponent);
    component = fixture.componentInstance;
    component.mapping = createColumnPair();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#onColumnNameChanged should emit change event', () => {

    // given
    vi.spyOn(component.onChange, 'emit').mockReturnValue(undefined);

    // when
    component.onColumnNameChanged('Amount');

    // then
    expect(component.mapping.target.name).toBe('Amount');
    expect(component.onChange.emit).toHaveBeenCalled();
  });

  it('#onDataTypeChanged should emit change event', () => {

    // given
    component.mapping.target.dataType = DataType.TEXT;
    vi.spyOn(component.onChange, 'emit').mockReturnValue(undefined);

    // when
    component.onDataTypeChanged();

    // then
    expect(component.onChange.emit).toHaveBeenCalled();
  });

  it('#onDataTypeChanged should set target format for TIME column when not present yet', () => {

    // given
    component.mapping.target.dataType = DataType.TIME;
    vi.spyOn(component.onChange, 'emit').mockReturnValue(undefined);

    // when
    component.onDataTypeChanged();

    // then
    expect(component.mapping.target.format).toBe('yyyy');
    expect(component.onChange.emit).toHaveBeenCalled();
  });

  it('#onDataTypeChanged should leaf target format for TIME column when already present', () => {

    // given
    component.mapping.target.dataType = DataType.TIME;
    component.mapping.target.format = 'd MMM yyyy HH:mm';
    vi.spyOn(component.onChange, 'emit').mockReturnValue(undefined);

    // when
    component.onDataTypeChanged();

    // then
    expect(component.mapping.target.format).toBe('d MMM yyyy HH:mm');
    expect(component.onChange.emit).toHaveBeenCalled();
  });

  it('#selectionChange of display format should emit change event', () => {

    // given
    component.mapping.target.dataType = DataType.TIME;
    component.mapping.target.format = 'yyyy';
    fixture.detectChanges();
    vi.spyOn(component.onChange, 'emit').mockReturnValue(undefined);
    const select = fixture.debugElement.query(By.css('.select_display_format'));

    // when
    select.triggerEventHandler('selectionChange', { value: 'MMM yyyy' });

    // then
    expect(component.onChange.emit).toHaveBeenCalled();
  });

  it('#getColumnNameErrorMessage should return empty string when column name is valid', () => {

    // when
    const error = component.getColumnNameErrorMessage();

    // then
    expect(error).toBe('');
  });

  it('should show name in use error when input says so', () => {

    // when
    fixture.componentRef.setInput('nameInUse', true);
    fixture.detectChanges();

    // then
    expect(component.getColumnNameErrorMessage()).toBe('Name is already in use');
  });

  it('should clear name in use error when input says so no more', () => {

    // given
    fixture.componentRef.setInput('nameInUse', true);
    fixture.detectChanges();

    // when
    fixture.componentRef.setInput('nameInUse', false);
    fixture.detectChanges();

    // then
    expect(component.getColumnNameErrorMessage()).toBe('');
  });

  it('should show underscore error', () => {

    // when
    component.columnNameControl.setValue('_id');

    // then
    expect(component.getColumnNameErrorMessage()).toBe('Name must not start with _');
  });

  it('#getColumnNameErrorMessage should return error when column name is empty', () => {

    // given
    component.columnNameControl.setValue('');

    // when
    const error = component.getColumnNameErrorMessage();

    // then
    expect(error).toBe('Name is required');
  });

  it('#getColumnNameErrorMessage should return error when column name is $', () => {

    // given
    component.columnNameControl.setValue('$');

    // when
    const error = component.getColumnNameErrorMessage();

    // then
    expect(error).toBe('Name must not start with $');
  });

  it('#getColumnNameErrorMessage should return error when column name starts with $', () => {

    // given
    component.columnNameControl.setValue('$Name');

    // when
    const error = component.getColumnNameErrorMessage();

    // then
    expect(error).toBe('Name must not start with $');
  });

  it('#getColumnNameErrorMessage should return error when column name is too long', () => {

    // given
    component.columnNameControl.setValue('x'.repeat(ColumnMappingGenerator.COLUMN_NAME_MAX_LENGTH) + 1);

    // when
    const error = component.getColumnNameErrorMessage();

    // then
    expect(error).toBe('Name must not exceed 100 characters');
  });

  it('#formattedNow should return formatted time', () => {

    // when
    const formattedTime = component.formattedNow('d MMM yyyy HH:mm');

    // then
    expect(formattedTime).toBe(new DatePipe('en-US').transform(component.now, 'd MMM yyyy HH:mm'));
  });

  it('#warningOf should return translation key of incompatible data types warning', () => {

    // given
    const mapping = createColumnPair();
    mapping.warning = ColumnMappingGenerator.INCOMPATIBLE_DATA_TYPES;

    // when
    const warning = component.warningOf(mapping);

    // then
    expect(warning).toBe('scene.column.incompatibleTypes');
  });

  it('#warningOf should return custom warning', () => {

    // given
    const mapping = createColumnPair();
    mapping.warning = 'custom warning';

    // when
    const warning = component.warningOf(mapping);

    // then
    expect(warning).toBe('custom warning');
  });

  it('#openDatePipeFormatPage should open window', () => {

    // given
    vi.spyOn(window, 'open').mockImplementation(() => null);

    // when
    component.openDatePipeFormatPage();

    // then
    expect(window.open).toHaveBeenCalledWith('https://angular.io/api/common/DatePipe#custom-format-options', '_blank', 'noopener');
  });

  it('should not show add pattern button by default', () => {
    expect(fixture.debugElement.query(By.css('.but_add_pattern'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.icon_pattern'))).toBeNull();
  });

  it('should emit add pattern event when add pattern button is clicked', () => {

    // given
    vi.spyOn(component.onAddPattern, 'emit').mockReturnValue(undefined);
    fixture.componentRef.setInput('canAddPattern', true);
    fixture.detectChanges();

    // when
    fixture.debugElement.query(By.css('.but_add_pattern')).nativeElement.click();

    // then
    expect(component.onAddPattern.emit).toHaveBeenCalled();
  });

  it('should show pattern icon instead of add pattern button for pattern column', () => {

    // given
    component.mapping.target.patternOf = 'Message';
    fixture.componentRef.setInput('canAddPattern', true);

    // when
    fixture.detectChanges();

    // then
    expect(fixture.debugElement.query(By.css('.icon_pattern')).nativeElement.textContent).toBe('subdirectory_arrow_right');
    expect(fixture.debugElement.query(By.css('.but_add_pattern'))).toBeNull();
  });

  describe('layout of rows', () => {

    let hostFixture: ComponentFixture<ColumnMappingsHostComponent>;
    let rows: HTMLElement[];

    beforeEach(() => {
      hostFixture = TestBed.createComponent(ColumnMappingsHostComponent);
      hostFixture.detectChanges();
      rows = Array.from(hostFixture.nativeElement.querySelectorAll('koia-column-mapping'));
    });

    function centerY(element: Element): number {
      const rect = element.getBoundingClientRect();
      return rect.top + rect.height / 2;
    }

    it('should align column name fields of plain, message and pattern rows', () => {
      const lefts = rows.map(r => r.querySelector('.column_name').getBoundingClientRect().left);
      expect(lefts).toEqual([lefts[0], lefts[0], lefts[0]]);
    });

    it('should reserve same width for actions of plain, message and pattern rows', () => {
      expect(rows.map(r => r.querySelector('.column_actions').getBoundingClientRect().width)).toEqual([64, 64, 64]);
    });

    it('should show compact delete and add pattern buttons', () => {
      const buttons = Array.from(rows[1].querySelectorAll<HTMLElement>('.but_delete, .but_add_pattern'));
      expect(buttons.map(b => b.getBoundingClientRect().height)).toEqual([32, 32]);
    });

    it('display format should be wider than source format', () => {

      // given
      const columnMapping: ColumnMappingComponent = hostFixture.debugElement.queryAll(By.directive(ColumnMappingComponent))[0].componentInstance;
      columnMapping.mapping.target.dataType = DataType.TIME;
      columnMapping.onDataTypeChanged();

      // when
      hostFixture.detectChanges();

      // then
      expect(rows[0].querySelector('.column_display_format').getBoundingClientRect().width).toBe(248);
      expect(rows[0].querySelector('.span_source_format .column_format').getBoundingClientRect().width).toBe(220);
    });

    it('should vertically center buttons with column name field', () => {
      const buttons = Array.from(rows[1].querySelectorAll('.but_delete, .but_add_pattern'));
      const fieldCenter = centerY(rows[1].querySelector('.column_name .mat-mdc-text-field-wrapper'));
      expect(buttons.map(b => Math.abs(centerY(b) - fieldCenter) <= 1)).toEqual([true, true]);
    });
  });

  function createColumnPair(): ColumnPair {
    return {
      source: {
        name: 'x',
        dataType: DataType.NUMBER,
        width: 10
      },
      target: {
        name: 'x',
        dataType: DataType.NUMBER,
        width: 10
      }
    };
  }
});
