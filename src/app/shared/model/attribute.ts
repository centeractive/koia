import { DataType } from './data-type.enum';

export class Attribute<T = unknown> {

   private _name: string;
   private _description: string;
   private _dataType: DataType;
   private _value: T;
   private _valueChoice: T[];

   /**
    * @param wide rendered wider, for long values such as patterns
    */
   constructor(name: string, description: string, dataType: DataType, value: T, readonly wide = false) {
      this._name = name;
      this._description = description;
      this._dataType = dataType;
      this._value = value;
   }

   get name(): string {
      return this._name;
   }

   get description(): string {
      return this._description;
   }

   get dataType(): DataType {
      return this._dataType;
   }

   isBoolean(): boolean {
      return this._dataType === DataType.BOOLEAN;
   }

   isNumber(): boolean {
      return this._dataType === DataType.NUMBER;
   }

   get value(): T {
      return this._value;
   }

   set value(value: T) {
      this._value = value;
   }

   get valueChoice(): T[] {
      return this._valueChoice;
   }

   set valueChoice(valueChoice: T[]) {
      this._valueChoice = valueChoice;
   }

   hasValueChoice(): boolean {
      return !!this._valueChoice && this._valueChoice.length > 0;
   }
}
