import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ColumnMappingComponent } from './column-mapping.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HAMMER_LOADER } from '@angular/platform-browser';
import { DataType, ColumnPair } from 'app/shared/model';
import { DatePipe } from '@angular/common';
import { ColumnMappingGenerator } from './mapper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

describe('ColumnMappingComponent', () => {
  let component: ColumnMappingComponent;
  let fixture: ComponentFixture<ColumnMappingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ColumnMappingComponent ],
      imports: [
        MatButtonModule, MatIconModule, MatTooltipModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
        MatSelectModule, BrowserAnimationsModule
      ],
      providers: [
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    })
    .compileComponents();
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
    spyOn(component.onChange, 'emit');

    // when
    component.onColumnNameChanged('Amount');

    // then
    expect(component.mapping.target.name).toBe('Amount');
    expect(component.onChange.emit).toHaveBeenCalled();
  });

  it('#onDataTypeChanged should emit change event', () => {

    // given
    component.mapping.target.dataType = DataType.TEXT;
    spyOn(component.onChange, 'emit');

    // when
    component.onDataTypeChanged();

    // then
    expect(component.onChange.emit).toHaveBeenCalled();
  });

  it('#onDataTypeChanged should set target format for TIME column when not present yet', () => {

    // given
    component.mapping.target.dataType = DataType.TIME;
    spyOn(component.onChange, 'emit');

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
    spyOn(component.onChange, 'emit');

    // when
    component.onDataTypeChanged();

    // then
    expect(component.mapping.target.format).toBe('d MMM yyyy HH:mm');
    expect(component.onChange.emit).toHaveBeenCalled();
  });

  it('#getColumnNameErrorMessage should return empty string when column name is valid', () => {

    // when
    const error = component.getColumnNameErrorMessage();

    // then
    expect(error).toBe('');
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

  it('#openDatePipeFormatPage should open window', () => {

    // given
    spyOn(window, 'open').and.callFake(s => null);

    // when
    component.openDatePipeFormatPage();

    // then
    expect(window.open).toHaveBeenCalledWith('https://angular.io/api/common/DatePipe#custom-format-options');
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
