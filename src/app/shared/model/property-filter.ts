import { Operator } from './operator.enum';

export class PropertyFilter {

   static readonly EMPTY = '<empty>';

   private _propertyName: string;
   private _operator: Operator;
   private _filterValue: string | number;

   constructor(propertyName: string, operator: Operator, filterValue: string | number) {
      this._propertyName = propertyName;
      this._operator = operator;
      this._filterValue = filterValue;
   }

   get propertyName(): string {
      return this._propertyName;
   }

   set propertyName(propertyName: string) {
      this._propertyName = propertyName;
   }

   get operator(): Operator {
      return this._operator;
   }

   set operator(operator: Operator) {
      this._operator = operator;
      if (operator === Operator.NOT_EMPTY) {
         this._filterValue = '';
      }
   }

   get filterValue(): string | number {
      return this._filterValue;
   }

   set filterValue(filterValue: string | number) {
      this._filterValue = filterValue;
   }

   isApplicable(): boolean {
      if (this._operator === Operator.NOT_EMPTY) {
         return true;
      }
      return this._filterValue !== null && this._filterValue !== undefined && this._filterValue.toString().length > 0;
   }

   clearFilterValue(): void {
      this._filterValue = '';
   }

   clone(): PropertyFilter {
      return new PropertyFilter(this._propertyName, this._operator, this._filterValue);
   }
}
