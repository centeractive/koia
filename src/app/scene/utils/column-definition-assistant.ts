import { ColumnPair, DataType } from 'app/shared/model';

export class ColumnDefinitionAssistant {

   selectableDataTypeOf(columnPair: ColumnPair): DataType[] {
      switch (columnPair.source.dataType) {
         case DataType.NUMBER:
         case DataType.TIME:
            return [DataType.NUMBER, DataType.TEXT, DataType.TIME];
         case DataType.BOOLEAN:
            return [DataType.BOOLEAN, DataType.TEXT];
         case DataType.OBJECT:
            return [DataType.OBJECT];
         default:
            return [DataType.TEXT, DataType.TIME];
      }
   }

   canHaveSourceFormat(columnPair: ColumnPair): boolean {
      return columnPair.target.dataType === DataType.TIME;
   }

   canHaveDisplayFormat(columnPair: ColumnPair): boolean {
      return columnPair.target.dataType === DataType.TIME;
   }
}
