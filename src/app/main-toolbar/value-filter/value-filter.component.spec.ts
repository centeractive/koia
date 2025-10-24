import { ComponentFixture, TestBed, fakeAsync, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { FormattedFloatDirective } from 'app/shared/directives/formatted-float.directive';
import { Column, DataType, Operator, PropertyFilter } from 'app/shared/model';
import { DBService } from 'app/shared/services/backend';
import { SceneFactory } from 'app/shared/test';
import { ValueFilterComponent } from './value-filter.component';

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
      { name: 'Amount', dataType: DataType.NUMBER, width: 70 },
      { name: 'Address', dataType: DataType.OBJECT, width: 50 },
      { name: 'Valid', dataType: DataType.BOOLEAN, width: 30 },
      { name: 'Signed Off', dataType: DataType.BOOLEAN, width: 30 }
    ];
    const scene = SceneFactory.createScene('1', columns);
    spyOn(dbService, 'getActiveScene').and.returnValue(scene);
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ValueFilterComponent, FormattedFloatDirective],
      imports: [
        MatButtonModule, MatIconModule, MatTooltipModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
        MatMenuModule
      ],
      providers: [
        { provide: DBService, useValue: dbService }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValueFilterComponent);
    component = fixture.componentInstance;
    component.filter = new PropertyFilter('Amount', Operator.EQUAL, '', DataType.NUMBER);
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

  it('#availableOperators should return operators for BOOLEAN data type', () => {

    // given
    component.filter = new PropertyFilter('Signed Off', Operator.NOT_EMPTY, '', DataType.TIME);

    // when
    const operators = component.availableOperators();

    // then
    expect(operators).toEqual([Operator.EQUAL, Operator.EMPTY, Operator.NOT_EMPTY]);
  });

  it('#availableOperators should return operators for OBJECT data type', () => {

    // given
    component.filter = new PropertyFilter('Address', Operator.NOT_EMPTY, '', DataType.TIME);

    // when
    const operators = component.availableOperators();

    // then
    expect(operators).toEqual([Operator.CONTAINS, Operator.EMPTY, Operator.NOT_EMPTY]);
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

  it('#onNameChanged should change property filter name, data type and initialize value', () => {

    // when
    component.onNameChanged(column('Valid'));

    // then
    expect(component.filter.name).toBe('Valid');
    expect(component.filter.dataType).toBe(DataType.BOOLEAN);
    expect(component.filter.value).toBe(true);
  });

  it('#onNameChanged should change property filter name but keep data type and value', () => {

    // given
    component.filter.name = 'Valid';
    component.filter.dataType = DataType.BOOLEAN;
    component.filter.value = false;

    // when
    component.onNameChanged(column('Signed Off'));

    // then
    expect(component.filter.name).toBe('Signed Off');
    expect(component.filter.dataType).toBe(DataType.BOOLEAN);
    expect(component.filter.value).toBe(false);
  });

  it('#onNameChanged should emit change event when filter is applicable', () => {

    // given
    component.filter = new PropertyFilter('Level', Operator.EQUAL, 'ERROR');
    spyOn(component.onChange, 'emit');

    // when
    component.onNameChanged(column('Host'));

    // then
    expect(component.onChange.emit).toHaveBeenCalled();
  });

  it('#onNameChanged should not emit change event when filter is not applicable', () => {

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

  it('#onNameChanged should change filter operator when TIME column', () => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.GREATER_THAN, 22);

    // when
    component.onNameChanged(column('Time'));

    // then
    expect(component.filter.operator).toBe(Operator.NOT_EMPTY);
  });

  it('#onValueChanged should change filter text value', () => {

    // given
    component.filter = new PropertyFilter('Level', Operator.CONTAINS, 'WARN', DataType.TEXT);

    // when
    component.onValueChanged('ERR');

    // then
    expect(component.filter.value).toBe('ERR');
  });

  it('#onValueChanged should change filter number value when number is valid', () => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.EQUAL, '200.7', DataType.NUMBER);
    const formattedValue = (1_200_300.55).toLocaleString();

    // when
    component.onValueChanged(formattedValue);

    // then
    expect(component.filter.value).toBe(1_200_300.55);
    expect(component.valueControl.hasError('error')).toBe(false);
  });

  it('#onValueChanged should change filter number value when number has misplaced thousands separators', () => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.EQUAL, (2.000).toLocaleString(), DataType.NUMBER);
    const ts = (1_000).toLocaleString().charAt(1);
    const wronglyFormatted = '2' + ts + '0000';

    // when
    component.onValueChanged(wronglyFormatted);

    // then
    expect(component.filter.value).toBe(20_000);
    expect(component.valueControl.hasError('error')).toBe(false);
  });

  it('#onValueChanged should change filter value when value is completable float', () => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.EQUAL, '1.7', DataType.NUMBER);
    const completableFloat = (0.7).toLocaleString().slice(1);

    // when
    component.onValueChanged(completableFloat);

    // then
    expect(component.filter.value).toBe(0.7);
    expect(component.valueControl.hasError('error')).toBe(false);
  });

  it('#onValueChanged should change filter value when value is list of floats', () => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.ANY_OF, (1.7).toLocaleString(), DataType.NUMBER);
    const listOfFloats = [1.7, 2.5].map(f => f.toLocaleString()).join(';');

    // when
    component.onValueChanged(listOfFloats);

    // then
    expect(component.filter.value).toBe(listOfFloats);
    expect(component.valueControl.hasError('error')).toBe(false);
  });

  it('#onValueChanged should change control state if value is invalid', () => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.EQUAL, '200.7', DataType.NUMBER);

    // when
    component.onValueChanged('x');

    // then
    expect(component.filter.value).toBe('x');
    expect(component.valueControl.hasError('error')).toBe(true);
    expect(component.valueControl.getError('error')).toBe('Invalid number');
  });

  it('pressing digit key in number column filter field should not emit change event', fakeAsync(() => {

    // given
    component.filter = new PropertyFilter('Amount', Operator.EQUAL, '200.7', DataType.NUMBER);
    fixture.detectChanges();
    const htmlInput = fixture.debugElement.query(By.css('#column_filter_input')).nativeElement;
    spyOn(component.onChange, 'emit');

    // when
    const event: any = document.createEvent('Event');
    event.key = '1';
    event.initEvent('keyup');
    htmlInput.dispatchEvent(event);

    // then
    expect(component.onChange.emit).not.toHaveBeenCalled();
    expect(component.valueControl.hasError('error')).toBe(false);
  }));

  it('pressing <enter> in number column filter field should emit change event', () => {

    // given
    const ds = (0.1).toLocaleString().charAt(1);
    component.filter = new PropertyFilter('Amount', Operator.EQUAL, '200' + ds + '7', DataType.NUMBER);
    fixture.detectChanges();
    const htmlInput = fixture.debugElement.query(By.css('#column_filter_input')).nativeElement;
    htmlInput.value = '1';
    htmlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    spyOn(component.onChange, 'emit');

    // when
    const event: any = document.createEvent('Event');
    event.initEvent('search');
    htmlInput.dispatchEvent(event);

    // then
    expect(component.onChange.emit).toHaveBeenCalled();
  });

  function column(name: string): Column {
    return columns.find(c => c.name === name);
  }
});
