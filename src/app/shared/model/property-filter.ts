import { Operator } from './operator.enum';
import { DataType } from './data-type.enum';

export class PropertyFilter {

   static readonly EMPTY_VALUE = '<empty>';

   private _name: string;
   private _operator: Operator;
   private _value: string | number | boolean;
   private _dataType?: DataType;

   constructor(name: string, operator: Operator, filterValue: string | number | boolean, dataType?: DataType) {
      this._name = name;
      this._operator = operator;
      this._value = filterValue;
      this._dataType = dataType;
   }

   get name(): string {
      return this._name;
   }

   set name(name: string) {
      this._name = name;
   }

   get operator(): Operator {
      return this._operator;
   }

   set operator(operator: Operator) {
      this._operator = operator;
      if (operator === Operator.EMPTY || operator === Operator.NOT_EMPTY) {
         this._value = '';
      }
   }

   get value(): string | number | boolean {
      return this._value;
   }

   set value(filterValue: string | number | boolean) {
      this._value = filterValue;
   }

   get dataType(): DataType {
      return this._dataType;
   }

   set dataType(dataType: DataType) {
      this._dataType = dataType;
   }

   isApplicable(): boolean {
      if (this._operator === Operator.EMPTY || this._operator === Operator.NOT_EMPTY) {
         return true;
      }
      return this._value !== null && this._value !== undefined && this._value.toString().length > 0;
   }

   clearFilterValue(): void {
      this._value = '';
   }

   clone(): PropertyFilter {
      return new PropertyFilter(this._name, this._operator, this._value, this._dataType);
   }
}
