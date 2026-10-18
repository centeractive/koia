import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ArrayUtils, NumberUtils } from 'app/shared/utils';
import { ValueGrouping } from 'app/shared/value-range/model/value-grouping.type';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';

@Component({
  selector: 'koia-value-grouping-ranges',
  templateUrl: './value-grouping-ranges.component.html',
  styleUrls: ['./value-grouping-ranges.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ValueGroupingRangesComponent {

  @Input() grouping: ValueGrouping;
  @Output() rangesChange = new EventEmitter<void>();

  addRange(): void {
    const max = NumberUtils.roundUpBroad(this.grouping.minMaxValues.min);
    this.grouping.ranges.push({ max, active: true });
    this.rangesChange.emit();
  }

  removeRange(range: ValueRange): void {
    ArrayUtils.removeElement(this.grouping.ranges, range);
    this.rangesChange.emit();
  }

  dropRange(event: CdkDragDrop<ValueRange[]>): void {
    ArrayUtils.move(this.grouping.ranges, event.previousIndex, event.currentIndex);
  }

  onActiveChanged(range: ValueRange, active: boolean): void {
    range.active = active;
    this.rangesChange.emit();
  }

  isNumberKey(event: KeyboardEvent): boolean {
    return NumberUtils.isNumberKey(event);
  }
}
