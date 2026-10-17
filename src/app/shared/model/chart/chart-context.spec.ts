import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { LanguageService } from 'app/shared/services/language';
import { Aggregation } from '../aggregation.enum';
import { ChangeEvent } from '../change-event.enum';
import { Column } from '../column.type';
import { DataType } from '../data-type.enum';
import { ExportFormat } from '../export-format.enum';
import { ChartContext } from './chart-context';
import { ChartType } from './chart-type';
import { ScaleConfig } from './scale-config';
import { TicksConfig } from './ticks-config';
import type { Mock } from 'vitest';

describe('ChartContext', () => {

   let columns: Column[];
   let context: ChartContext;
   let eventHandlerSpy: Mock;

   beforeAll(() => {
      columns = [
         { name: 'Time', dataType: DataType.TIME, width: 1 },
         { name: 'Location', dataType: DataType.TEXT, width: 1 },
         { name: 'Name', dataType: DataType.TEXT, width: 1 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 1 },
         { name: 'Discount', dataType: DataType.NUMBER, width: 1 }
      ];
   });

   beforeEach(() => {
      context = new ChartContext(columns, ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
      eventHandlerSpy = vi.fn().mockImplementation(e => null);
      context.subscribeToChanges(eventHandlerSpy);
   });

   it('#dataColumns should change valueScales', fakeAsync(() => {

      // when
      context.dataColumns = [columns[3], columns[4]];

      // then
      flush();
      expect(ScaleConfig.toScales(context.valueScales)).toEqual([
         {
            columnName: undefined,
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         }
      ]);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.STRUCTURE);
   }));

   it('#dataColumns should change valueScales when multi axes selected', fakeAsync(() => {
      // given
      context.multiValueAxes = true;
      flush();
      vi.mocked(eventHandlerSpy).mockClear();

      // when
      context.dataColumns = [columns[3], columns[4]];

      // then
      flush();
      expect(ScaleConfig.toScales(context.valueScales)).toEqual([
         {
            columnName: 'Amount',
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         },
         {
            columnName: 'Percent',
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         }
      ]);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.STRUCTURE);
   }));

   it('#addDataColumn first column', fakeAsync(() => {

      // when
      context.addDataColumn(columns[3]);

      // then
      expect(ScaleConfig.toScales(context.valueScales)).toEqual([
         {
            columnName: 'Amount',
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         }
      ]);
   }));

   it('#addDataColumn should buffer scale form previous single selected column', fakeAsync(() => {
      // given
      context.dataColumns = [columns[3]]

      // when
      context.addDataColumn(columns[4]);

      // then
      expect(ScaleConfig.toScales(context.valueScales)).toEqual([
         {
            columnName: undefined,
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         }
      ]);
   }));

   it('#addDataColumn should change valueScales when multi axes selected', fakeAsync(() => {
      // given
      context.multiValueAxes = true;
      context.dataColumns = [columns[3], columns[4]]

      // when
      context.addDataColumn(columns[5]);

      // then
      expect(context.multiValueAxes).toBe(true);
      expect(ScaleConfig.toScales(context.valueScales)).toEqual([
         {
            columnName: 'Amount',
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         },
         {
            columnName: 'Percent',
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         },
         {
            columnName: 'Discount',
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         }
      ]);
   }));

   it('#removeDataColumn should restore valueScales for now single selected column', fakeAsync(() => {
      // given
      context.dataColumns = [columns[3], columns[4]]

      // when
      context.removeDataColumn(columns[4]);

      // then
      expect(ScaleConfig.toScales(context.valueScales)).toEqual([
         {
            columnName: 'Amount',
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         }
      ]);
   }));

   it('#removeDataColumn should change valueScales when multi axes selected', fakeAsync(() => {
      // given
      context.multiValueAxes = true;
      context.dataColumns = [columns[3], columns[4]]

      // when
      context.removeDataColumn(columns[4]);

      // then
      expect(context.multiValueAxes).toBe(false);
      expect(ScaleConfig.toScales(context.valueScales)).toEqual([
         {
            columnName: 'Amount',
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         }
      ]);
   }));

   it('#removeDataColumn should leave one default value scale when last column is removed with multi axes selected', fakeAsync(() => {
      // given
      context.dataColumns = [column('Amount')];
      context.multiValueAxes = true;

      // when
      context.removeDataColumn(column('Amount'));

      // then
      expect(ScaleConfig.toScales(context.valueScales)).toEqual([
         {
            columnName: undefined,
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         }
      ]);
   }));

   it('#removeDataColumn should keep multi axes when one of three columns is removed', fakeAsync(() => {
      // given
      context.multiValueAxes = true;
      context.dataColumns = [column('Amount'), column('Percent'), column('Discount')];

      // when
      context.removeDataColumn(column('Discount'));

      // then
      expect(context.multiValueAxes).toBe(true);
      expect(ScaleConfig.toScales(context.valueScales)).toEqual([
         {
            columnName: 'Amount',
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         },
         {
            columnName: 'Percent',
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         }
      ]);
   }));

   it('#dataColumns should unset multiValueAxes option when single column is set', () => {

      // given
      context.multiValueAxes = true;

      // when
      context.dataColumns = [column('Location')];

      // then
      expect(context.multiValueAxes).toBe(false);
   });

   it('#dataColumns should keep group-by column when text column is set on LINE chart', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.groupByColumns = [column('Time')];

      // when
      context.dataColumns = [column('Location')];

      // then
      expect(context.aggregations).toEqual([Aggregation.COUNT]);
      expect(context.groupByColumns).toEqual([column('Time')]);
   });

   it('#dataColumns should remove group-by columns when text column is set on BAR chart', () => {

      // given
      context.chartType = ChartType.BAR.type;
      context.groupByColumns = [column('Name')];

      // when
      context.dataColumns = [column('Location')];

      // then
      expect(context.aggregations).toEqual([Aggregation.COUNT]);
      expect(context.groupByColumns).toEqual([]);
   });

   it('#dataColumns should select count and remove group-by columns when object column is set on BAR chart', () => {

      // given
      context.chartType = ChartType.BAR.type;
      context.aggregations = [];
      context.groupByColumns = [column('Location')];

      // when
      context.dataColumns = [{ name: 'Details', dataType: DataType.OBJECT, width: 1 }];

      // then
      expect(context.aggregations).toEqual([Aggregation.COUNT]);
      expect(context.groupByColumns).toEqual([]);
   });

   it('#aggregations should keep group-by column when count distinct values is selected on LINE chart', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [column('Amount')];
      context.groupByColumns = [column('Name')];

      // when
      context.aggregations = [Aggregation.COUNT];

      // then
      expect(context.groupByColumns).toEqual([column('Name')]);
   });

   it('#aggregations should identify group-by column when count distinct values is selected on LINE chart without group-by column', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [column('Amount')];
      context.groupByColumns = [];

      // when
      context.aggregations = [Aggregation.COUNT];

      // then
      expect(context.groupByColumns).toEqual([column('Time')]);
   });

   it('#aggregations should remove group-by columns when count distinct values is selected on BAR chart', () => {

      // given
      context.chartType = ChartType.BAR.type;
      context.dataColumns = [column('Amount')];
      context.groupByColumns = [column('Name')];

      // when
      context.aggregations = [Aggregation.COUNT];

      // then
      expect(context.groupByColumns).toEqual([]);
   });

   it('#groupByColumns should restore base scale of selected column', fakeAsync(() => {

      // given
      context.groupByColumns = [columns[1]];
      context.baseScale.ticks.rotation = 45;
      context.groupByColumns = [columns[0]];

      // when
      context.groupByColumns = [columns[1]];

      // then
      expect(context.baseScale.toScale()).toEqual({
         columnName: 'Location',
         ticks: {
            stepSize: undefined,
            rotation: 45
         }
      });
   }));

   it('#legendPosition should not fire look change event when legendPosition is not changed', fakeAsync(() => {

      // given
      context.legendPosition = 'right';
      flush();
      vi.mocked(eventHandlerSpy).mockClear();

      // when
      context.legendPosition = 'right';
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#legendPosition should fire look change event when legendPosition is changed', fakeAsync(() => {

      // when
      context.legendPosition = 'left';

      // then
      flush();
      expect(context.legendPosition).toBe('left');
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#legendPosition should not fire look change event when legendPosition is changed but legend is not shown', fakeAsync(() => {

      // given
      context.showLegend = false;
      flush();
      vi.mocked(eventHandlerSpy).mockClear();

      // when      
      context.legendPosition = 'left';

      // then
      flush();
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#showLegend should not fire look change event when value is not changed', fakeAsync(() => {

      // given
      context.showLegend = false;
      flush();
      vi.mocked(eventHandlerSpy).mockClear();

      // when
      context.showLegend = false;

      // then
      flush();
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#showLegend should fire look change event when value is changed', fakeAsync(() => {

      // when
      const initialValue = context.showLegend;
      context.showLegend = !initialValue;
      flush();

      // then
      expect(context.showLegend).toBe(!initialValue);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#valueAsPercent should not fire look change event when value is not changed', fakeAsync(() => {

      // given
      context.valueAsPercent = false;
      flush();
      vi.mocked(eventHandlerSpy).mockClear();

      // when
      context.valueAsPercent = false;

      // then
      flush();
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#valueAsPercent should fire look change event when value is changed', fakeAsync(() => {

      // given
      const initialValue = context.valueAsPercent;

      // when
      context.valueAsPercent = !initialValue;

      // then
      flush();
      expect(context.valueAsPercent).toBe(!initialValue);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#baseScale should not fire look change event when scale did not change', fakeAsync(() => {

      // when
      context.baseScale = scaleConfig();

      // then
      flush();
      expect(context.baseScale.toScale()).toEqual({
         columnName: undefined,
         ticks: {
            stepSize: undefined,
            rotation: undefined
         }
      });
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#baseScale should fire look change event when scale changed', fakeAsync(() => {

      // when
      context.baseScale = scaleConfig(undefined, 2);

      // then
      flush();
      expect(context.baseScale.toScale()).toEqual({
         columnName: undefined,
         ticks: {
            stepSize: 2,
            rotation: undefined
         }
      });
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#baseScale#ticks should fire look change event', fakeAsync(() => {

      // when
      context.baseScale.ticks = new TicksConfig(() => context.fireLookChanged(), { rotation: 45 });

      // then
      flush();
      expect(context.baseScale.toScale()).toEqual({
         columnName: undefined,
         ticks: {
            stepSize: undefined,
            rotation: 45
         }
      });
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#valueScales should not fire look change event when scales did not change', fakeAsync(() => {

      // given
      context.dataColumns = [columns[3]];
      flush();
      vi.mocked(eventHandlerSpy).mockClear();

      // when
      context.valueScales = [scaleConfig('Amount')];

      // then
      flush();
      expect(ScaleConfig.toScales(context.valueScales)).toEqual([{
         columnName: 'Amount',
         ticks: {
            stepSize: undefined,
            rotation: undefined
         }
      }]);
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#valueScales should fire look change event when value scales changed', fakeAsync(() => {

      // given
      context.dataColumns = [columns[3]];
      flush();
      vi.mocked(eventHandlerSpy).mockClear();

      // when
      context.valueScales = [scaleConfig('X', 2)];

      // then
      flush();
      expect(ScaleConfig.toScales(context.valueScales)).toEqual([{
         columnName: 'X',
         ticks: {
            stepSize: 2,
            rotation: undefined
         }
      }]);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#valueScales#ticks should fire look change event', fakeAsync(() => {

      // given
      context.multiValueAxes = true;
      context.dataColumns = [columns[3], columns[4]];
      flush();
      vi.mocked(eventHandlerSpy).mockClear();

      // when
      context.valueScales[0].ticks = new TicksConfig(() => context.fireLookChanged(), { rotation: 45 });

      // then
      flush();
      expect(ScaleConfig.toScales(context.valueScales)).toEqual([
         {
            columnName: 'Amount',
            ticks: {
               stepSize: undefined,
               rotation: 45
            }
         },
         {
            columnName: 'Percent',
            ticks: {
               stepSize: undefined,
               rotation: undefined
            }
         }
      ]);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#stacked should return false when chart is unknown', () => {

      // given
      context.chart = undefined;

      // when
      const stacked = context.stacked;

      // then
      expect(stacked).toBe(false);
   });

   it('#stacked should fire structure change event', fakeAsync(() => {

      // when
      context.stacked = true;

      // then
      flush();
      expect(context.stacked).toBe(true);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.STRUCTURE);
   }));

   it('#stacked(true) should unset multiValueAxes option', fakeAsync(() => {

      // given
      context.multiValueAxes = true;

      // when
      context.stacked = true;

      // then
      flush();
      expect(context.multiValueAxes).toBe(false);
   }));

   it('#multiValueAxes(true) should fire structure change event', fakeAsync(() => {

      // when
      context.multiValueAxes = true;

      // then
      flush();
      expect(context.multiValueAxes).toBe(true);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.STRUCTURE);
   }));

   it('#multiValueAxes(false) should fire structure change event', fakeAsync(() => {
      // given
      context.multiValueAxes = true;
      flush();
      vi.mocked(eventHandlerSpy).mockClear();

      // when
      context.multiValueAxes = false;

      // then
      flush();
      expect(context.multiValueAxes).toBe(false);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.STRUCTURE);
   }));

   it('#multiValueAxes(true) should unset stacked option', fakeAsync(() => {

      // given
      context.stacked = true;

      // when
      context.multiValueAxes = true;

      // then
      flush();
      expect(context.stacked).toBe(false);
   }));

   it('#multiValueAxes(false) should not fire change event when value did not change', fakeAsync(() => {

      // when
      context.multiValueAxes = false;

      // then
      flush();
      expect(context.multiValueAxes).toBe(false);
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#set splitColumns should unset multiValueAxes option', fakeAsync(() => {

      // given
      context.multiValueAxes = true;
      flush();
      vi.mocked(eventHandlerSpy).mockClear();

      // when
      context.splitColumns = [columns[1]];

      // then
      flush();
      expect(context.multiValueAxes).toBe(false);
      expect(context.splitColumns).toEqual([columns[1]]);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.STRUCTURE);
   }));

   it('#getTitle when no data column defined', () => {
      expect(context.getTitle()).toBe('Data: to be defined');
   });

   it('#getTitle when individual values of single data column', () => {

      // given
      context.dataColumns = [column('Amount')];
      context.aggregations = [];

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('Amount by Location');
   });

   it('#getTitle when count distinct values of single data column', () => {

      // given
      context.dataColumns = [column('Amount')];
      context.aggregations = [Aggregation.COUNT];

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('Count distinct values of Amount');
   });

   it('#getTitle when count distincat values of two columns from grouping chart', () => {

      // given
      context.chartType = ChartType.LINE.type;
      context.dataColumns = [column('Amount'), column('Percent')];
      context.groupByColumns = [column('Time')];
      context.aggregations = [Aggregation.COUNT];

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('Count distinct values of Amount, Percent by Time');
   });

   it('#getTitle when individual values of two columns grouped by time', () => {

      // given
      context.dataColumns = [column('Amount'), column('Percent')];
      context.groupByColumns = [column('Time')];
      context.aggregations = [];

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('Amount, Percent by Time');
   });

   it('#getTitle when sampled down', () => {

      // given
      context.dataColumns = [column('Amount')];
      context.groupByColumns = [column('Time')];
      context.dataSampledDown = true;

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('Amount by Time (Sample)');
   });

   it('#getTitle when user-defined', () => {

      // given
      context.title = 'test title';

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('test title');
   });

   it('#getTitle when single grouping with split columns', () => {

      // given
      context.chartType = ChartType.AREA.type;
      context.dataColumns = [column('Percent')];
      context.splitColumns = [column('Name'), column('Amount')];
      context.groupByColumns = [column('Time')];

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('Percent by Time\nsplit by Name ⯈ Amount');
   });

   it('#getTitle should follow current language', async () => {

      // given
      vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
      context.chartType = ChartType.AREA.type;
      context.dataColumns = [column('Percent')];
      context.splitColumns = [column('Name')];
      context.groupByColumns = [column('Time')];
      context.dataSampledDown = true;

      // when
      await TestBed.inject(LanguageService).use('de');

      // then
      expect(context.getTitle()).toBe('Percent nach Time (Stichprobe)\naufgeteilt nach Name');
      document.documentElement.lang = 'en';
   });

   it('#getSupportedExportFormats should return PNG', () => {
      expect(context.getSupportedExportFormats()).toEqual([ExportFormat.PNG]);
   });

   function scaleConfig(columnName?: string, stepSize?: number, rotation?: number): ScaleConfig {
      return new ScaleConfig(() => null, {
         columnName,
         ticks: { stepSize, rotation }
      });
   }

   function column(name: string): Column {
      return columns.find(c => c.name === name);
   }
});
