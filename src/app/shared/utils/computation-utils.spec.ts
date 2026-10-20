import { TestBed } from '@angular/core/testing';
import { LanguageService } from 'app/shared/services/language';
import { Column, Computation, ComputeOperator, DataType } from '../model';
import { computedColumnTooltipOf, computeValue, formulaOf, withComputedValues } from './computation-utils';

describe('computation-utils', () => {

   const share: Column = {
      name: 'Share', dataType: DataType.NUMBER, width: 10, indexed: false,
      computation: { leftColumn: 'a', operator: ComputeOperator.PERCENTAGE, rightColumn: 'b' }
   };
   const amount: Column = { name: 'a', dataType: DataType.NUMBER, width: 10, indexed: true };

   function computation(operator: ComputeOperator): Computation {
      return { leftColumn: 'a', operator, rightColumn: 'b' };
   }

   afterEach(() => document.documentElement.lang = 'en');

   it.each([
      [ComputeOperator.ADD, 8],
      [ComputeOperator.SUBTRACT, 4],
      [ComputeOperator.MULTIPLY, 12],
      [ComputeOperator.DIVIDE, 3],
      [ComputeOperator.PERCENTAGE, 300]
   ])('#computeValue should compute %s', (operator, expected) => {
      expect(computeValue(computation(operator), { a: 6, b: 2 })).toBe(expected);
   });

   it('#computeValue should round percentage to 2 decimals', () => {
      expect(computeValue(computation(ComputeOperator.PERCENTAGE), { a: 1, b: 3 })).toBe(33.33);
   });

   it('#computeValue should round division to 4 decimals', () => {
      expect(computeValue(computation(ComputeOperator.DIVIDE), { a: 2, b: 3 })).toBe(0.6667);
   });

   it('#computeValue should round addition to 15 significant digits', () => {
      expect(computeValue(computation(ComputeOperator.ADD), { a: 0.1, b: 0.2 })).toBe(0.3);
   });

   it.each([
      ['missing', { b: 2 }],
      ['null', { a: null, b: 2 }],
      ['string', { a: '6', b: 2 }],
      ['NaN', { a: 6, b: NaN }]
   ])('#computeValue should return undefined for %s operand', (_name, entry) => {
      expect(computeValue(computation(ComputeOperator.ADD), entry)).toBeUndefined();
   });

   it.each([ComputeOperator.DIVIDE, ComputeOperator.PERCENTAGE])('#computeValue should return undefined for %s by zero', operator => {
      expect(computeValue(computation(operator), { a: 6, b: 0 })).toBeUndefined();
   });

   it('#computeValue should return undefined for unknown operator', () => {
      expect(computeValue(computation('unknown' as ComputeOperator), { a: 6, b: 2 })).toBeUndefined();
   });

   it('#withComputedValues should add computed values', () => {

      // given
      const entries = [{ a: 1, b: 4 }, { a: 3, b: 4 }];

      // when
      const result = withComputedValues(entries, [amount, share]);

      // then
      expect(result).toBe(entries);
      expect(result).toEqual([{ a: 1, b: 4, Share: 25 }, { a: 3, b: 4, Share: 75 }]);
   });

   it('#withComputedValues should delete property when value is undefined', () => {

      // given
      const entries = [{ a: 1, b: 0, Share: 50 }, { a: 1 }];

      // when
      const result = withComputedValues(entries, [share]);

      // then
      expect(result).toEqual([{ a: 1, b: 0 }, { a: 1 }]);
   });

   it('#withComputedValues should return same entries when there is no computed column', () => {

      // given
      const entries = [{ a: 1, b: 4 }];

      // when
      const result = withComputedValues(entries, [amount]);

      // then
      expect(result).toBe(entries);
      expect(result).toEqual([{ a: 1, b: 4 }]);
   });

   it('#formulaOf should return English formula', () => {
      expect(formulaOf(computation(ComputeOperator.PERCENTAGE))).toBe('a as % of b');
   });

   it('#formulaOf should return German formula', async () => {

      // given
      vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
      await TestBed.inject(LanguageService).use('de');

      // when
      const formula = formulaOf(computation(ComputeOperator.PERCENTAGE));

      // then
      expect(formula).toBe('a in % von b');
   });

   it('#computedColumnTooltipOf should return formula of computed column', () => {
      expect(computedColumnTooltipOf(share)).toBe('a as % of b');
   });

   it('#computedColumnTooltipOf should return empty string for stored column', () => {
      expect(computedColumnTooltipOf(amount)).toBe('');
   });
});
