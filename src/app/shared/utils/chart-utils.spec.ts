import { DataType, Column } from '../model';
import { ChartUtils } from './chart-utils';
import { ChartContext, ChartType } from '../model/chart';

describe('ChartUtils', () => {

   it('#identifyGroupByColumns should return empty array when no numeric column exists in new context', () => {

      // given
      const columns: Column[] = [
         { name: 'Level', dataType: DataType.TEXT, width: 1 },
         { name: 'Host', dataType: DataType.TEXT, width: 1 },
         { name: 'Path', dataType: DataType.TEXT, width: 1 },
      ];
      const context = new ChartContext(columns, ChartType.LINE.type, null);

      // when
      const groupByColumns = ChartUtils.identifyGroupByColumns(context);

      // then
      expect(groupByColumns).toEqual([]);
   });

   it('#identifyGroupByColumns should return NUMBER column when NUMBER column exists in new context', () => {

      // given
      const columns: Column[] = [
         { name: 'Level', dataType: DataType.TEXT, width: 1 },
         { name: 'Host', dataType: DataType.TEXT, width: 1 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 1 }
      ];
      const context = new ChartContext(columns, ChartType.LINE.type, null);

      // when
      const groupByColumns = ChartUtils.identifyGroupByColumns(context);

      // then
      expect(groupByColumns).toEqual([column(columns, 'Amount')]);
   });

   it('#identifyGroupByColumns should return TIME column when TIME column exists in new context', () => {

      // given
      const columns: Column[] = [
         { name: 'Level', dataType: DataType.TEXT, width: 1 },
         { name: 'Time', dataType: DataType.TIME, width: 1 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 1 }
      ];
      const context = new ChartContext(columns, ChartType.LINE.type, null);

      // when
      const groupByColumns = ChartUtils.identifyGroupByColumns(context);

      // then
      expect(groupByColumns).toEqual([column(columns, 'Time')]);
   });

   it('#identifyGroupByColumns should return NUMBER column when TIME column is used as data column in new context', () => {

      // given
      const columns: Column[] = [
         { name: 'Level', dataType: DataType.TEXT, width: 1 },
         { name: 'Time', dataType: DataType.TIME, width: 1 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 1 }
      ];
      const context = new ChartContext(columns, ChartType.LINE.type, null);
      context.dataColumns = [column(columns, 'Time')];

      // when
      const groupByColumns = ChartUtils.identifyGroupByColumns(context);

      // then
      expect(groupByColumns).toEqual([column(columns, 'Amount')]);
   });

   it('#identifyGroupByColumns should return empty array when all numeric columns are used as data columns in new context', () => {

      // given
      const columns: Column[] = [
         { name: 'Level', dataType: DataType.TEXT, width: 1 },
         { name: 'Time', dataType: DataType.TIME, width: 1 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 1 }
      ];
      const context = new ChartContext(columns, ChartType.LINE.type, null);
      context.dataColumns = [column(columns, 'Time'), column(columns, 'Amount'), column(columns, 'Percent')];

      // when
      const groupByColumns = ChartUtils.identifyGroupByColumns(context);

      // then
      expect(groupByColumns).toEqual([]);
   });

   it('#identifyGroupByColumns should return existing group column', () => {

      // given
      const columns: Column[] = [
         { name: 'Level', dataType: DataType.TEXT, width: 1 },
         { name: 'Time', dataType: DataType.TIME, width: 1 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 1 }
      ];
      const context = new ChartContext(columns, ChartType.LINE.type, null);
      context.dataColumns = [column(columns, 'Amount'), column(columns, 'Percent')];
      context.groupByColumns = [column(columns, 'Time')];

      // when
      const groupByColumns = ChartUtils.identifyGroupByColumns(context);

      // then
      expect(groupByColumns).toEqual([column(columns, 'Time')]);
   });

   function column(columns: Column[], name: string): Column {
      return columns.find(c => c.name === name);
   }
});
