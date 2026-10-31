import { Operator } from 'app/shared/model';
import { OperatorConverter } from './operator-converter';

describe('OperatorConverter', () => {

   const operatorConverter = new OperatorConverter();

   it('#toMangoOperator should return mango operator for each operator', () => {

      // given
      const allOperators = Object.keys(Operator).map(key => Operator[key]);

      for (const operator of allOperators) {

         // when
         const mangoOperator = operatorConverter.toMangoOperator(operator);

         // then
         expect(mangoOperator).toBeDefined();
      }
   });

   it('#toMangoOperator should throw error when operator is unknown', () => {

      // given
      const operator = 'xyz' as unknown as Operator;

      // when
      const conversion = () => operatorConverter.toMangoOperator(operator);

      // then
      expect(conversion).toThrow(expect.objectContaining({ message: 'operator ' + operator + ' is not yet supported' }));
   });

   it('#toPouchDBMangoOperator should return $exists for NOT_EMPTY', () => {

      // when
      const mangoOperator = operatorConverter.toPouchDBMangoOperator(Operator.NOT_EMPTY);

      // then
      expect(mangoOperator).toBe('$exists');
   });

   it('#toPouchDBMangoOperator should return $nin for NOT_EQUAL', () => {

      // when
      const mangoOperator = operatorConverter.toPouchDBMangoOperator(Operator.NOT_EQUAL);

      // then
      expect(mangoOperator).toBe('$nin');
   });

   it('#toPouchDBMangoOperator should return mango operator of other operators', () => {

      // given
      const otherOperators = Object.values(Operator).filter(o => o !== Operator.NOT_EMPTY && o !== Operator.NOT_EQUAL);

      for (const operator of otherOperators) {

         // when
         const mangoOperator = operatorConverter.toPouchDBMangoOperator(operator);

         // then
         expect(mangoOperator).toBe(operatorConverter.toMangoOperator(operator));
      }
   });
});
