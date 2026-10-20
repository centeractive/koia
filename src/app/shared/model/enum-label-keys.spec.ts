import { ComputeOperator } from './compute-operator.enum';
import { DataType } from './data-type.enum';
import { EnumLabelKeys } from './enum-label-keys';
import { TimeUnit } from './time-unit.enum';

describe('EnumLabelKeys', () => {

   it('#dataType should return the key composed of the enum member name', () => {
      expect(EnumLabelKeys.dataType(DataType.TEXT)).toBe('enum.dataType.TEXT');
   });

   it('#dataType should return the key composed of the value when it is no enum member', () => {
      expect(EnumLabelKeys.dataType('unknown' as DataType)).toBe('enum.dataType.unknown');
   });

   it('#groupingTimeUnit should return per key of time unit', () => {

      // when
      const key = EnumLabelKeys.groupingTimeUnit(TimeUnit.DAY);

      // then
      expect(key).toBe('ui.per.day');
   });

   it('#computeOperator should return the key composed of the enum member name', () => {
      expect(EnumLabelKeys.computeOperator(ComputeOperator.PERCENTAGE)).toBe('enum.computeOperator.PERCENTAGE');
   });

   it('#computeOperatorFormula should return the formula key composed of the enum member name', () => {
      expect(EnumLabelKeys.computeOperatorFormula(ComputeOperator.DIVIDE)).toBe('computedColumn.formula.DIVIDE');
   });
});
