import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { ChangeContext } from 'app/ngx-slider/change-context';
import { ValueRange } from 'app/shared/value-range/model';
import { Subscription } from 'rxjs';
import { NumberRangeFilter } from './model/number-range-filter';

@Component({
  selector: 'koia-range-filter',
  templateUrl: './range-filter.component.html',
  styleUrls: ['./range-filter.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class RangeFilterComponent implements OnChanges, OnDestroy {

  @Input() filter: NumberRangeFilter;
  @Output() onChange = new EventEmitter<void>();
  @Output() onRemove = new EventEmitter<void>();

  valueRange: ValueRange;

  private subscription: Subscription;

  ngOnChanges(changes: SimpleChanges): void {
    this.unsubscribeSubscription();
    this.filter.onAdjustedValueRange().subscribe(() => this.onChange.emit());
    this.valueRange = this.filter.sliderValueRange;
  }

  onChanged(changeContext: ChangeContext): void {
    this.valueRange.min = changeContext.value;
    this.valueRange.max = changeContext.highValue;
    this.onChange.emit();
  }

  onInvertedChanged(inverted: boolean): void {
    this.filter.inverted = inverted;
    this.onChange.emit();
  }

  reset(): void {
    this.filter.reset();
    setTimeout(() => this.onChange.emit(), 500); // let slider properly reset itself
  }

  ngOnDestroy(): void {
    this.unsubscribeSubscription();
  }

  private unsubscribeSubscription(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
