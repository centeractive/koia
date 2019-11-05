import { ColumnMappingGenerator as ColumnMappingGenerator } from './column-mapping-generator';
import { DataType } from 'app/shared/model';

describe('ColumnMappingGenerator', () => {

   const generator = new ColumnMappingGenerator();

   it('#generate should return empty array when entries are missing', () => {
      expect(generator.generate(undefined, 'en')).toEqual([]);
      expect(generator.generate(null, 'en')).toEqual([]);
      expect(generator.generate([], 'en')).toEqual([]);
   });

   it('#generate should return indexed text to text mapping', () => {

      // when
      const mapping = generator.generate([{ X: 'abc' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.TEXT, width: 10, indexed: true });
   });

   it('#generate should return non indexed text to text mapping when value is too long', () => {

      // when
      const entry = { X: 'This text is too long to be indexed and cannot be used for charting, summaries and further computations' };
      const mapping = generator.generate([entry], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.TEXT, width: 103, indexed: false });
   });

   it('#generate should return non indexed text to text mapping when any value is too long', () => {

      // when
      const entries = [
         { X: 'a' },
         { X: 'b' },
         { X: 'This text is too long to be indexed and cannot be used for charting, summaries and further computations' },
         { X: 'c' }
      ]
      const mapping = generator.generate(entries, 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.TEXT, width: 103, indexed: false });
   });

   it('#generate should return no mapping when entry is empty', () => {

      // when
      const mapping = generator.generate([{}], 'en');

      // then
      expect(mapping.length).toBe(0);
   });

   it('#generate should return default mapping when value is null', () => {

      // when
      const mapping = generator.generate([{ X: null }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.TEXT, width: 10, indexed: true });
   });

   it('#generate should return default mapping when value is undefined', () => {

      // when
      const mapping = generator.generate([{ X: undefined }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.TEXT, width: 10, indexed: true });
   });

   it('#generate should return text mapping when text is present', () => {

      // when
      const mapping = generator.generate([{ X: 'test' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.TEXT, width: 10, indexed: true });
   });

   it('#generate should return date text to time mapping with undefined source format', () => {

      // when
      const mapping = generator.generate([{ X: '2019-01-30' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined, format: undefined });
      expect(mapping[0].target)
         .toEqual({ name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm:ss SSS', indexed: true });
   });

   it('#generate should return date text to time mapping with undefined source format when first value is null', () => {

      // when
      const mapping = generator.generate([{ X: null }, { X: '2019-01-30' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined, format: undefined });
      expect(mapping[0].target)
         .toEqual({ name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm:ss SSS', indexed: true });
   });

   it('#generate should return date text to time mapping with undefined source format when first value is undefined', () => {

      // when
      const mapping = generator.generate([{ X: undefined }, { X: '2019-01-30' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined, format: undefined });
      expect(mapping[0].target)
         .toEqual({ name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm:ss SSS', indexed: true });
   });

   it('#generate should return date text to time mapping with undefined source format when second value is empty', () => {

      // when
      const mapping = generator.generate([{ X: '' }, { X: '2019-01-30' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined, format: undefined });
      expect(mapping[0].target)
         .toEqual({ name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm:ss SSS', indexed: true });
   });

   it('#generate should return date text to time mapping with undefined source format when first value is empty', () => {

      // when
      const mapping = generator.generate([{ X: '2019-01-30' }, { X: '' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined, format: undefined });
      expect(mapping[0].target)
         .toEqual({ name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm:ss SSS', indexed: true });
   });

   it('#generate should return date/time text to time mapping with undefined source format', () => {

      // when
      const mapping = generator.generate([{ X: '01 Jan 1970 00:00:00 GMT' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined, format: undefined });
      expect(mapping[0].target)
         .toEqual({ name: 'X', dataType: DataType.TIME, width: 24, format: 'd MMM yyyy HH:mm:ss SSS', indexed: true });
   });

   it('#generate should return date/time text to time mapping with source format', () => {

      // when
      const mapping = generator.generate([{ X: '1970-01-01 00:00:00,000' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined, format: 'yyyy-MM-dd HH:mm:ss,SSS' });
      expect(mapping[0].target)
         .toEqual({ name: 'X', dataType: DataType.TIME, width: 23, format: 'd MMM yyyy HH:mm:ss SSS', indexed: true });
   });

   it('#generate should return date/time text to time mapping with source format when first value is null', () => {

      // when
      const mapping = generator.generate([{ X: null }, { X: '1970-01-01 00:00:00,000' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined, format: 'yyyy-MM-dd HH:mm:ss,SSS' });
      expect(mapping[0].target)
         .toEqual({ name: 'X', dataType: DataType.TIME, width: 23, format: 'd MMM yyyy HH:mm:ss SSS', indexed: true });
   });

   it('#generate should return date/time text to time mapping with source format when first value is undefined', () => {

      // when
      const mapping = generator.generate([{ X: undefined }, { X: '1970-01-01 00:00:00,000' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined, format: 'yyyy-MM-dd HH:mm:ss,SSS' });
      expect(mapping[0].target)
         .toEqual({ name: 'X', dataType: DataType.TIME, width: 23, format: 'd MMM yyyy HH:mm:ss SSS', indexed: true });
   });

   it('#generate should return date/time text to time mapping with source format when first value is empty', () => {

      // when
      const mapping = generator.generate([{ X: '' }, { X: '1970-01-01 00:00:00,000' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined, format: 'yyyy-MM-dd HH:mm:ss,SSS' });
      expect(mapping[0].target).toEqual({
         name: 'X', dataType: DataType.TIME, width: 23, format: 'd MMM yyyy HH:mm:ss SSS', indexed: true
      });
   });

   it('#generate should return date text to time mapping when date has ambiguous non ISO-8601 format', () => {

      // given
      const entries = [
         { X: '10.04.2005' },
         { X: '31.03.2009' }
      ];

      // when
      const mapping = generator.generate(entries, 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.TEXT, width: undefined, format: 'dd.MM.yyyy' });
      expect(mapping[0].target)
         .toEqual({ name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm:ss SSS', indexed: true });
   });

   it('#generate should return text to number mapping', () => {

      // when
      const mapping = generator.generate([{ X: '123' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.NUMBER, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.NUMBER, width: 10, indexed: true });
   });

   it('#generate should return number mapping', () => {

      // when
      const mapping = generator.generate([{ X: 123 }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.NUMBER, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.NUMBER, width: 10, indexed: true });
   });

   it('#generate should return number to date mapping when column name ends with date and values are integers', () => {

      // when
      const mapping = generator.generate([{ 'start-date': 0 }, { 'start-date': 0 }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'start-date', dataType: DataType.TIME, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'start-date', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy', indexed: true });
   });

   it('#generate should return number mapping when column name ends with date but any value is not integer', () => {

      // when
      const mapping = generator.generate([{ 'start-date': 0 }, { 'start-date': 0.1 }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'start-date', dataType: DataType.NUMBER, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'start-date', dataType: DataType.NUMBER, width: 10, indexed: true });
   });

   it('#generate should return number to time mapping when column name ends with time and values are integers', () => {

      // when
      const mapping = generator.generate([{ 'creation-time': 0 }, { 'creation-time': 0 }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'creation-time', dataType: DataType.TIME, width: undefined });
      expect(mapping[0].target).toEqual({
         name: 'creation-time', dataType: DataType.TIME, width: 10,
         format: 'd MMM yyyy HH:mm:ss SSS', indexed: true
      });
   });

   it('#generate should return number mapping when column name ends with time but any value is not integer', () => {

      // when
      const mapping = generator.generate([{ 'start-time': 0 }, { 'start-time': 0.1 }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'start-time', dataType: DataType.NUMBER, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'start-time', dataType: DataType.NUMBER, width: 10, indexed: true });
   });

   it('#generate should return text to number mapping when first value is null', () => {

      // when
      const mapping = generator.generate([{ X: null }, { X: 123 }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.NUMBER, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.NUMBER, width: 10, indexed: true });
   });

   it('#generate should return text to number mapping when first value is undefined', () => {

      // when
      const mapping = generator.generate([{ X: undefined }, { X: 123 }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.NUMBER, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.NUMBER, width: 10, indexed: true });
   });

   it('#generate should return text to number mapping when first value is empty', () => {

      // when
      const mapping = generator.generate([{ X: '' }, { X: 123 }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.NUMBER, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.NUMBER, width: 10, indexed: true });
   });

   it('#generate should return text to boolean mapping', () => {

      // when
      const mapping = generator.generate([{ X: 'true' }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.BOOLEAN, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.BOOLEAN, width: 10, indexed: true });
   });

   it('#generate should return boolean mapping', () => {

      // when
      const mapping = generator.generate([{ X: true }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.BOOLEAN, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.BOOLEAN, width: 10, indexed: true });
   });

   it('#generate should return boolean mapping when first value is null', () => {

      // when
      const mapping = generator.generate([{ X: null }, { X: true }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.BOOLEAN, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.BOOLEAN, width: 10, indexed: true });
   });

   it('#generate should return boolean mapping when first value is undefined', () => {

      // when
      const mapping = generator.generate([{ X: undefined }, { X: true }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.BOOLEAN, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.BOOLEAN, width: 10, indexed: true });
   });

   it('#generate should return boolean mapping when first value is empty', () => {

      // when
      const mapping = generator.generate([{ X: '' }, { X: true }], 'en');

      // then
      expect(mapping.length).toBe(1);
      expect(mapping[0].source).toEqual({ name: 'X', dataType: DataType.BOOLEAN, width: undefined });
      expect(mapping[0].target).toEqual({ name: 'X', dataType: DataType.BOOLEAN, width: 10, indexed: true });
   });

   it('#generate should return mapping with different data types', () => {

      // given
      const entries = [
         { A: '-1.5', B: 'X', C: true },
         { A: 2, B: 'Y', C: 'FALSE' },
         { A: '3', B: 'X', C: true },
         { A: 4, B: 'Y', C: false },
         { A: -5, B: 'Z', C: 'true' }
      ];

      // when
      const mapping = generator.generate(entries, 'en');

      // then
      expect(mapping.length).toBe(3);

      expect(mapping[0].source).toEqual({ name: 'A', dataType: DataType.NUMBER, width: undefined });
      expect(mapping[1].source).toEqual({ name: 'B', dataType: DataType.TEXT, width: undefined });
      expect(mapping[2].source).toEqual({ name: 'C', dataType: DataType.BOOLEAN, width: undefined });

      expect(mapping[0].target).toEqual({ name: 'A', dataType: DataType.NUMBER, width: 10, indexed: true });
      expect(mapping[1].target).toEqual({ name: 'B', dataType: DataType.TEXT, width: 10, indexed: true });
      expect(mapping[2].target).toEqual({ name: 'C', dataType: DataType.BOOLEAN, width: 10, indexed: true });
   });

   it('#generate should return mapping with text data type only', () => {

      // given
      const entries = [
         { A: 1, B: 'X', C: true },
         { A: 2, B: 'Y', C: false },
         { A: 3, B: 'X', C: '-' },
         { A: '-', B: 'Y', C: false },
         { A: 5, B: 'Z', C: true }
      ];

      // when
      const mapping = generator.generate(entries, 'en');

      // then
      expect(mapping.length).toBe(3);

      expect(mapping[0].source).toEqual({ name: 'A', dataType: DataType.TEXT, width: undefined });
      expect(mapping[1].source).toEqual({ name: 'B', dataType: DataType.TEXT, width: undefined });
      expect(mapping[2].source).toEqual({ name: 'C', dataType: DataType.TEXT, width: undefined });

      expect(mapping[0].target).toEqual({ name: 'A', dataType: DataType.TEXT, width: 10, indexed: true });
      expect(mapping[1].target).toEqual({ name: 'B', dataType: DataType.TEXT, width: 10, indexed: true });
      expect(mapping[2].target).toEqual({ name: 'C', dataType: DataType.TEXT, width: 10, indexed: true });
   });
});
