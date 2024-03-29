import { Column, DataType, Operator, PropertyFilter } from '../model';
import { PropertyFilterValidator } from './property-filter-validator';

describe('PropertyFilterValidator', () => {

   const columns: Column[] = [
      { name: 'Time', dataType: DataType.TIME, width: 1 },
      { name: 'Name', dataType: DataType.TEXT, width: 1 },
      { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
      { name: 'Valid', dataType: DataType.BOOLEAN, width: 1 }
   ];
   const validator = new PropertyFilterValidator(columns);

   it('#validate should return <null> when value is <undefined>', () => {
      expect(validator.validate(new PropertyFilter('Time', Operator.EMPTY, undefined))).toBeNull();
      expect(validator.validate(new PropertyFilter('Name', Operator.CONTAINS, undefined))).toBeNull();
      expect(validator.validate(new PropertyFilter('Amount', Operator.EQUAL, undefined))).toBeNull();
      expect(validator.validate(new PropertyFilter('Valid', Operator.NOT_EQUAL, undefined))).toBeNull();
   });

   it('#validate should return <null> when value is <null>', () => {
      expect(validator.validate(new PropertyFilter('Time', Operator.EMPTY, null))).toBeNull();
      expect(validator.validate(new PropertyFilter('Name', Operator.CONTAINS, null))).toBeNull();
      expect(validator.validate(new PropertyFilter('Amount', Operator.EQUAL, null))).toBeNull();
      expect(validator.validate(new PropertyFilter('Valid', Operator.NOT_EQUAL, null))).toBeNull();
   });

   it('#validate should return <null> when value is empty', () => {
      expect(validator.validate(new PropertyFilter('Time', Operator.EMPTY, ''))).toBeNull();
      expect(validator.validate(new PropertyFilter('Name', Operator.CONTAINS, ''))).toBeNull();
      expect(validator.validate(new PropertyFilter('Amount', Operator.EQUAL, ''))).toBeNull();
      expect(validator.validate(new PropertyFilter('Valid', Operator.NOT_EQUAL, ''))).toBeNull();
   });

   it('#validate should return <null> when TEXT value', () => {
      expect(validator.validate(new PropertyFilter('Name', Operator.CONTAINS, 'abc'))).toBeNull();
      expect(validator.validate(new PropertyFilter('Name', Operator.CONTAINS, '123'))).toBeNull();
   });

   it('#validate should return <null> when BOOLEAN value is valid', () => {
      expect(validator.validate(new PropertyFilter('Valid', Operator.EQUAL, 'true'))).toBeNull();
      expect(validator.validate(new PropertyFilter('Valid', Operator.CONTAINS, 'false'))).toBeNull();
      expect(validator.validate(new PropertyFilter('Valid', Operator.EQUAL, 'TRUE'))).toBeNull();
      expect(validator.validate(new PropertyFilter('Valid', Operator.CONTAINS, 'FALSE'))).toBeNull();
      expect(validator.validate(new PropertyFilter('Valid', Operator.EQUAL, '1'))).toBeNull();
      expect(validator.validate(new PropertyFilter('Valid', Operator.CONTAINS, '0'))).toBeNull();
   });

   it('#validate should return <null> when NUMBER value is valid', () => {
      expect(validator.validate(new PropertyFilter('Amount', Operator.GREATER_THAN, '123'))).toBeNull();
      const formattedNumber = Number(1234567.89).toLocaleString();
      expect(validator.validate(new PropertyFilter('Amount', Operator.LESS_THAN, formattedNumber))).toBeNull();
   });

   it('#validate should return error message when NUMBER value is invalid', () => {
      expect(validator.validate(new PropertyFilter('Amount', Operator.EQUAL, 'x'))).toBe('Invalid number');
      expect(validator.validate(new PropertyFilter('Amount', Operator.NOT_EQUAL, 'y'))).toBe('Invalid number');
   });

   it('#validate should return error message when BOOLEAN value is invalid', () => {
      expect(validator.validate(new PropertyFilter('Valid', Operator.EQUAL, 'abc'))).toBe('Invalid boolean');
      expect(validator.validate(new PropertyFilter('Valid', Operator.NOT_EQUAL, '123'))).toBe('Invalid boolean');
   });

   it('#validate with "is any of" should return <null> when all NUMBERs are valid', () => {
      expect(validator.validate(new PropertyFilter('Amount', Operator.ANY_OF, '1;2;3'))).toBeNull();

      const listOfFloats = [1.5, 2.7, 3.78].map(f => f.toLocaleString()).join(';');
      expect(validator.validate(new PropertyFilter('Amount', Operator.ANY_OF, listOfFloats))).toBeNull();
   });

   it('#validate with "is any of" should return error message when any NUMBER is invalid', () => {
      expect(validator.validate(new PropertyFilter('Amount', Operator.ANY_OF, 'x;2;3'))).toBe('\'x\' is not a number');
      expect(validator.validate(new PropertyFilter('Amount', Operator.ANY_OF, '1;y;3'))).toBe('\'y\' is not a number');
      expect(validator.validate(new PropertyFilter('Amount', Operator.ANY_OF, '1;2;z'))).toBe('\'z\' is not a number');
   });

   it('#validate with "is none of" should return <null> when all NUMBERs are valid', () => {
      expect(validator.validate(new PropertyFilter('Amount', Operator.NONE_OF, '1;2;3'))).toBeNull();

      const listOfFloats = [1.5, 2.7, 3.78].map(f => f.toLocaleString()).join(';');
      expect(validator.validate(new PropertyFilter('Amount', Operator.NONE_OF, listOfFloats))).toBeNull();
   });

   it('#validate with "is none of" should return error message when any NUMBER is invalid', () => {
      expect(validator.validate(new PropertyFilter('Amount', Operator.NONE_OF, 'x;2;3'))).toBe('\'x\' is not a number');
      expect(validator.validate(new PropertyFilter('Amount', Operator.NONE_OF, '1;y;3'))).toBe('\'y\' is not a number');
      expect(validator.validate(new PropertyFilter('Amount', Operator.NONE_OF, '1;2;z'))).toBe('\'z\' is not a number');
   });
});
