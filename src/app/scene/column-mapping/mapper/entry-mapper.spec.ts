import { Column, ColumnPair, DataType } from 'app/shared/model';
import { EntryMapper } from './entry-mapper';

describe('EntryMapper', () => {

   const now = new Date().getTime();
   const dateTimeFormat = 'yyyy.MM.dd HH:mm:ss SSS';
   const sourceColumnNames = ['Text', 'Number', 'Time', 'Boolean'];
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
      const actual = mapper.mapRows([['A']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000001', Text: 'A' });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows should return entry with incremented _id attribute', () => {

      // given
      mapper.mapRows(rows(10), sourceColumnNames);
      mapper.mapRows(rows(10), sourceColumnNames);

      // when
      const actual = mapper.mapRows([['C']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000021', Text: 'C' });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows should return empty array when row is empty', () => {

      // when
      const actual = mapper.mapRows([[]], sourceColumnNames);

      // then
      expect(actual.length).toBe(0);
   });

   it('#mapRows should return empty array when all values  are null', () => {

      // when
      const actual = mapper.mapRows([[null, null]], sourceColumnNames);

      // then
      expect(actual.length).toBe(0);
   });

   it('#mapRows should return empty array when all values are undefined', () => {

      // when
      const actual = mapper.mapRows([[undefined, undefined]], sourceColumnNames);

      // then
      expect(actual.length).toBe(0);
   });

   it('#mapRows should not map but ignore values that contain whitespace only', () => {

      // when
      const actual = mapper.mapRows([['A', '  ', ' \t', ' ']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000001', Text: 'A' });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows should return empty array when text value contains whitespace only', () => {

      // when
      const actual = mapper.mapRows([['  ']], sourceColumnNames);

      // then
      expect(actual.length).toBe(0);
   });

   it('#mapRows TEXT to TEXT', () => {

      // when
      const actual = mapper.mapRows([['test']], sourceColumnNames);

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
      const actual = mapper.mapRows([['12.5']], sourceColumnNames);

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
      const actual = mapper.mapRows([['true']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Valid']).toBe(true);
      expect(actual[0].errors).toEqual([]);
   });
   
   it('#mapRows when target column name ends with a dot', () => {

      // given
      const cp = columnPair('Number');
      cp.target.name = 'Pct.';

      // when
      const actual = mapper.mapRows([[undefined, '12.5']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Pct.']).toBe(12.5);
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows TEXT to TIME with valid date/time', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = dateTimeFormat;
      cp.target.name = 'Date/Time';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapRows([['2019.05.06 11:22:33 444']], sourceColumnNames);

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
      const actual = mapper.mapRows([['2019.05.06 11:22:33 444']], sourceColumnNames);

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
      const actual = mapper.mapRows([['2019.05.06 11:22:33 444']], sourceColumnNames);

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

   it('#mapRows NUMBER content to TEXT', () => {

      // given
      const cp = columnPair('Number');
      cp.target.name = 'Code';
      cp.target.dataType = DataType.TEXT;

      // when
      const actual = mapper.mapRows([[undefined, '123']], sourceColumnNames);

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
      const actual = mapper.mapRows([[undefined, '2019']], sourceColumnNames);

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
      const actual = mapper.mapRows([['A', '1', now.toString(), 'false']], sourceColumnNames);

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
      const actual = mapper.mapRows([['A', 'X']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      const actualEntry = actual[0].entry;
      expect(actualEntry).toEqual({ _id: '1000001', Text: 'A' });
      expect(actual[0].errors).toEqual(['Column \'Number\': Cannot convert "X" to Number']);
   });

   it('#mapRows should return no value but error when number has leading zeros', () => {

      // when
      const actual = mapper.mapRows([['A', '00123']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000001', Text: 'A' });
      expect(actual[0].errors).toEqual(['Column \'Number\': Cannot convert "00123" to Number']);
   });

   it('#mapRows NUMBER to TIME should interpret number as epoch milliseconds when source format is missing', () => {

      // given
      const cp = columnPair('Number');
      cp.target.name = 'Shipped';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapRows([[undefined, '86400000']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000001', Shipped: 86_400_000 });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows NUMBER to TIME should round epoch milliseconds down to target format when source format is missing', () => {

      // given
      const cp = columnPair('Number');
      cp.target.name = 'Year';
      cp.target.dataType = DataType.TIME;
      cp.target.format = 'yyyy';

      // when
      const actual = mapper.mapRows([[undefined, new Date(2019, 4, 6, 11, 22).getTime().toString()]], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000001', Year: new Date(2019, 0, 1).getTime() });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows NUMBER to TIME should return no entry but error when value is no number and source format is missing', () => {

      // given
      const cp = columnPair('Number');
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapRows([[undefined, 'X']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toBeUndefined();
      expect(actual[0].errors).toEqual(['Column \'Number\': Cannot convert "X" to Time without a custom source format']);
   });

   it('#mapRows NUMBER to TIME should return no entry but error when epoch milliseconds exceed date range', () => {

      // given
      const cp = columnPair('Number');
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapRows([[undefined, '9e15']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toBeUndefined();
      expect(actual[0].errors).toEqual(['Column \'Number\': Cannot convert "9e15" to Time without a custom source format']);
   });

   it('#mapRows TEXT to TIME should parse ISO 8601 date in local time when source format is missing', () => {

      // given
      const cp = columnPair('Text');
      cp.target.name = 'Date';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapRows([['2019-05-06']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000001', Date: new Date(2019, 4, 6).getTime() });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows TEXT to TIME should respect offset of ISO 8601 date/time when source format is missing', () => {

      // given
      const cp = columnPair('Text');
      cp.target.name = 'Date';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapRows([['2019-05-06T11:22:33+02:00']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000001', Date: Date.UTC(2019, 4, 6, 9, 22, 33) });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows TEXT to TIME should return no entry but error when value matches neither source format nor ISO 8601', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = 'dd.MM.yyyy';
      cp.target.name = 'Date';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapRows([['05/06/2019']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toBeUndefined();
      expect(actual[0].errors).toEqual(['Column \'Text\': Cannot convert "05/06/2019" to Time using format "dd.MM.yyyy"']);
   });

   it('#mapRows should return no entry but error for invalid time', () => {

      // given
      columnPairs[0].target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapRows([['X']], sourceColumnNames);

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
      const actual = mapper.mapRows([['18/02/2019']], sourceColumnNames);

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
      const actual = mapper.mapRows([['18/02/2019']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toBeUndefined();
      expect(actual[0].errors).toEqual(['Column \'Text\': Cannot convert "18/02/2019" to Time using format "MM/dd/yyyy"']);
   });

   it('#mapRows should return no entry but error for invalid boolean', () => {

      // given
      columnPairs[0].target.dataType = DataType.BOOLEAN;

      // when
      const actual = mapper.mapRows([['X']], sourceColumnNames);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toBeUndefined();
      expect(actual[0].errors).toEqual(['Column \'Text\': Cannot convert "X" to Boolean']);
   });

   it('#mapRows should map values by source column name when column mapping is in different order', () => {

      // given
      mapper = new EntryMapper([columnPair('Number'), columnPair('Text')], 'en');

      // when
      const actual = mapper.mapRows([['A', '1']], ['Text', 'Number']);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000001', Text: 'A', Number: 1 });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows should not map value when source column is missing', () => {

      // given
      mapper = new EntryMapper([columnPair('Text'), columnPair('Number')], 'en');

      // when
      const actual = mapper.mapRows([['A', '1']], ['Text', 'Skipped']);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000001', Text: 'A' });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows should map values of all columns when duplicate source column names have been made unique', () => {

      // given
      mapper = new EntryMapper([columnPair('Text'), toColumnPair({ name: 'Text (2)', dataType: DataType.TEXT, width: 1 })], 'en');

      // when
      const actual = mapper.mapRows([['A', 'B']], ['Text', 'Text (2)']);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000001', Text: 'A', 'Text (2)': 'B' });
      expect(actual[0].errors).toEqual([]);
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
      const actual = mapper.mapObjects([{ Text: null, Number: null }]);

      // then
      expect(actual.length).toBe(0);
   });

   it('#mapObjects should return empty array when all values are undefined', () => {

      // when
      const actual = mapper.mapObjects([{ Text: undefined, Number: undefined }]);

      // then
      expect(actual.length).toBe(0);
   });

   it('#mapObjects should return empty array when all values contain whitespace only', () => {

      // when
      const actual = mapper.mapObjects([{ Text: ' ', Number: '\t', Time: '  ', Boolean: '\n' }]);

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

   it('#mapObjects TEXT to TIME should parse ISO 8601 date in local time when value does not match source format', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = 'dd.MM.yyyy';
      cp.target.name = 'Date/Time';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapObjects([{ Text: '01.01.2019' }, { Text: '2019-01-01' }]);

      // then
      expect(actual.length).toBe(2);
      expect(actual[0].entry['Date/Time']).toBe(new Date(2019, 0, 1).getTime());
      expect(actual[1].entry['Date/Time']).toBe(new Date(2019, 0, 1).getTime());
      expect(actual[0].errors).toEqual([]);
      expect(actual[1].errors).toEqual([]);
   });

   it('#mapObjects TEXT to TIME should return no entry but error when value is invalid', () => {

      // given
      const cp = columnPair('Text');
      cp.source.format = dateTimeFormat;
      cp.target.name = 'Date/Time';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapObjects([{ Text: 'xy' }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].errors).toEqual(['Column \'Text\': Cannot convert "xy" to Time using format "yyyy.MM.dd HH:mm:ss SSS"']);
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

   it('#mapObjects NUMBER to TIME should interpret number as epoch milliseconds when source format is missing', () => {

      // given
      const cp = columnPair('Number');
      cp.target.name = 'Shipped';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapObjects([{ Number: 172_800_000 }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toEqual({ _id: '1000001', Shipped: 172_800_000 });
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapRows undefined NUMBER to TIME', () => {

      // given
      const cp = columnPair('Number');
      cp.source.format = 'yyyy';
      cp.target.name = 'Year';
      cp.target.dataType = DataType.TIME;

      // when
      const actual = mapper.mapObjects([{ Number: undefined }]);

      // then
      expect(actual).toEqual([]);
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

   it('#mapObjects date object to NUMBER', () => {

      // given
      const today = new Date();

      // when
      const actual = mapper.mapObjects([{ Number: today }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Number']).toBe(today.getTime());
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects date object to TIME', () => {

      // given
      const today = new Date();

      // when
      const actual = mapper.mapObjects([{ Time: today }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Time']).toBe(today.getTime());
      expect(actual[0].errors).toEqual([]);
   });

   it('#mapObjects date object to TEXT', () => {

      // given
      const today = new Date();

      // when
      const actual = mapper.mapObjects([{ Text: today }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry['Text']).toBe(today.toString());
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

   it('#mapObjects should return no entry but error for invalid number II', () => {

      // given
      columnPairs[0].target.dataType = DataType.NUMBER;

      // when
      const actual = mapper.mapObjects([{ Text: true }]);

      // then
      expect(actual.length).toBe(1);
      expect(actual[0].entry).toBeUndefined();
      expect(actual[0].errors).toEqual(['Column \'Text\': Cannot convert "true" to Number']);
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

   function entries(objectCount: number, attributeName: string): object[] {
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
