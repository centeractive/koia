import { SeriesNameConverter } from './series-name-converter';
import { DataType, Column } from 'app/shared/model';

describe('SeriesNameConverter', () => {

   const converter = new SeriesNameConverter();

   it('#toGroupKey should return key derived from data column value', () => {

      // given
      const entry = { _id: 1, x: 'a', y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);

      // when
      const id = converter.toGroupKey(entry, dataColumn, []);

      // then
      expect(id).toEqual(1);
   });

   it('#toGroupKey should return key derived from split column value and data column value', () => {

      // given
      const entry = { _id: 1, x: 'a', y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);
      const splitColumns = [createColumn('x', DataType.TEXT)];

      // when
      const id = converter.toGroupKey(entry, dataColumn, splitColumns);

      // then
      expect(id).toEqual('a⯈1');
   });

   it('#toGroupKey should return key derived from split column values and data column value', () => {

      // given
      const entry = { _id: 1, x: 'a', y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);
      const splitColumns = [createColumn('x', DataType.TEXT), createColumn('z', DataType.NUMBER)];

      // when
      const id = converter.toGroupKey(entry, dataColumn, splitColumns);

      // then
      expect(id).toEqual('a⯈4⯈1');
   });

   it('#toGroupKey should return undefined when split column is null', () => {

      // given
      const entry = { _id: 1, x: null, y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);
      const splitColumns = [createColumn('x', DataType.TEXT)];

      // when
      const id = converter.toGroupKey(entry, dataColumn, splitColumns);

      // then
      expect(id).toBeUndefined();
   });

   it('#toGroupKey should return undefined when split column is undefined', () => {

      // given
      const entry = { _id: 1, x: 'a', y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);
      const splitColumns = [createColumn('s', DataType.TEXT)];

      // when
      const id = converter.toGroupKey(entry, dataColumn, splitColumns);

      // then
      expect(id).toBeUndefined();
   });

   it('#toGroupKey should return undefined when split column is empty string', () => {

      // given
      const entry = { _id: 1, x: '', y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);
      const splitColumns = [createColumn('x', DataType.TEXT)];

      // when
      const id = converter.toGroupKey(entry, dataColumn, splitColumns);

      // then
      expect(id).toBeUndefined();
   });

   it('#toGroupKey should return undefined when any split column is undefined', () => {

      // given
      const entry = { _id: 1, x: 'a', y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);
      const splitColumns = [createColumn('x', DataType.TEXT), createColumn('s', DataType.TEXT)];

      // when
      const id = converter.toGroupKey(entry, dataColumn, splitColumns);

      // then
      expect(id).toBeUndefined();
   });

   it('#toSeriesName should return name derived from data column name', () => {

      // given
      const entry = { _id: 1, x: 'a', y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);

      // when
      const name = converter.toSeriesName(entry, dataColumn, []);

      // then
      expect(name).toEqual('y');
   });

   it('#toSeriesName should return name derived from split column value', () => {

      // given
      const entry = { _id: 1, x: 'a', y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);
      const splitColumns = [createColumn('x', DataType.TEXT)];

      // when
      const name = converter.toSeriesName(entry, dataColumn, splitColumns);

      // then
      expect(name).toEqual('a⯈y');
   });

   it('#toSeriesName should return name derived from split column values', () => {

      // given
      const entry = { _id: 1, x: 'a', y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);
      const splitColumns = [createColumn('x', DataType.TEXT), createColumn('z', DataType.TEXT)];

      // when
      const name = converter.toSeriesName(entry, dataColumn, splitColumns);

      // then
      expect(name).toEqual('a⯈4⯈y');
   });

   it('#toSeriesName should return undefined when split column is null', () => {

      // given
      const entry = { _id: 1, x: null, y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);
      const splitColumns = [createColumn('x', DataType.TEXT)];

      // when
      const name = converter.toSeriesName(entry, dataColumn, splitColumns);

      // then
      expect(name).toBeUndefined();
   });

   it('#toSeriesName should return undefined when split column is undefined', () => {

      // given
      const entry = { _id: 1, x: 'a', y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);
      const splitColumns = [createColumn('s', DataType.TEXT)];

      // when
      const name = converter.toSeriesName(entry, dataColumn, splitColumns);

      // then
      expect(name).toBeUndefined();
   });

   it('#toSeriesName should return undefined when split column is empty string', () => {

      // given
      const entry = { _id: 1, x: '', y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);
      const splitColumns = [createColumn('x', DataType.TEXT)];

      // when
      const name = converter.toSeriesName(entry, dataColumn, splitColumns);

      // then
      expect(name).toBeUndefined();
   });

   it('#toSeriesName should return undefined when any split column is undefined', () => {

      // given
      const entry = { _id: 1, x: 'a', y: 1, z: 4 };
      const dataColumn = createColumn('y', DataType.NUMBER);
      const splitColumns = [createColumn('x', DataType.TEXT), createColumn('s', DataType.TEXT)];

      // when
      const name = converter.toSeriesName(entry, dataColumn, splitColumns);

      // then
      expect(name).toBeUndefined();
   });

   it('#toValues should return value when NUMBER data column and no split column is defined', () => {

      // given
      const dataColumn = createColumn('a', DataType.NUMBER);

      // when
      const values = converter.toValues(1, dataColumn,  []);

      // then
      expect(values).toEqual([1]);
   });

   it('#toValues should return value when TEXT data column and no split column is defined', () => {

      // given
      const dataColumn = createColumn('a', DataType.TEXT);

      // when
      const values = converter.toValues('1', dataColumn,  []);

      // then
      expect(values).toEqual(['1']);
   });

   it('#toValues should return value when BOOLEAN data column and no split column is defined', () => {

      // given
      const dataColumn = createColumn('a', DataType.BOOLEAN);

      // when
      const values = converter.toValues(true, dataColumn,  []);

      // then
      expect(values).toEqual([true]);
   });

   it('#toValues should return values when split column is defined', () => {

      // given
      const dataColumn = createColumn('a', DataType.NUMBER);
      const splitColumns = [createColumn('x', DataType.TEXT)];

      // when
      const values = converter.toValues('a⯈1', dataColumn, splitColumns);

      // then
      expect(values).toEqual(['a', 1]);
   });

   it('#toValues should return values when split columns are defined', () => {

      // given
      const dataColumn = createColumn('a', DataType.NUMBER);
      const splitColumns = [createColumn('x', DataType.TEXT), createColumn('z', DataType.NUMBER)];

      // when
      const values = converter.toValues('a⯈4⯈1', dataColumn, splitColumns);

      // then
      expect(values).toEqual(['a', 4, 1]);
   });

   function createColumn(name: string, dataType: DataType): Column {
      return {
        name: name,
        dataType: dataType,
        width: 10
      };
    }
});
