import { DataType, Operator, PropertyFilter } from 'app/shared/model';
import { FilterValueParser } from './filter-value-parser';

describe('FilterValueParser', () => {

   let filter: PropertyFilter;
   let parser: FilterValueParser;

   beforeEach(() => {
      filter = new PropertyFilter('x', Operator.EQUAL, '', DataType.NUMBER);
      parser = new FilterValueParser(filter);
   });

   it('#parse should return unchanged value when data type is not NUMBER', () => {

      // given
      filter.dataType = DataType.TEXT;

      // when
      const value = parser.parse('123');

      // then
      expect(value).toBe('123');
   });

   it('#parse should return number when value contains plain number', () => {

      // when
      const value = parser.parse('123');

      // then
      expect(value).toBe(123);
   });

   it('#parse should return number when value contains number with thousands separator', () => {

      // given
      const formattedNumber = (1_234.56).toLocaleString();

      // when
      const value = parser.parse(formattedNumber);

      // then
      expect(value).toBe(1_234.56);
   });

   it('#parse should return number when value contains number with misplaced thousands separators', () => {

      // given
      const ts = (1_000).toLocaleString().charAt(1);
      const wronglyFormatted = '1' + ts + '23' + ts + (4.56).toLocaleString();

      // when
      const value = parser.parse(wronglyFormatted);

      // then
      expect(value).toBe(1_234.56);
   });

   it('#parse should return unchanged value when number is invalid', () => {

      // when
      const value = parser.parse('123x');

      // then
      expect(value).toBe('123x');
   });
});
