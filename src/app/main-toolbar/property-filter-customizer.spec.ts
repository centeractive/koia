import { Operator, PropertyFilter } from 'app/shared/model';
import { PropertyFilterCustomizer } from './property-filter-customizer';

describe('PropertyFilterCustomizer', () => {

   const customizer = new PropertyFilterCustomizer();

   it('#tooltipOf should return undefined when filter has no operator', () => {

      // given
      const filter = new PropertyFilter('x', undefined, undefined);

      // when
      const tooltip = customizer.tooltipOf(filter);

      // then
      expect(customizer.tooltipOf(filter)).toBeUndefined();
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
