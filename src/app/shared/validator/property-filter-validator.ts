import { Column, PropertyFilter, Operator, DataType, EnumLabels } from '../model';
import { LanguageService } from '../services/language/language.service';
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
         } else if (DataTypeUtils.toTypedValue(value, dataType, undefined) === undefined) {
            return LanguageService.instant('filter.invalidValue', { type: EnumLabels.dataType(dataType) });
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
