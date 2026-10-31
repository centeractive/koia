import { PropertyFilter } from './property-filter';
import { Operator } from './operator.enum';
import { DataType } from './data-type.enum';

describe('PropertyFilter', () => {

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

   it.each([
      [Operator.NONE_OF, true],
      [Operator.NOT_EQUAL, true],
      [Operator.ANY_OF, false],
      [Operator.EMPTY, false]
   ])('#orEmpty of filter constructed to match empty values should be true only when operator %s excludes values: %s', (operator, expected) => {

      // given
      const filter = new PropertyFilter('x', Operator.NONE_OF, 'a', DataType.TEXT, true);

      // when
      filter.operator = operator;

      // then
      expect(filter.orEmpty).toBe(expected);
   });

   it('#clone should match empty values again when operator excludes values again', () => {

      // given
      const filter = new PropertyFilter('x', Operator.NONE_OF, 'a', DataType.TEXT, true);
      filter.operator = Operator.ANY_OF;

      // when
      const clone = filter.clone();
      clone.operator = Operator.NOT_EQUAL;

      // then
      expect(clone.orEmpty).toBe(true);
   });
});
