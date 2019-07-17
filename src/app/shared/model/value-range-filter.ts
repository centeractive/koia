import { ValueRange } from './value-range.type';
import { PropertyFilter } from './property-filter';
import { Operator } from './operator.enum';

export class ValueRangeFilter  {

   protected _propertyName: string;
   private _valueRange: ValueRange

   constructor(propertyName: string, valueRange: ValueRange) {
      this._propertyName = propertyName;
      this._valueRange = valueRange;
   }

   get propertyName(): string {
      return this._propertyName;
   }

   set propertyName(propertyName: string) {
      this._propertyName = propertyName;
   }

   get valueRange(): ValueRange {
      return this._valueRange;
   }

   set valueRange(valueRange: ValueRange) {
      this._valueRange = valueRange;
   }

   isApplicable(): boolean {
      return (this._valueRange.min !== null && this._valueRange.min !== undefined) ||
         (this._valueRange.max !== null && this._valueRange.max !== undefined);
   }

   clearFilterValue(): void {
      this._valueRange.min = undefined;
      this._valueRange.max = undefined;
   }

   toPropertyFilters(): PropertyFilter[] {
      const propertyFilters: PropertyFilter[] = [];
      if (this._valueRange.min !== null && this._valueRange.min !== undefined) {
         propertyFilters.push(new PropertyFilter(this._propertyName, Operator.GREATER_THAN_OR_EQUAL, this._valueRange.min));
      }
      if (this._valueRange.max !== null && this._valueRange.max !== undefined) {
         propertyFilters.push(new PropertyFilter(this._propertyName, Operator.LESS_THAN_OR_EQUAL, this._valueRange.max));
      }
      return propertyFilters;
   }

   clone(): ValueRangeFilter {
      return new ValueRangeFilter(this._propertyName, { min: this._valueRange.min, max: this._valueRange.max });
   }
}
