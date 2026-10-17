import { DataType } from './data-type.enum';
import { EnumLabelKeys } from './enum-label-keys';

describe('EnumLabelKeys', () => {

   it('#dataType should return the key composed of the enum member name', () => {
      expect(EnumLabelKeys.dataType(DataType.TEXT)).toBe('enum.dataType.TEXT');
   });

   it('#dataType should return the key composed of the value when it is no enum member', () => {
      expect(EnumLabelKeys.dataType('unknown' as DataType)).toBe('enum.dataType.unknown');
   });
});
