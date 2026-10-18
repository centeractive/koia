import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NumberUtils } from 'app/shared/utils';
import { ValueGrouping } from 'app/shared/value-range/model/value-grouping.type';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { ValueGroupingRangesComponent } from './value-grouping-ranges.component';

describe('ValueGroupingRangesComponent', () => {

  let grouping: ValueGrouping;
  let component: ValueGroupingRangesComponent;
  let fixture: ComponentFixture<ValueGroupingRangesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ValueGroupingRangesComponent],
      imports: [FormsModule, DragDropModule, MatCheckboxModule, MatInputModule, MatTooltipModule, MatButtonModule, MatIconModule]
    });
    grouping = {
      columnName: 'Amount',
      minMaxValues: { min: 1234.5, max: 98765 },
      ranges: [{ max: 10, active: true }, { max: 20, active: true }, { max: 30, active: false }]
    };
    fixture = TestBed.createComponent(ValueGroupingRangesComponent);
    component = fixture.componentInstance;
    component.grouping = grouping;
    fixture.detectChanges();
    vi.spyOn(component.rangesChange, 'emit');
  });

  it('#addRange should add active range rounded up from minimum and emit ranges change', () => {

    // when
    component.addRange();

    // then
    expect(grouping.ranges.length).toBe(4);
    expect(grouping.ranges[3]).toEqual({ max: 2000, active: true });
    expect(component.rangesChange.emit).toHaveBeenCalled();
  });

  it('#removeRange should remove range and emit ranges change', () => {

    // given
    const range = grouping.ranges[1];

    // when
    component.removeRange(range);

    // then
    expect(grouping.ranges.map(r => r.max)).toEqual([10, 30]);
    expect(component.rangesChange.emit).toHaveBeenCalled();
  });

  it('#dropRange should move range without emitting ranges change', () => {

    // given
    const [first, second] = grouping.ranges;
    const event = { previousIndex: 0, currentIndex: 1 } as CdkDragDrop<ValueRange[]>;

    // when
    component.dropRange(event);

    // then
    expect(grouping.ranges[0]).toBe(second);
    expect(grouping.ranges[1]).toBe(first);
    expect(component.rangesChange.emit).not.toHaveBeenCalled();
  });

  it('#onActiveChanged should set active state and emit ranges change', () => {

    // given
    const range = grouping.ranges[2];

    // when
    component.onActiveChanged(range, true);

    // then
    expect(range.active).toBe(true);
    expect(component.rangesChange.emit).toHaveBeenCalled();
  });

  it('should emit ranges change when range max is edited', () => {

    // given
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type=number]');

    // when
    input.value = '15';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));

    // then
    expect(grouping.ranges[0].max).toBe(15);
    expect(component.rangesChange.emit).toHaveBeenCalled();
  });

  it('should hide remove icon when grouping has single range', () => {

    // given
    grouping.ranges = [{ max: 10, active: true }];

    // when
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelectorAll('.icon_remove').length).toBe(0);
  });

  it('should show localized min and max values', () => {

    // when
    const labels = Array.from<HTMLLabelElement>(fixture.nativeElement.querySelectorAll('label'));

    // then
    const texts = labels.map(l => l.textContent.trim());
    expect(texts[0]).toBe('max. 98,765');
    expect(texts[texts.length - 1]).toBe('min. 1,234.5');
  });

  it('#isNumberKey should return value obtained from NumberUtils#isNumberKey', () => {

    // given
    vi.spyOn(NumberUtils, 'isNumberKey').mockReturnValue(false);
    const event = new KeyboardEvent('keypress', { key: 'a' });

    // when
    const result = component.isNumberKey(event);

    // then
    expect(result).toBe(false);
    expect(NumberUtils.isNumberKey).toHaveBeenCalledWith(event);
  });
});
