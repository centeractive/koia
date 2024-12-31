import { fakeAsync, flush } from '@angular/core/testing';
import { Aggregation } from '../aggregation.enum';
import { ChangeEvent } from '../change-event.enum';
import { Column } from '../column.type';
import { DataType } from '../data-type.enum';
import { ExportFormat } from '../export-format.enum';
import { ChartContext } from './chart-context';
import { ChartType } from './chart-type';
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

   it('#baseTicks should not fire look change event when base ticks did not change', fakeAsync(() => {

      // when
      context.baseTicks = new TicksConfig(() => context.fireLookChanged(), {});

      // then
      flush();
      expect(context.baseTicks.toTicks()).toEqual({ stepSize: undefined, rotation: undefined });
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#baseTicks should fire look change event when base ticks changed', fakeAsync(() => {

      // when
      context.baseTicks = new TicksConfig(() => context.fireLookChanged(), { stepSize: 2 });

      // then
      flush();
      expect(context.baseTicks.toTicks()).toEqual({ stepSize: 2, rotation: undefined });
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#baseTicks#stepSize should fire look change event', fakeAsync(() => {

      // when
      context.baseTicks.stepSize = 10;

      // then
      flush();
      expect(context.baseTicks.toTicks()).toEqual({ stepSize: 10, rotation: undefined });
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#valueTicks should not fire look change event when value ticks did not change', fakeAsync(() => {

      // when
      context.valueTicks = new TicksConfig(() => context.fireLookChanged(), {});

      // then
      flush();
      expect(context.valueTicks.toTicks()).toEqual({ stepSize: undefined, rotation: undefined });
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#valueTicks should fire look change event when value ticks changed', fakeAsync(() => {

      // when
      context.valueTicks = new TicksConfig(() => context.fireLookChanged(), { stepSize: 2 });

      // then
      flush();
      expect(context.valueTicks.toTicks()).toEqual({ stepSize: 2, rotation: undefined });
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#valueTicks#stepSize should fire look change event', fakeAsync(() => {

      // when
      context.valueTicks.stepSize = 10;

      // then
      flush();
      expect(context.valueTicks.toTicks()).toEqual({ stepSize: 10, rotation: undefined });
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#stacked should return false when chart is unknown', () => {

      // given
      context.chart = undefined;

      // when/then
      expect(context.stacked).toBeFalse();
   });

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

   function column(name: string): Column {
      return columns.find(c => c.name === name);
   }
});
