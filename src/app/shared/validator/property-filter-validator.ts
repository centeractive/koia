import { Column, PropertyFilter } from '../model';
import { DataTypeUtils } from '../utils';

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
         if (DataTypeUtils.toTypedValue(value, dataType) === undefined) {
            return 'Invalid ' + dataType.toString().toLowerCase();
         }
      }
      return null;
   }
}
