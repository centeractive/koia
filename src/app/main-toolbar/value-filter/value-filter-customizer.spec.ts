import { Operator, PropertyFilter, DataType } from 'app/shared/model';
import { ValueFilterCustomizer } from './value-filter-customizer';

describe('ValueFilterCustomizer', () => {

   const customizer = new ValueFilterCustomizer();

   it('#tooltipOf should return undefined when filter has no operator', () => {

      // given
      const filter = new PropertyFilter('x', undefined, undefined);

      // when
      const tooltip = customizer.tooltipOf(filter);

      // then
      expect(tooltip).toBeUndefined();
   });

   it('#tooltipOf should return ANY_OF tooltip with case-sensitive hint', () => {

      // given
      const filter = new PropertyFilter('x', Operator.ANY_OF, '', DataType.TEXT);

      // when
      const tooltip = customizer.tooltipOf(filter);

      // then
      expect(tooltip).toBe('Filters all items where \'x\' is equal to any of the filter values, ' +
         'separated by a semicolon \';\' each (case-sensitive)');
   });

   it('#tooltipOf should return ANY_OF tooltip without case-sensitive hint', () => {

      // given
      const filter = new PropertyFilter('x', Operator.ANY_OF, 0, DataType.NUMBER);

      // when
      const tooltip = customizer.tooltipOf(filter);

      // then
      expect(tooltip).toBe('Filters all items where \'x\' is equal to any of the filter values, separated by a semicolon \';\' each');
   });

   it('#tooltipOf should return NONE_OF tooltip with case-sensitive hint', () => {

      // given
      const filter = new PropertyFilter('x', Operator.NONE_OF, '', DataType.TEXT);

      // when
      const tooltip = customizer.tooltipOf(filter);

      // then
      expect(tooltip).toBe('Filters all items where \'x\' is equal to none of the filter values, ' +
         'separated by a semicolon \';\' each (case-sensitive)');
   });

   it('#tooltipOf should return NONE_OF tooltip without case-sensitive hint', () => {

      // given
      const filter = new PropertyFilter('x', Operator.NONE_OF, 0, DataType.NUMBER);

      // when
      const tooltip = customizer.tooltipOf(filter);

      // then
      expect(tooltip).toBe('Filters all items where \'x\' is equal to none of the filter values, separated by a semicolon \';\' each');
   });

   it('#tooltipOf should return a distinct tooltip for each operator', () => {

      // given
      const operators = Object.keys(Operator).map(key => Operator[key]);
      const tooltips: string[] = [];

      for (const op of operators) {
         const filter = new PropertyFilter('x', op, undefined);

         // when
         const tooltip = customizer.tooltipOf(filter);

         // then
         if (tooltips.includes(tooltip)) {
            fail('generates identical tooltip (operator: ' + op + ')');
         }
         expect(customizer.tooltipOf(filter)).toBeDefined();
         tooltips.push(tooltip);
      }
   });

   it('#formattedValueOf should return empty string when value is null', () => {

      // given
      const filter = new PropertyFilter('x', Operator.EQUAL, null, DataType.TEXT);

      // when
      const formattedValue = customizer.formattedValueOf(filter);

      // then
      expect(formattedValue).toBe('');
   });

   it('#formattedValueOf should return empty string when value is undefined', () => {

      // given
      const filter = new PropertyFilter('x', Operator.EQUAL, undefined, DataType.TEXT);

      // when
      const formattedValue = customizer.formattedValueOf(filter);

      // then
      expect(formattedValue).toBe('');
   });

   it('#formattedValueOf should return value as string when value is number', () => {

      // given
      const filter = new PropertyFilter('x', Operator.EQUAL, 123.55, DataType.NUMBER);

      // when
      const formattedValue = customizer.formattedValueOf(filter);

      // then
      expect(formattedValue).toBe('123.55');
   });

   it('#formattedValueOf should return unchanged value when data type is number but value is string', () => {

      // given
      const filter = new PropertyFilter('x', Operator.EQUAL, 'one', DataType.NUMBER);

      // when
      const formattedValue = customizer.formattedValueOf(filter);

      // then
      expect(formattedValue).toBe('one');
   });

   it('#formattedValueOf should return value as string with thousands separators when value is big number', () => {

      // given
      const filter = new PropertyFilter('x', Operator.EQUAL, 1234567.89, DataType.NUMBER);

      // when
      const formattedValue = customizer.formattedValueOf(filter);

      // then
      expect(formattedValue).toBe('1,234,567.89');
   });

   it('#formattedValueOf should return unchanged value if value is text', () => {

      // given
      const filter = new PropertyFilter('x', Operator.EQUAL, 'abc', DataType.TEXT);

      // when
      const formattedValue = customizer.formattedValueOf(filter);

      // then
      expect(formattedValue).toBe('abc');
   });

   it('#formattedValueOf should return unchanged value when data type is boolean', () => {

      // given
      const filter = new PropertyFilter('x', Operator.EQUAL, 'true', DataType.BOOLEAN);

      // when
      const formattedValue = customizer.formattedValueOf(filter);

      // then
      expect(formattedValue).toBe('true');
   });
});
