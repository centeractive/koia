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
});
