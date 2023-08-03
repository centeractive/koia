import { TimeUnit } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';
import { ValueRange } from 'app/shared/value-range/model';

export class SliderTimeValueRange implements ValueRange {

    constructor(private start: number, private end: number, private valueRange: ValueRange, private selectedStep: () => TimeUnit) { }

    get min(): number {
        if (this.valueRange.min <= this.start) {
            return 0;
        } else {
            return DateTimeUtils.diff(this.startOfStart(), this.valueRange.min, this.selectedStep());
        }
    }

    set min(min: number) {
        if (min) {
            this.valueRange.min = DateTimeUtils.add(this.startOfStart(), this.selectedStep(), min);
            if (this.valueRange.min < this.start) {
                this.valueRange.min = this.start;
            }
        } else {
            this.valueRange.min = this.start;
        }
    }

    get max(): number {
        return Math.ceil(DateTimeUtils.diff(this.startOfStart(), this.valueRange.max, this.selectedStep()));
    }

    set max(max: number) {
        if (max) {
            this.valueRange.max = DateTimeUtils.add(this.startOfStart(), this.selectedStep(), max);
            if (this.valueRange.max > this.end) {
                this.valueRange.max = this.end;
            }
        } else {
            this.valueRange.max = this.start;
        }
    }

    set maxExcluding(maxExcluding: boolean) {
        this.valueRange.maxExcluding = maxExcluding;
    }

    private startOfStart(): number {
        return DateTimeUtils.startOf(this.start, this.selectedStep());
    }
}