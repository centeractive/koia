import { ValueFilterUtils } from './value-filter-utils';
import { DataType, Operator } from 'app/shared/model';

describe('ValueFilterUtils', () => {

   it('#defaultOperatorOf should return EQUAL operator for BOOLEAN', () => {

      // when
      const operator = ValueFilterUtils.defaultOperatorOf(DataType.BOOLEAN);

      // then
      expect(operator).toBe(Operator.EQUAL);
   });

   it('#defaultOperatorOf should return EQUAL operator for NUMBER', () => {

      // when
      const operator = ValueFilterUtils.defaultOperatorOf(DataType.NUMBER);

      // then
      expect(operator).toBe(Operator.EQUAL);
   });

   it('#defaultOperatorOf should return CONTAINS operator for OBJECT', () => {

      // when
      const operator = ValueFilterUtils.defaultOperatorOf(DataType.OBJECT);

      // then
      expect(operator).toBe(Operator.CONTAINS);
   });

   it('#defaultOperatorOf should return EQUAL operator for TEXT', () => {

      // when
      const operator = ValueFilterUtils.defaultOperatorOf(DataType.TEXT);

      // then
      expect(operator).toBe(Operator.EQUAL);
   });

   it('#defaultOperatorOf should return NOT_EMPTY operator for TIME', () => {

      // when
      const operator = ValueFilterUtils.defaultOperatorOf(DataType.TIME);

      // then
      expect(operator).toBe(Operator.NOT_EMPTY);
   });
});
