import { Aggregation, Column, DataType } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { GroupByColumnSelector } from './group-by-column-selector';

describe('GroupByColumnSelector', () => {

   const UNIQUE_NAME_ENTRIES = [
      { Time: 1, Name: 'a', Level: 'x', Flag: true, Amount: 1, Percent: 10 },
      { Time: 2, Name: 'b', Level: 'x', Flag: false, Amount: 2, Percent: 20 },
      { Time: 3, Name: 'c', Level: 'y', Flag: true, Amount: 3, Percent: 30 }
   ];
   const NON_UNIQUE_NAME_ENTRIES = [
      { Time: 1, Name: 'a', Level: 'x', Flag: true, Amount: 1, Percent: 10 },
      { Time: 1, Name: 'a', Level: 'x', Flag: false, Amount: 2, Percent: 10 },
      { Time: 3, Name: 'c', Level: 'y', Flag: true, Amount: 3, Percent: 30 }
   ];

   let columns: Column[];
   let context: ChartContext;

   beforeEach(() => {
      columns = [
         { name: 'Time', dataType: DataType.TIME, width: 1 },
         { name: 'Name', dataType: DataType.TEXT, width: 1 },
         { name: 'Level', dataType: DataType.TEXT, width: 1 },
         { name: 'Flag', dataType: DataType.BOOLEAN, width: 1 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 1 }
      ];
      context = new ChartContext(columns, ChartType.LINE.type, { top: 0, right: 0, bottom: 0, left: 0 });
      context.entries = UNIQUE_NAME_ENTRIES;
   });

   it('#select should return empty array when count distinct values on BAR chart', () => {

      // given
      setup(ChartType.BAR, [Aggregation.COUNT], ['Amount'], ['Name']);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([]);
   });

   it('#select should keep current TEXT column when count distinct values on LINE chart', () => {

      // given
      setup(ChartType.LINE, [Aggregation.COUNT], ['Amount'], ['Level']);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Level')]);
   });

   it('#select should keep current unique TEXT column when individual values on LINE chart', () => {

      // given
      setup(ChartType.LINE, [], ['Amount'], ['Name']);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Name')]);
   });

   it('#select should replace current non-unique TEXT column by TIME column when individual values on LINE chart', () => {

      // given
      setup(ChartType.LINE, [], ['Amount'], ['Level']);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Time')]);
   });

   it('#select should keep current BOOLEAN column when count distinct values on LINE chart', () => {

      // given
      setup(ChartType.LINE, [Aggregation.COUNT], ['Amount'], ['Flag']);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Flag')]);
   });

   it('#select should keep current BOOLEAN column when individual values on LINE chart', () => {

      // given
      setup(ChartType.LINE, [], ['Amount'], ['Flag']);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Flag')]);
   });

   it('#select should replace current non-unique BOOLEAN column by unique TEXT column when individual values on BAR chart', () => {

      // given
      setup(ChartType.BAR, [], ['Amount'], ['Flag']);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Name')]);
   });

   it('#select should prefer TIME column when no group-by column on LINE chart', () => {

      // given
      setup(ChartType.LINE, [], ['Amount'], []);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Time')]);
   });

   it('#select should select NUMBER column when no TIME column on LINE chart', () => {

      // given
      setup(ChartType.LINE, [], ['Amount', 'Time'], []);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Percent')]);
   });

   it('#select should select TEXT column when count distinct values on LINE chart without numeric column', () => {

      // given
      setup(ChartType.LINE, [Aggregation.COUNT], ['Amount'], []);
      context.splitColumns = [column('Time'), column('Percent')];

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Name')]);
   });

   it('#select should exclude data columns', () => {

      // given
      setup(ChartType.LINE, [], ['Time', 'Amount'], []);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Percent')]);
   });

   it('#select should exclude split columns on LINE chart', () => {

      // given
      setup(ChartType.LINE, [], ['Amount'], []);
      context.splitColumns = [column('Time')];

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Percent')]);
   });

   it('#select should accept split column as name on BAR chart', () => {

      // given
      setup(ChartType.BAR, [], ['Amount'], []);
      context.splitColumns = [column('Name')];

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Name')]);
   });

   it('#select should select unique TEXT column when individual values on BAR chart', () => {

      // given
      context.columns.reverse();
      setup(ChartType.BAR, [], ['Amount'], []);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Name')]);
   });

   it('#select should keep current unique TIME column when individual values on PIE chart', () => {

      // given
      setup(ChartType.PIE, [], ['Amount'], ['Time']);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Time')]);
   });

   it('#select should select TIME column when no unique TEXT column on BAR chart', () => {

      // given
      context.entries = [
         { Time: 1, Name: 'a', Level: 'x', Amount: 1 },
         { Time: 2, Name: 'a', Level: 'x', Amount: 2 }
      ];
      setup(ChartType.BAR, [], ['Amount'], []);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([column('Time')]);
   });

   it('#select should skip unique TEXT column exceeding max values of PIE chart', () => {

      // given
      context.entries = Array.from({ length: 1001 }, (_, i) => ({ Time: 1, Name: 'n' + i, Level: 'x', Amount: i, Percent: i + 1 }));
      setup(ChartType.PIE, [], ['Amount'], []);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([]);
   });

   it('#select should return empty array when individual values on BAR chart without unique name column', () => {

      // given
      context.entries = NON_UNIQUE_NAME_ENTRIES;
      setup(ChartType.BAR, [], ['Amount'], ['Name']);

      // when
      const groupByColumns = new GroupByColumnSelector(context).select();

      // then
      expect(groupByColumns).toEqual([]);
   });

   it('#hasValidColumnForIndividualValues should return true when TIME column on LINE chart', () => {

      // given
      setup(ChartType.LINE, [Aggregation.COUNT], ['Amount'], []);

      // when
      const valid = new GroupByColumnSelector(context).hasValidColumnForIndividualValues();

      // then
      expect(valid).toBe(true);
   });

   it('#hasValidColumnForIndividualValues should return false when no unique name column on BAR chart', () => {

      // given
      context.entries = NON_UNIQUE_NAME_ENTRIES;
      setup(ChartType.BAR, [], ['Amount'], []);

      // when
      const valid = new GroupByColumnSelector(context).hasValidColumnForIndividualValues();

      // then
      expect(valid).toBe(false);
   });

   it('#hasValidColumnForIndividualValues should return true when unique TEXT column on BAR chart with count distinct values', () => {

      // given
      setup(ChartType.BAR, [Aggregation.COUNT], ['Amount'], []);

      // when
      const valid = new GroupByColumnSelector(context).hasValidColumnForIndividualValues();

      // then
      expect(valid).toBe(true);
   });

   it('#hasValidColumnForIndividualValues should evaluate specified data columns', () => {

      // given
      context.entries = NON_UNIQUE_NAME_ENTRIES;
      setup(ChartType.LINE, [], ['Amount'], []);
      const selector = new GroupByColumnSelector(context);

      // when
      const valid = selector.hasValidColumnForIndividualValues([column('Amount'), column('Time'), column('Percent')]);

      // then
      expect(valid).toBe(false);
   });

   function setup(chartType: ChartType, aggregations: Aggregation[], dataColumnNames: string[], groupByColumnNames: string[]): void {
      context.chartType = chartType.type;
      context.dataColumns = dataColumnNames.map(n => column(n));
      context.aggregations = aggregations;
      context.groupByColumns = groupByColumnNames.map(n => column(n));
   }

   function column(name: string): Column {
      return columns.find(c => c.name === name);
   }
});
