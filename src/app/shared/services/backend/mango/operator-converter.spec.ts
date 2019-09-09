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
      const op: any = 'xyz';
      const operator: Operator = op;

      // when/then
      expect(() => operatorConverter.toMangoOperator(operator))
         .toThrowError('operator ' + operator + ' is not yet supported');
   });
});
