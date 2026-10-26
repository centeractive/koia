import { Column, ComputeOperator, DataType } from '../model';
import {
   containsAnyNumber, filterableColumnsOf, iconOfColumn, isAnalyzableColumn, isComputedColumn, isOperandColumn, isPatternColumn,
   patternColumnName, storedColumnsOf
} from './column-utils';

describe('column-utils', () => {

   const number: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
   const text: Column = { name: 'Name', dataType: DataType.TEXT, width: 10 };
   const indexedNumber: Column = { name: 'Price', dataType: DataType.NUMBER, width: 10, indexed: true };
   const indexedText: Column = { name: 'City', dataType: DataType.TEXT, width: 10, indexed: true };
   const computed: Column = {
      name: 'Share', dataType: DataType.NUMBER, width: 10, indexed: false,
      computation: { leftColumn: 'Amount', operator: ComputeOperator.PERCENTAGE, rightColumn: 'Price' }
   };

   it('#containsAnyNumber should return false when columns are undefined', () => {
      expect(containsAnyNumber(undefined)).toBe(false);
   });

   it('#containsAnyNumber should return false when columns are empty', () => {
      expect(containsAnyNumber([])).toBe(false);
   });

   it('#containsAnyNumber should return true when single NUMBER column is provided', () => {
      expect(containsAnyNumber([number])).toBe(true);
   });

   it('#containsAnyNumber should return true when NUMBER and TEXT columns are provided', () => {
      expect(containsAnyNumber([number, text])).toBe(true);
   });

   it('#containsAnyNumber should return false when single TEXT column is provided', () => {
      expect(containsAnyNumber([text])).toBe(false);
   });

   it('#isComputedColumn should return true for computed column', () => {
      expect(isComputedColumn(computed)).toBe(true);
   });

   it('#isComputedColumn should return false for stored column', () => {
      expect(isComputedColumn(indexedNumber)).toBe(false);
   });

   it('#isAnalyzableColumn should return true for indexed column', () => {
      expect(isAnalyzableColumn(indexedText)).toBe(true);
   });

   it('#isAnalyzableColumn should return true for computed column', () => {
      expect(isAnalyzableColumn(computed)).toBe(true);
   });

   it('#isAnalyzableColumn should return false for non-indexed stored column', () => {
      expect(isAnalyzableColumn(number)).toBe(false);
   });

   it('#storedColumnsOf should return columns that are not computed', () => {
      expect(storedColumnsOf([number, computed, text])).toEqual([number, text]);
   });

   it('#filterableColumnsOf should return columns that are not computed', () => {
      expect(filterableColumnsOf([computed, indexedText])).toEqual([indexedText]);
   });

   it('#isOperandColumn should return true for indexed NUMBER column', () => {
      expect(isOperandColumn(indexedNumber)).toBe(true);
   });

   it('#isOperandColumn should return false for non-indexed NUMBER column', () => {
      expect(isOperandColumn(number)).toBe(false);
   });

   it('#isOperandColumn should return false for indexed TEXT column', () => {
      expect(isOperandColumn(indexedText)).toBe(false);
   });

   it('#isOperandColumn should return false for computed column', () => {

      // given
      const column: Column = { ...computed, indexed: true };

      // when
      const operand = isOperandColumn(column);

      // then
      expect(operand).toBe(false);
   });

   it('#iconOfColumn should return functions icon for computed column', () => {
      expect(iconOfColumn(computed)).toBe('functions');
   });

   it('#iconOfColumn should return data type icon for stored column', () => {
      expect(iconOfColumn(text)).toBe('title');
   });

   it('#isPatternColumn should return true for pattern column only', () => {
      expect(isPatternColumn({ ...indexedText, patternOf: 'Message' })).toBe(true);
      expect(isPatternColumn(indexedText)).toBe(false);
   });

   it('#patternColumnName should append suffix', () => {
      expect(patternColumnName('Message', new Set(['Message']), 'pattern')).toBe('Message pattern');
   });

   it('#patternColumnName should number name in use', () => {
      expect(patternColumnName('Message', new Set(['Message pattern', 'Message pattern (2)']), 'pattern')).toBe('Message pattern (3)');
   });

   it('#patternColumnName should cut long base to maximum column name length', () => {

      // given
      const base = 'x'.repeat(100);

      // when
      const name = patternColumnName(base, new Set(), 'pattern');

      // then
      expect(name).toBe('x'.repeat(92) + ' pattern');
   });

   it('#patternColumnName should cut long base to maximum column name length when numbered', () => {

      // given
      const base = 'x'.repeat(100);

      // when
      const name = patternColumnName(base, new Set(['x'.repeat(92) + ' pattern']), 'pattern');

      // then
      expect(name).toBe('x'.repeat(88) + ' pattern (2)');
      expect(name.length).toBe(100);
   });
});
