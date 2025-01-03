import { fakeAsync, flush } from '@angular/core/testing';
import { Aggregation } from '../aggregation.enum';
import { ChangeEvent } from '../change-event.enum';
import { Column } from '../column.type';
import { DataType } from '../data-type.enum';
import { ExportFormat } from '../export-format.enum';
import { ChartContext } from './chart-context';
import { ChartType } from './chart-type';
import { ScaleConfig } from './scale-config';
import { TicksConfig } from './ticks-config';

describe('ChartContext', () => {

   let columns: Column[];
   let context: ChartContext;
   let eventHandlerSpy: jasmine.Spy;

   beforeAll(() => {
      columns = [
         { name: 'Time', dataType: DataType.TIME, width: 1 },
         { name: 'Location', dataType: DataType.TEXT, width: 1 },
         { name: 'Name', dataType: DataType.TEXT, width: 1 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 1 }
      ];
   });

   beforeEach(() => {
      context = new ChartContext(columns, ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
      eventHandlerSpy = jasmine.createSpy('eventHandler').and.callFake(e => null);
      context.subscribeToChanges(eventHandlerSpy);
   });

   it('#dataColumns should change valueScales', fakeAsync(() => {

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

   it('#legendPosition should not fire look change event when legendPosition is not changed', fakeAsync(() => {

      // given
      context.legendPosition = 'right';
      flush();
      eventHandlerSpy.calls.reset();

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
      eventHandlerSpy.calls.reset();

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
      eventHandlerSpy.calls.reset();

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
      eventHandlerSpy.calls.reset();

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
      eventHandlerSpy.calls.reset();

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
      eventHandlerSpy.calls.reset();

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
      context.dataColumns = [columns[3]];
      flush();
      eventHandlerSpy.calls.reset();

      // when
      context.valueScales[0].ticks = new TicksConfig(() => context.fireLookChanged(), { rotation: 45 });

      // then
      flush();
      expect(ScaleConfig.toScales(context.valueScales)).toEqual([{
         columnName: 'Amount',
         ticks: {
            stepSize: undefined,
            rotation: 45
         }
      }]);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#stacked should return false when chart is unknown', () => {

      // given
      context.chart = undefined;

      // when/then
      expect(context.stacked).toBeFalse();
   });

   it('#stacked should fire structure change event', fakeAsync(() => {

      // when
      context.stacked = true;

      // then
      flush();
      expect(context.stacked).toBeTrue();
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
      expect(context.multiValueAxes).toBeFalse();
   }));

   it('#multiValueAxes should fire structure change event', fakeAsync(() => {

      // when
      context.multiValueAxes = true;

      // then
      flush();
      expect(context.multiValueAxes).toBeTrue();
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
      expect(context.stacked).toBeFalse();
   }));

   it('#multiValueAxes should not fire change event when value did not change', fakeAsync(() => {

      // when
      context.multiValueAxes = false;

      // then
      flush();
      expect(context.multiValueAxes).toBeFalse();
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#set splitColumns should unset multiValueAxes option', fakeAsync(() => {

      // given
      context.multiValueAxes = true;
      flush();
      eventHandlerSpy.calls.reset();

      // when
      context.splitColumns = [columns[1]];

      // then
      flush();
      expect(context.multiValueAxes).toBeFalse();
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
      expect(title).toBe('Count distinct values of Amount, Percent');
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
