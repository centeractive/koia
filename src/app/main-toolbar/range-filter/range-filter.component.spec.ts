import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { ComponentFixture, TestBed, fakeAsync, flush, waitForAsync } from '@angular/core/testing';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { Column, DataType } from 'app/shared/model';
import { Subject } from 'rxjs';
import { NumberRangeFilter } from './model/number-range-filter';
import { TimeRangeFilter } from './model/time-range-filter';
import { RangeFilterComponent } from './range-filter.component';

describe('RangeFilterComponent', () => {

  const amountColumn: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 70 };

  let component: RangeFilterComponent;
  let fixture: ComponentFixture<RangeFilterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RangeFilterComponent],
      imports: [MatButtonModule, MatIconModule, MatBadgeModule, MatTooltipModule, MatMenuModule, NgxSliderModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RangeFilterComponent);
    component = fixture.componentInstance;
    component.filter = new NumberRangeFilter(amountColumn, 1, 10, { min: 2, max: 5 }, false);
    component.ngOnChanges();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('step button should be spaced from slider without non-breaking spaces', () => {

    // when
    const stepButton: HTMLElement = fixture.nativeElement.querySelector('.but_range_step');

    // then
    expect(getComputedStyle(stepButton).marginRight).toBe('8px');
    expect(fixture.nativeElement.querySelector('.div_range_filter').textContent).not.toContain('\u00A0');
  });

  it('inside range trigger should look like chip', () => {

    // when
    const trigger: HTMLElement = fixture.nativeElement.querySelector('.div_range_column_name .span_menu_trigger');

    // then
    expect(getComputedStyle(trigger).borderTopLeftRadius).toBe('12px');
  });

  it('outside range trigger should be highlighted', () => {

    // given
    component.filter.inverted = true;

    // when
    fixture.detectChanges();

    // then
    const trigger: HTMLElement = fixture.nativeElement.querySelector('.span_outside_range_menu_trigger');
    expect(getComputedStyle(trigger).backgroundColor).toBe('rgb(250, 218, 162)');
  });

  it('slider bar should stand out from header surface while selection stays green', () => {

    // when
    const fullBar: HTMLElement = fixture.nativeElement.querySelector('.ngx-slider-full-bar .ngx-slider-bar');
    const selection: HTMLElement = fixture.nativeElement.querySelector('.ngx-slider-selection');

    // then
    expect(getComputedStyle(fullBar).backgroundColor).toBe('rgb(159, 168, 218)');
    expect(getComputedStyle(selection).backgroundColor).toBe('rgb(3, 204, 3)');
  });

  it('#onChanged should refresh update number range filter and emit change event', fakeAsync(() => {

    // given
    vi.spyOn(component.onChange, 'emit').mockReturnValue(undefined);

    // when
    component.onChanged({ value: 3, highValue: 7, pointerType: undefined });

    // then
    expect(component.filter.selValueRange.min).toBe(3);
    expect(component.filter.selValueRange.max).toBe(7);
    expect(component.onChange.emit).toHaveBeenCalled();
  }));

  it('#onInvertedChanged should update number range filter and emit change event', fakeAsync(() => {

    // given
    vi.spyOn(component.onChange, 'emit').mockReturnValue(undefined);

    // when
    component.onInvertedChanged(true);

    // then
    expect(component.filter.inverted).toBe(true);
    expect(component.onChange.emit).toHaveBeenCalled();
  }));

  it('#onHighValueChanged should reset max excluding when NUMBER', () => {

    // given
    component.valueRange.maxExcluding = true;

    // when
    component.onHighValueChanged();

    // then
    expect(component.filter.selValueRange.maxExcluding).toBe(false);
  });

  it('#onHighValueChanged should keep max excluding when TIME', () => {

    // given
    const timeColumn: Column = { name: 'Time', dataType: DataType.TIME, width: 70, format: 'd MMM yyyy HH:mm:ss SSS' };
    component.filter = new TimeRangeFilter(timeColumn, 0, 100_000, { min: 0, max: 50_000, maxExcluding: true }, false);
    component.ngOnChanges();

    // when
    component.onHighValueChanged();

    // then
    expect(component.filter.selValueRange.maxExcluding).toBe(true);
  });

  it('#ngOnChanges should keep single subscription to adjusted value range', () => {

    // given
    const adjustedValueRange = new Subject<void>();
    vi.spyOn(component.filter, 'onAdjustedValueRange').mockReturnValue(adjustedValueRange);
    const emit = vi.spyOn(component.onChange, 'emit').mockReturnValue(undefined);

    // when
    component.ngOnChanges();
    component.ngOnChanges();
    adjustedValueRange.next();

    // then
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('#ngOnDestroy should unsubscribe from adjusted value range', () => {

    // given
    const adjustedValueRange = new Subject<void>();
    vi.spyOn(component.filter, 'onAdjustedValueRange').mockReturnValue(adjustedValueRange);
    const emit = vi.spyOn(component.onChange, 'emit').mockReturnValue(undefined);
    component.ngOnChanges();

    // when
    component.ngOnDestroy();
    adjustedValueRange.next();

    // then
    expect(emit).not.toHaveBeenCalled();
  });

  it('#click on "remove" button should emit remove event', fakeAsync(() => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('.but_remove_range_filter')).nativeElement;
    vi.spyOn(component.onRemove, 'emit').mockReturnValue(undefined);

    // when
    htmlButton.click();
    fixture.detectChanges();

    // then
    flush();
    expect(component.onRemove.emit).toHaveBeenCalled();
  }));

  it('#click on "reset" button should reset number range filter and emit change event', fakeAsync(() => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('.but_reset_range_filter')).nativeElement;
    vi.spyOn(component.onChange, 'emit').mockReturnValue(undefined);

    // when
    htmlButton.click();
    flush();

    // then
    const selValueRange = component.filter.selValueRange;
    expect(selValueRange.min).toBe(1);
    expect(selValueRange.max).toBe(10);
    expect(component.onChange.emit).toHaveBeenCalled();
  }));
});
