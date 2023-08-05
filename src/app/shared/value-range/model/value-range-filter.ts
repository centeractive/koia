import { Operator } from '../../model/operator.enum';
import { PropertyFilter } from '../../model/property-filter';
import { ValueRange } from './value-range.type';

export class ValueRangeFilter {

   protected _name: string;
   private _valueRange: ValueRange;
   private _inverted: boolean;

   constructor(name: string, valueRange: ValueRange, inverted?: boolean) {
      this._name = name;
      this._valueRange = valueRange;
      this._inverted = inverted == undefined ? false : inverted;
   }

   get name(): string {
      return this._name;
   }

   set name(name: string) {
      this._name = name;
   }

   get valueRange(): ValueRange {
      return this._valueRange;
   }

   set valueRange(valueRange: ValueRange) {
      this._valueRange = valueRange;
   }

   get inverted(): boolean {
      return this._inverted;
   }

   isApplicable(): boolean {
      return this._inverted || this.isMinDefined() || this.isMaxDefined();
   }

   clearFilterValue(): void {
      this._valueRange.min = undefined;
      this._valueRange.max = undefined;
   }

   /**
    * @returns zero, one or two property filters. If two property filters are returned:
    * - they need to be combined with logical AND if this value range filter is not inverted
    * - they need to be combined with logical OR if this value range filter is inverted
    */
   toPropertyFilters(): PropertyFilter[] {
      const propertyFilters: PropertyFilter[] = [];
      if (this.isMinDefined()) {
         const operator = this._inverted ? Operator.LESS_THAN : Operator.GREATER_THAN_OR_EQUAL;
         propertyFilters.push(new PropertyFilter(this._name, operator, this._valueRange.min));
      }
      if (this.isMaxDefined()) {
         propertyFilters.push(new PropertyFilter(this._name, this.rangeMaxOperator(), this._valueRange.max));
      }
      return propertyFilters;
   }

   private isMinDefined(): boolean {
      return this._valueRange.min !== null && this._valueRange.min !== undefined;
   }

   private isMaxDefined(): boolean {
      return this._valueRange.max !== null && this._valueRange.max !== undefined;
   }

   private rangeMaxOperator(): Operator {
      if (this._inverted) {
         return this._valueRange.maxExcluding ? Operator.GREATER_THAN_OR_EQUAL : Operator.GREATER_THAN;
      } else {
         return this._valueRange.maxExcluding ? Operator.LESS_THAN : Operator.LESS_THAN_OR_EQUAL;
      }
   }

   clone(): ValueRangeFilter {
      const valueRange: ValueRange = {
         min: this._valueRange.min,
         max: this._valueRange.max,
         maxExcluding: this._valueRange.maxExcluding
      };
      return new ValueRangeFilter(this._name, valueRange, this._inverted);
   }
}
