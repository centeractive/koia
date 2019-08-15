import { Operator } from './operator.enum';
import { DataType } from './data-type.enum';

export class PropertyFilter {

   static readonly EMPTY = '<empty>';

   private _propertyName: string;
   private _operator: Operator;
   private _filterValue: string | number;
   private _dataType?: DataType;

   constructor(propertyName: string, operator: Operator, filterValue: string | number, dataType?: DataType) {
      this._propertyName = propertyName;
      this._operator = operator;
      this._filterValue = filterValue;
      this._dataType = dataType;
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

   get dataType(): DataType {
      return this._dataType;
   }

   set dataType(dataType: DataType) {
      this._dataType = dataType;
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
      return new PropertyFilter(this._propertyName, this._operator, this._filterValue, this._dataType);
   }
}
