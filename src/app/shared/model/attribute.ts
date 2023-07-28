import { DataType } from './data-type.enum';

export class Attribute {

   private _name: string;
   private _description: string;
   private _dataType: DataType;
   private _value: any;
   private _valueChoice: any[];
   private _valueChoiceBinding: boolean;

   constructor(name: string, description: string, dataType: DataType, value: any) {
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

   get value(): any {
      return this._value;
   }

   set value(value: any) {
      this._value = value;
   }

   get valueChoice(): any[] {
      return this._valueChoice;
   }

   set valueChoice(valueChoice: any[]) {
      this._valueChoice = valueChoice;
   }

   hasValueChoice(): boolean {
      return !!this._valueChoice && this._valueChoice.length > 0;
   }

   get isValueChoiceBinding(): boolean {
      return this._valueChoiceBinding;
   }

   set valueChoiceBinding(valueChoiceBinding: boolean) {
      this._valueChoiceBinding = valueChoiceBinding;
   }
}
