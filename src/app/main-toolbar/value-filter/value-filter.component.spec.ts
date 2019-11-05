import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ValueFilterComponent } from './value-filter.component';
import { Operator, DataType, Column, PropertyFilter } from 'app/shared/model';
import { DBService } from 'app/shared/services/backend';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule, MatTooltipModule, MatIconModule, MatButtonModule, MatInputModule, MatMenuModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SceneFactory } from 'app/shared/test';
import { By, HAMMER_LOADER } from '@angular/platform-browser';

describe('ValueFilterComponent', () => {

  let component: ValueFilterComponent;
  let fixture: ComponentFixture<ValueFilterComponent>;
  let columns: Column[];
  const dbService = new DBService(null);

  beforeAll(() => {
    columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100, format: 'yyyy-MM-dd HH:mm:ss SSS' },
      { name: 'Level', dataType: DataType.TEXT, width: 60 },
      { name: 'Host', dataType: DataType.TEXT, width: 80 },
      { name: 'Path', dataType: DataType.TEXT, width: 200 },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70 }
    ];
    const scene = SceneFactory.createScene('1', columns);
    spyOn(dbService, 'getActiveScene').and.returnValue(scene);
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ValueFilterComponent],
      imports: [
        MatButtonModule, MatIconModule, MatTooltipModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
        MatMenuModule, BrowserAnimationsModule
      ],
      providers: [
        { provide: DBService, useValue: dbService },
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValueFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#availableOperators should return all operators when column has TEXT data type', () => {

    // given
    component.filter = new PropertyFilter('Level', Operator.EQUAL, 'INFO', DataType.TEXT);

    // when
    const operators = component.availableOperators();

    // then
    const expected = Object.keys(Operator)
      .map(key => Operator[key]);
    expect(operators).toEqual(expected);
  });

  it('#availableOperators should return operators for TIME data type', () => {

    // given
    component.filter = new PropertyFilter('Time', Operator.NOT_EMPTY, '', DataType.TIME);

    // when
    const operators = component.availableOperators();

    // then
    expect(operators).toEqual([Operator.EMPTY, Operator.NOT_EMPTY]);
  });

  it('#availableOperators should return operators for NUMBER data type', () => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.LESS_THAN, 10, DataType.NUMBER);

    // when
    const operators = component.availableOperators();

    // then
    const expected = Object.keys(Operator)
      .map(key => Operator[key])
      .filter(o => o !== Operator.CONTAINS);
    expect(operators).toEqual(expected);
  });

  it('#onNameChanged should change property filter name and data type', () => {

    // given
    component.filter = new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT);

    // when
    component.onNameChanged(column('Amount'));

    // then
    expect(component.filter.name).toBe('Amount');
    expect(component.filter.dataType).toBe(DataType.NUMBER);
  });

  it('#onNameChanged should refresh entries when filter is applicable', () => {

    // given
    component.filter = new PropertyFilter('Level', Operator.EQUAL, 'ERROR');
    spyOn(component.onChange, 'emit');

    // when
    component.onNameChanged(column('Host'));

    // then
    expect(component.onChange.emit).toHaveBeenCalled();
  });

  it('#onNameChanged should not refresh entries when filter is not applicable', () => {

    // given
    component.filter = new PropertyFilter('Level', Operator.EQUAL, '');
    spyOn(component.onChange, 'emit');

    // when
    component.onNameChanged(column('Host'));

    // then
    expect(component.onChange.emit).not.toHaveBeenCalled();
  });

  it('#onNameChanged should change operator when CONTAINS with non TEXT column', () => {

    // given
    component.filter = new PropertyFilter('Level', Operator.CONTAINS, 'ERR');

    // when
    component.onNameChanged(column('Amount'));

    // then
    expect(component.filter.operator).toBe(Operator.EQUAL);
  });

  it('#onNameChanged should change operator when TIME column', () => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.GREATER_THAN, 22);

    // when
    component.onNameChanged(column('Time'));

    // then
    expect(component.filter.operator).toBe(Operator.NOT_EMPTY);
  });

  it('#onValueChanged should change text value', () => {

    // given
    component.filter = new PropertyFilter('Level', Operator.CONTAINS, 'WARN', DataType.TEXT);

    // when
    component.onValueChanged('ERR');

    // then
    expect(component.filter.value).toBe('ERR');
  });

  it('#onValueChanged should change number value', () => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.EQUAL, '200.7', DataType.NUMBER);

    // when
    component.onValueChanged('1,200,300.55');

    // then
    expect(component.filter.value).toBe(1_200_300.55);
    expect(component.valueControl.hasError('error')).toBeFalsy();
  });

  it('#onValueChanged should change control state if value is invalid', () => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.EQUAL, '200.7', DataType.NUMBER);

    // when
    component.onValueChanged('x');

    // then
    expect(component.valueControl.hasError('error')).toBeTruthy();
    expect(component.valueControl.getError('error')).toBe('Invalid number');
  });

  it('pressing character key in value field should not emit change event', fakeAsync(() => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.EQUAL, '200.7', DataType.NUMBER);
    fixture.detectChanges();
    const formField = <HTMLElement>fixture.debugElement.query(By.css('.column_filter_value')).nativeElement;
    const htmlInput = <HTMLInputElement>formField.getElementsByTagName('INPUT')[0];
    spyOn(component.onChange, 'emit');

    // when
    const event: any = document.createEvent('Event');
    event.key = '1';
    event.initEvent('keyup');
    htmlInput.dispatchEvent(event);

    // then
    expect(component.onChange.emit).not.toHaveBeenCalled();
    expect(component.valueControl.hasError('error')).toBeFalsy();
  }));

  it('pressing <enter> in column filter field should emit onFilterChange', fakeAsync(() => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.EQUAL, '200.7', DataType.NUMBER);
    fixture.detectChanges();
    const formField = <HTMLElement>fixture.debugElement.query(By.css('.column_filter_value')).nativeElement;
    const htmlInput = <HTMLInputElement>formField.getElementsByTagName('INPUT')[0];
    htmlInput.value = 'ERR';
    htmlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    spyOn(component.onChange, 'emit');

    // when
    const event: any = document.createEvent('Event');
    event.key = 'Enter';
    event.initEvent('keyup');
    htmlInput.dispatchEvent(event);

    // then
    expect(component.onChange.emit).toHaveBeenCalled();
  }));

  it('#click on <clear> button in value field field should emit change event', fakeAsync(() => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.EQUAL, '200.7', DataType.NUMBER);
    fixture.detectChanges();
    const formField = <HTMLElement>fixture.debugElement.query(By.css('.column_filter_value')).nativeElement;
    const htmlInput = <HTMLInputElement>formField.getElementsByTagName('INPUT')[0];
    htmlInput.value = 'ERR';
    htmlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const clearButton = <HTMLButtonElement>formField.getElementsByTagName('BUTTON')[0];
    spyOn(component.onChange, 'emit');

    // when
    clearButton.click();

    // then
    expect(component.onChange.emit).toHaveBeenCalled();
  }));

  function column(name: string): Column {
    return columns.find(c => c.name === name);
  }
});
