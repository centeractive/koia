import { ComponentFixture, TestBed, fakeAsync, flush, waitForAsync } from '@angular/core/testing';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By, HAMMER_LOADER } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { Column, DataType } from 'app/shared/model';
import { NumberRangeFilter } from './model/number-range-filter';
import { RangeFilterComponent } from './range-filter.component';

describe('RangeFilterComponent', () => {

  const amountColumn: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 70 };

  let component: RangeFilterComponent;
  let fixture: ComponentFixture<RangeFilterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RangeFilterComponent],
      imports: [
        MatButtonModule, MatIconModule, MatBadgeModule, MatTooltipModule, MatMenuModule, NgxSliderModule, BrowserAnimationsModule
      ],
      providers: [
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => null) }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RangeFilterComponent);
    component = fixture.componentInstance;
    component.filter = new NumberRangeFilter(amountColumn, 1, 10, { min: 2, max: 5 }, false);
    component.ngOnChanges(null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#onChanged should refresh update number range filter and emit change event', fakeAsync(() => {

    // given
    spyOn(component.onChange, 'emit');

    // when
    component.onChanged({ value: 3, highValue: 7, pointerType: undefined });

    // then
    expect(component.filter.selValueRange.min).toBe(3);
    expect(component.filter.selValueRange.max).toBe(7);
    expect(component.onChange.emit).toHaveBeenCalled();
  }));

  it('#onInvertedChanged should update number range filter and emit change event', fakeAsync(() => {

    // given
    spyOn(component.onChange, 'emit');

    // when
    component.onInvertedChanged(true);

    // then
    expect(component.filter.inverted).toBeTrue();
    expect(component.onChange.emit).toHaveBeenCalled();
  }));

  it('#click on "remove" button should emit remove event', fakeAsync(() => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('.but_remove_range_filter')).nativeElement;
    spyOn(component.onRemove, 'emit');

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
    spyOn(component.onChange, 'emit');

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
