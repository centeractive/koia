import { Column, PropertyFilter, Operator, DataType } from '../model';
import { DataTypeUtils, ArrayUtils } from '../utils';

export class PropertyFilterValidator {

   constructor(private columns: Column[]) { }

   /**
    * @returns a validation error message or [[null]] if the property filter is valid
    * (filters with missing or empty value are considered to be valid)
    */
   validate(filter: PropertyFilter): string | null {
      const value = filter.value;
      if (value && value.toString() !== '') {
         const dataType = this.columns.find(c => c.name === filter.name).dataType;
         if (filter.operator === Operator.ANY_OF || filter.operator === Operator.NONE_OF) {
            return this.validateListedValues(dataType, value.toString());
         } else if (DataTypeUtils.toTypedValue(value, dataType) === undefined) {
            return 'Invalid ' + dataType.toString().toLowerCase();
         }
      }
      return null;
   }

   private validateListedValues(dataType: DataType, value: string): string | null {
      try {
         if (dataType === DataType.NUMBER) {
            ArrayUtils.toNumberArray(value.toString());
         }
         return null;
      } catch (e) {
         return e.message;
      }
   }
}
