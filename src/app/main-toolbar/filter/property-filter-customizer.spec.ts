import { Operator, PropertyFilter, DataType } from 'app/shared/model';
import { PropertyFilterCustomizer } from './property-filter-customizer';

describe('PropertyFilterCustomizer', () => {

   const customizer = new PropertyFilterCustomizer();

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
         'separated by a comma each (case-sensitive)');
   });

   it('#tooltipOf should return ANY_OF tooltip without case-sensitive hint', () => {

      // given
      const filter = new PropertyFilter('x', Operator.ANY_OF, 0, DataType.NUMBER);

      // when
      const tooltip = customizer.tooltipOf(filter);

      // then
      expect(tooltip).toBe('Filters all items where \'x\' is equal to any of the filter values, separated by a comma each');
   });

   it('#tooltipOf should return NONE_OF tooltip with case-sensitive hint', () => {

      // given
      const filter = new PropertyFilter('x', Operator.NONE_OF, '', DataType.TEXT);

      // when
      const tooltip = customizer.tooltipOf(filter);

      // then
      expect(tooltip).toBe('Filters all items where \'x\' is equal to none of the filter values, ' +
         'separated by a comma each (case-sensitive)');
   });

   it('#tooltipOf should return NONE_OF tooltip without case-sensitive hint', () => {

      // given
      const filter = new PropertyFilter('x', Operator.NONE_OF, 0, DataType.NUMBER);

      // when
      const tooltip = customizer.tooltipOf(filter);

      // then
      expect(tooltip).toBe('Filters all items where \'x\' is equal to none of the filter values, separated by a comma each');
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
});
