import { EntryMapper } from './entry-mapper';
import { Column, DataType, ColumnPair } from 'app/shared/model';

describe('EntryMapper', () => {

   const now = new Date().getTime();
   const dateTimeFormat = 'yyyy.MM.dd HH:mm:ss SSS';
   let columnPairs: ColumnPair[];
   let mapper: EntryMapper;

   beforeEach(() => {
      const sourceColumns = [
         { name: 'Text', dataType: DataType.TEXT, width: 1 },
         { name: 'Number', dataType: DataType.NUMBER, width: 1 },
         { name: 'Time', dataType: DataType.TIME, width: 1 },
         { name: 'Boolean', dataType: DataType.BOOLEAN, width: 1 }
      ];
      columnPairs = sourceColumns.map(c => toColumnPair(c));
      mapper = new EntryMapper(columnPairs, 'en');
   });

   it('#mapRows should return entry with initial _id attribute', () => {

      // when
      const actual = mapper.mapRows([['A']]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000001', Text: 'A' });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows should return entry with incremented _id attribute', () => {

      // given
      mapper.mapRows(rows(10));
      mapper.mapRows(rows(10));

      // when
      const actual = mapper.mapRows([['C']]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000021', Text: 'C' });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows should return empty array when row is empty', () => {

      // when
      const actual = mapper.mapRows([[]]);

      // then
      expect(actual.length).toBe(0);
   });

   it('#mapRows should return empty array when all values  are null', () => {

      // when
      const actual = mapper.mapRows([[null, null]]);

      // then
      expect(actual.length).toBe(0);
   });

   it('#mapRows should return empty array when all values are undefined', () => {

      // when
      const actual = mapper.mapRows([[undefined, undefined]]);

      // then
      expect(actual.length).toBe(0);
   });

   it('#mapRows TEXT to TEXT', () => {

      // when
      const actual = mapper.mapRows([['test']]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Text']).toBe('test');
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows TEXT to NUMBER', () => {

      // given
      const cp = columnPair('Text');
      cp.target.name = 'Amount';
      cp.target.dataType = DataType.NUMBER;

      // when
      const actual = mapper.mapRows([['12.5']]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Amount']).toBe(12.5);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows TEXT to BOOLEAN', () => {

      // given
      const cp = columnPair('Text');
      cp.target.name = 'Valid';
      cp.target.dataType = DataType.BOOLEAN;

      // when
      const actual = mapper.mapRows([['true']]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Valid']).toBe(true);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows TEXT to TIME', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = dateTimeFormat;
      cp.target.name = 'Date/Time';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapRows([['2019.05.06 11:22:33 444']]);

      // then
      expect(actual.length).toBe(1);
      const date = new Date(actual[0].entry['Date/Time']);
      expect(date.getFullYear()).toBe(2019);
      expect(date.getMonth()).toBe(4);
      expect(date.getDate()).toBe(6);
      expect(date.getHours()).toBe(11);
      expect(date.getMinutes()).toBe(22);
      expect(date.getSeconds()).toBe(33);
      expect(date.getMilliseconds()).toBe(444);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows TEXT to TIME should round down when target format is day', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = dateTimeFormat;
      cp.target.name = 'Date/Time';
      cp.target.dataType = DataType.TIME;
      cp.target.format = 'd MMM yyyy'

      // when
      const actual = mapper.mapRows([['2019.05.06 11:22:33 444']]);

      // then
      expect(actual.length).toBe(1);
      const date = new Date(actual[0].entry['Date/Time']);
      expect(date.getFullYear()).toBe(2019);
      expect(date.getMonth()).toBe(4);
      expect(date.getDate()).toBe(6);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows TEXT to TIME should round down when target format is month', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = dateTimeFormat;
      cp.target.name = 'Date/Time';
      cp.target.dataType = DataType.TIME;
      cp.target.format = 'MMM yyyy'

      // when
      const actual = mapper.mapRows([['2019.05.06 11:22:33 444']]);

      // then
      expect(actual.length).toBe(1);
      const date = new Date(actual[0].entry['Date/Time']);
      expect(date.getFullYear()).toBe(2019);
      expect(date.getMonth()).toBe(4);
      expect(date.getDate()).toBe(1);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows TEXT to TIME should round down when target format is year', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = dateTimeFormat;
      cp.target.name = 'Date/Time';
      cp.target.dataType = DataType.TIME;
      cp.target.format = 'yyyy'

      // when
      const actual = mapper.mapRows([['2019.05.06 11:22:33 444']]);

      // then
      expect(actual.length).toBe(1);
      const date = new Date(actual[0].entry['Date/Time']);
      expect(date.getFullYear()).toBe(2019);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows NUMBER content to TEXT', () => {

      // given
      const cp = columnPair('Number');
      cp.target.name = 'Code';
      cp.target.dataType = DataType.TEXT;

      // when
      const actual = mapper.mapRows([[undefined, '123']]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Code']).toBe('123');
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows NUMBER to TIME', () => {

      // given
      const cp = columnPair('Number');
      cp.source.format = 'yyyy';
      cp.target.name = 'Year';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapRows([[undefined, '2019']]);

      // then
      expect(actual.length).toBe(1);
      const date = new Date(actual[0].entry['Year']);
      expect(date.getFullYear()).toBe(2019);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows should return entry with all values mapped', () => {

      // when
      const actual = mapper.mapRows([['A', '1', now.toString(), 'false']]);

      // then
      expect(actual.length).toBe(1);
      const actualEntry = actual[0].entry;
      expect(actualEntry['Text']).toEqual('A');
      expect(actualEntry['Number']).toEqual(1);
      expect(actualEntry['Time']).toEqual(now);
      expect(actualEntry['Boolean']).toEqual(false);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows should return no value but error for invalid number', () => {

      // when
      const actual = mapper.mapRows([['A', 'X']]);

      // then
      expect(actual.length).toBe(1);
      const actualEntry = actual[0].entry;
      expect(actualEntry).toEqual({ _id: '1000001', Text: 'A' });
      expect(actual[0].errors).toEqual(['Column \'Number\': Cannot convert "X" to Number']);
   });

   it('#mapRows should return no entry but error for invalid time', () => {

      // given
      columnPairs[0].target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapRows([['X']]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toBeUndefined();
      expect(actual[0].errors).toEqual(['Column \'Text\': Cannot convert "X" to Time without a custom source format']);
   });

   it('#mapRows should return no entry but error when date without format cannot be parsed', () => {

      // given
      const cp = columnPair('Text');
      cp.target.name = 'Date';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapRows([['18/02/2019']]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toBeUndefined();
      expect(actual[0].errors).toEqual(['Column \'Text\': Cannot convert "18/02/2019" to Time without a custom source format']);
   });

   it('#mapRows should return no entry but error when date with format cannot be parsed', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = 'MM/dd/yyyy';
      cp.target.name = 'Date';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapRows([['18/02/2019']]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toBeUndefined();
      expect(actual[0].errors).toEqual(['Column \'Text\': Cannot convert "18/02/2019" to Time using format "MM/dd/yyyy"']);
   });

   it('#mapRows should return no entry but error for invalid boolean', () => {

      // given
      columnPairs[0].target.dataType = DataType.BOOLEAN;

      // when
      const actual = mapper.mapRows([['X']]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toBeUndefined();
      expect(actual[0].errors).toEqual(['Column \'Text\': Cannot convert "X" to Boolean']);
   });

   it('#mapObjects should return entry with initial _id attribute', () => {

      // when
      const actual = mapper.mapObjects([{ Text: 'A' }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000001', Text: 'A' });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects should return entry with incremented _id attribute', () => {

      // given
      mapper.mapObjects(entries(10, 'Text'));
      mapper.mapObjects(entries(10, 'Text'));

      // when
      const actual = mapper.mapObjects([{ Text: 'C' }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000021', Text: 'C' });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects should return empty array when entry is empty', () => {

      // when
      const actual = mapper.mapObjects([{}]);

      // then
      expect(actual.length).toBe(0);
   });

   it('#mapObjects should return empty array when all value are null', () => {

      // when
      const actual = mapper.mapObjects([{ Text: null, Number: null}]);

      // then
      expect(actual.length).toBe(0);
   });

   it('#mapObjects should return empty array when all values are undefined', () => {

      // when
      const actual = mapper.mapObjects([{ Text: undefined, Number: undefined}]);

      // then
      expect(actual.length).toBe(0);
   });

   it('#mapObjects TEXT to TEXT', () => {

      // when
      const actual = mapper.mapObjects([{ Text: 'test' }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Text']).toBe('test');
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects TEXT to NUMBER', () => {

      // given
      const cp = columnPair('Text');
      cp.target.name = 'Amount';
      cp.target.dataType = DataType.NUMBER;

      // when
      const actual = mapper.mapObjects([{ Text: '12.5' }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Amount']).toBe(12.5);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects TEXT to BOOLEAN', () => {

      // given
      const cp = columnPair('Text');
      cp.target.name = 'Valid';
      cp.target.dataType = DataType.BOOLEAN;

      // when
      const actual = mapper.mapObjects([{ Text: 'true' }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Valid']).toBe(true);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects TEXT to TIME', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = dateTimeFormat;
      cp.target.name = 'Date/Time';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapObjects([{ Text: '2019.05.06 11:22:33 444' }]);

      // then
      expect(actual.length).toBe(1);
      const date = new Date(actual[0].entry['Date/Time']);
      expect(date.getFullYear()).toBe(2019);
      expect(date.getMonth()).toBe(4);
      expect(date.getDate()).toBe(6);
      expect(date.getHours()).toBe(11);
      expect(date.getMinutes()).toBe(22);
      expect(date.getSeconds()).toBe(33);
      expect(date.getMilliseconds()).toBe(444);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects TEXT to TIME should round down when target format is day', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = dateTimeFormat;
      cp.target.name = 'Date/Time';
      cp.target.dataType = DataType.TIME;
      cp.target.format = 'd MMM yyyy';

      // when
      const actual = mapper.mapObjects([{ Text: '2019.05.06 11:22:33 444' }]);

      // then
      expect(actual.length).toBe(1);
      const date = new Date(actual[0].entry['Date/Time']);
      expect(date.getFullYear()).toBe(2019);
      expect(date.getMonth()).toBe(4);
      expect(date.getDate()).toBe(6);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects TEXT to TIME should round down when target format is month', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = dateTimeFormat;
      cp.target.name = 'Date/Time';
      cp.target.dataType = DataType.TIME;
      cp.target.format = 'MMM yyyy';

      // when
      const actual = mapper.mapObjects([{ Text: '2019.05.06 11:22:33 444' }]);

      // then
      expect(actual.length).toBe(1);
      const date = new Date(actual[0].entry['Date/Time']);
      expect(date.getFullYear()).toBe(2019);
      expect(date.getMonth()).toBe(4);
      expect(date.getDate()).toBe(1);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects TEXT to TIME should round down when target format is year', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = dateTimeFormat;
      cp.target.name = 'Date/Time';
      cp.target.dataType = DataType.TIME;
      cp.target.format = 'yyyy';

      // when
      const actual = mapper.mapObjects([{ Text: '2019.05.06 11:22:33 444' }]);

      // then
      expect(actual.length).toBe(1);
      const date = new Date(actual[0].entry['Date/Time']);
      expect(date.getFullYear()).toBe(2019);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects TEXT to TIME when non ISO-8601 and ISO-8601 date is present', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = 'dd.MM.YYYY';
      cp.target.name = 'Date/Time';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapObjects([{ Text: '01.01.2019' }, { Text: '2019-01-01' }]);

      // then
      expect(actual.length).toBe(2);
      const d1 = new Date(actual[0].entry['Date/Time']);
      const d2 = new Date(actual[1].entry['Date/Time']);
      expect(isNaN(d1.getTime())).toBeFalsy();
      expect(isNaN(d2.getTime())).toBeFalsy();
      expect(d1.toDateString()).toBe(d2.toDateString());
      expect(actual[0].errors).toEqual([]);
      expect(actual[1].errors).toEqual([]);
   });

   it('#mapObjects NUMBER to TEXT', () => {

      // given
      const cp = columnPair('Number');
      cp.target.name = 'Code';
      cp.target.dataType = DataType.TEXT;

      // when
      const actual = mapper.mapObjects([{ Number: 123 }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Code']).toBe('123');
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows NUMBER to TIME', () => {

      // given
      const cp = columnPair('Number');
      cp.source.format = 'yyyy';
      cp.target.name = 'Year';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapObjects([{ Number: 2019 }]);

      // then
      expect(actual.length).toBe(1);
      const date = new Date(actual[0].entry['Year']);
      expect(date.getFullYear()).toBe(2019);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects BOOLEAN to TEXT', () => {

      // given
      const cp = columnPair('Boolean');
      cp.target.name = 'Valid';
      cp.target.dataType = DataType.TEXT;

      // when
      const actual = mapper.mapObjects([{ Boolean: true }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Valid']).toBe('true');
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects should return entry with all values mapped', () => {

      // when
      const entry = { Text: 'A', Number: 1, Time: now, Boolean: false };
      const actual = mapper.mapObjects([entry]);

      // then
      expect(actual.length).toBe(1);
      const actualEntry = actual[0].entry;
      expect(actualEntry['Text']).toEqual('A');
      expect(actualEntry['Number']).toEqual(1);
      expect(actualEntry['Time']).toEqual(now);
      expect(actualEntry['Boolean']).toEqual(false);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects should return no entry but error for invalid number', () => {

      // given
      columnPairs[0].target.dataType = DataType.NUMBER;

      // when
      const actual = mapper.mapObjects([{ Text: 'X' }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toBeUndefined();
      expect(actual[0].errors).toEqual(['Column \'Text\': Cannot convert "X" to Number']);
   });

   it('#mapObjects should return no entry but error for invalid time', () => {

      // given
      columnPairs[0].target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapObjects([{ Text: 'X' }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toBeUndefined();
      expect(actual[0].errors).toEqual(['Column \'Text\': Cannot convert "X" to Time without a custom source format']);
   });

   it('#mapObjects should return no entry but error for invalid boolean', () => {

      // given
      columnPairs[0].target.dataType = DataType.BOOLEAN;

      // when
      const actual = mapper.mapObjects([{ Text: 'X' }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toBeUndefined();
      expect(actual[0].errors).toEqual(['Column \'Text\': Cannot convert "X" to Boolean']);
   });

   function toColumnPair(column: Column): ColumnPair {
      return {
         source: column,
         target: JSON.parse(JSON.stringify(column))
      };
   }

   function entries(objectCount: number, attributeName: string): Object[] {
      const array = [];
      for (let i = 1; i <= objectCount; i++) {
         const obj = {};
         obj[attributeName] = attributeName + ' ' + i;
         array.push(obj);
      }
      return array;
   }

   function rows(rowCount: number): string[][] {
      const data = [];
      for (let i = 1; i <= rowCount; i++) {
         const row = ['Value ' + i];
         data.push(row);
      }
      return data;
   }

   function columnPair(surceColumnName: string): ColumnPair {
      return columnPairs.find(cp => cp.source.name === surceColumnName);
   }
});
