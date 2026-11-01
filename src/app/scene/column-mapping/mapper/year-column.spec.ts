import { ColumnPair, DataType } from 'app/shared/model';
import { YearColumn } from './year-column';

describe('YearColumn', () => {

   it('#isYearName should match a word ending like year or Jahr', () => {
      expect(['Year AD', 'fiscal_year', 'Baujahr', 'JAHR', 'Calendar Year (UTC)'].map(n => YearColumn.isYearName(n))).toEqual([true, true, true, true, true]);
   });

   it('#isYearName should match year in French, Italian or Spanish', () => {
      expect(['Année', 'annee', 'Anno di nascita', 'Año'].map(n => YearColumn.isYearName(n))).toEqual([true, true, true, true]);
   });

   it('#isYearName should not match other words', () => {
      expect(['years', 'Jahrgang', 'Tamaño', 'danno', 'Period', 'yearly'].map(n => YearColumn.isYearName(n)))
         .toEqual([false, false, false, false, false, false]);
   });

   it('#hasYearValues should accept integers from 1 to 9999 as numbers or digit strings with blanks', () => {
      expect(YearColumn.hasYearValues([1, 9999, '1', '0999', '2004', '', '  ', null, undefined])).toBe(true);
   });

   it('#hasYearValues should reject values other than years', () => {
      expect([[0], [10000], [2004.5], ['0'], ['2,004'], ['12345'], ['2004 AD'], [true]].map(v => YearColumn.hasYearValues(v)))
         .toEqual([false, false, false, false, false, false, false, false]);
   });

   it('#hasYearValues should reject blank values only', () => {
      expect([YearColumn.hasYearValues([]), YearColumn.hasYearValues(['', null])]).toEqual([false, false]);
   });

   it('#apply should map number to time parsed by year format and shown as year', () => {

      // given
      const columnPair: ColumnPair = {
         source: { name: 'Year', dataType: DataType.NUMBER, width: 4 },
         target: { name: 'Year', dataType: DataType.NUMBER, width: 10 }
      };

      // when
      YearColumn.apply(columnPair);

      // then
      expect(columnPair.source).toEqual({ name: 'Year', dataType: DataType.NUMBER, width: 4, format: 'y' });
      expect(columnPair.target).toEqual({ name: 'Year', dataType: DataType.TIME, width: 10, format: 'yyyy' });
   });
});
