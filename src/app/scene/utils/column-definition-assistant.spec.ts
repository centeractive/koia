import { ColumnDefinitionAssistant } from './column-definition-assistant';
import { ColumnPair, DataType } from 'app/shared/model';

describe('ColumnDefinitionAssistant', () => {

   const colDefAssistant = new ColumnDefinitionAssistant();

   it('#selectableDataTypeOf when source data type is NUMBER', () => {

      // given
      const columnPair: ColumnPair = createColumnPair(DataType.NUMBER);

      // when
      const dataTypes = colDefAssistant.selectableDataTypeOf(columnPair);

      // then
      expect(dataTypes).toEqual([DataType.NUMBER, DataType.TEXT, DataType.TIME]);
   });

   it('#selectableDataTypeOf when source data type is TIME', () => {

      // given
      const columnPair: ColumnPair = createColumnPair(DataType.TIME);

      // when
      const dataTypes = colDefAssistant.selectableDataTypeOf(columnPair);

      // then
      expect(dataTypes).toEqual([DataType.NUMBER, DataType.TEXT, DataType.TIME]);
   });

   it('#selectableDataTypeOf when source data type is BOOLEAN', () => {

      // given
      const columnPair: ColumnPair = createColumnPair(DataType.BOOLEAN);

      // when
      const dataTypes = colDefAssistant.selectableDataTypeOf(columnPair);

      // then
      expect(dataTypes).toEqual([DataType.BOOLEAN, DataType.TEXT]);
   });

   it('#selectableDataTypeOf when source data type is TEXT', () => {

      // given
      const columnPair: ColumnPair = createColumnPair(DataType.TEXT);

      // when
      const dataTypes = colDefAssistant.selectableDataTypeOf(columnPair);

      // then
      expect(dataTypes).toEqual([DataType.TEXT, DataType.TIME]);
   });

   it('#canHaveSourceFormat should return true when target data type is TIME', () => {

      // given
      const columnPair: ColumnPair = createColumnPair(DataType.TEXT, DataType.TIME);

      // when
      const result = colDefAssistant.canHaveSourceFormat(columnPair);

      // then
      expect(result).toBeTruthy();
   });

   it('#canHaveSourceFormat should return false when target data type is not TIME', () => {

      // given
      const columnPair: ColumnPair = createColumnPair(DataType.TEXT, DataType.TEXT);

      // when
      const result = colDefAssistant.canHaveSourceFormat(columnPair);

      // then
      expect(result).toBeFalsy();
   });

   it('#canHaveDisplayFormat should return true when target data type is TIME', () => {

      // given
      const columnPair: ColumnPair = createColumnPair(DataType.TEXT, DataType.TIME);

      // when
      const result = colDefAssistant.canHaveDisplayFormat(columnPair);

      // then
      expect(result).toBeTruthy();
   });

   it('#canHaveDisplayFormat should return false when target data type is not TIME', () => {

      // given
      const columnPair: ColumnPair = createColumnPair(DataType.TEXT, DataType.TEXT);

      // when
      const result = colDefAssistant.canHaveDisplayFormat(columnPair);

      // then
      expect(result).toBeFalsy();
   });

   function createColumnPair(sourceDataType: DataType, targetDataType?: DataType): ColumnPair {
      return {
         source: {
            name: 'x',
            dataType: sourceDataType,
            width: 10
         },
         target: {
            name: 'x',
            dataType: targetDataType ? targetDataType : sourceDataType,
            width: 10
         }
      };
   }
});
