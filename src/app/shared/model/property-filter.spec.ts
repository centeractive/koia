import { PropertyFilter } from './property-filter';
import { Operator } from './operator.enum';

describe('ElementContext', () => {

   it('#operator should empty value when operator is EMPTY', () => {

      // given
      const property = new PropertyFilter('x', Operator.EQUAL, 'abc');

      // when
      property.operator = Operator.EMPTY;

      // then
      expect(property.value).toBe('');
   });

   it('#operator should empty value when operator is NOT_EMPTY', () => {

      // given
      const property = new PropertyFilter('x', Operator.EQUAL, 'abc');

      // when
      property.operator = Operator.NOT_EMPTY;

      // then
      expect(property.value).toBe('');
   });

   it('#isEmptyValue should be true for undefined, null and empty string', () => {
      [undefined, null, ''].forEach(value => expect(PropertyFilter.isEmptyValue(value)).toBe(true));
   });

   it('#isEmptyValue should be false for zero, false and blank', () => {
      [0, false, ' '].forEach(value => expect(PropertyFilter.isEmptyValue(value)).toBe(false));
   });
});
