import { ColumnPair, DataType } from 'app/shared/model';
import { IdColumn } from './id-column';

describe('IdColumn', () => {

   let namePair: ColumnPair;

   beforeEach(() => {
      namePair = { source: { name: 'Name', dataType: DataType.TEXT, width: 20 }, target: { name: 'Name', dataType: DataType.TEXT, width: 20 } };
   });

   it('#applyTo should put new ID mapping first when wanted', () => {

      // when
      const actual = IdColumn.applyTo([namePair], true);

      // then
      expect(actual.map(cp => cp.target.name)).toEqual(['ID', 'Name']);
      expect(actual[0]).toEqual({
         source: { name: 'ID', dataType: DataType.NUMBER, width: 6 },
         target: { name: 'ID', dataType: DataType.NUMBER, width: 6, indexed: true },
         sequence: true
      });
      expect(actual[1]).toBe(namePair);
   });

   it('#applyTo should keep existing ID mapping first when wanted', () => {

      // given
      const idPair = IdColumn.applyTo([], true)[0];
      idPair.target.name = 'Nr';

      // when
      const actual = IdColumn.applyTo([namePair, idPair], true);

      // then
      expect(actual).toEqual([idPair, namePair]);
      expect(actual[0]).toBe(idPair);
      expect(actual[0].target.name).toBe('Nr');
   });

   it('#applyTo should remove ID mapping when not wanted', () => {

      // given
      const idPair = IdColumn.applyTo([], true)[0];

      // when
      const actual = IdColumn.applyTo([idPair, namePair], false);

      // then
      expect(actual).toEqual([namePair]);
      expect(actual[0]).toBe(namePair);
   });

   it('#applyTo should keep mappings without ID mapping when not wanted', () => {

      // given
      const columnMappings = [namePair];

      // when
      const actual = IdColumn.applyTo(columnMappings, false);

      // then
      expect(actual).not.toBe(columnMappings);
      expect(actual[0]).toBe(namePair);
      expect(actual.length).toBe(1);
   });
});
