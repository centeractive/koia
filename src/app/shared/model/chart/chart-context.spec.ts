import { fakeAsync, flush } from '@angular/core/testing';
import { Aggregation } from '../aggregation.enum';
import { ChangeEvent } from '../change-event.enum';
import { Column } from '../column.type';
import { DataType } from '../data-type.enum';
import { ExportFormat } from '../export-format.enum';
import { ChartContext } from './chart-context';
import { ChartType } from './chart-type';

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

   it('#xLabelStepSize should not fire look change event when xLabelStepSize is not changed', fakeAsync(() => {

      // given
      context.xLabelStepSize = 10;
      flush();
      eventHandlerSpy.calls.reset();

      // when
      context.xLabelStepSize = 10;

      // then
      flush();
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#xLabelStepSize should fire look change event when xLabelStepSize is changed', fakeAsync(() => {

      // when
      context.xLabelStepSize = 5;

      // then
      flush();
      expect(context.xLabelStepSize).toBe(5);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#xLabelRotation should not fire look change event when xLabelRotation is not changed', fakeAsync(() => {

      // given
      context.xLabelRotation = 45;
      flush();
      eventHandlerSpy.calls.reset();

      // when
      context.xLabelRotation = 45;

      // then
      flush();
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#xLabelRotation should fire look change event when xLabelRotation is changed', fakeAsync(() => {

      // when
      context.xLabelRotation = 20;

      // then
      flush();
      expect(context.xLabelRotation).toBe(20);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#yLabelStepSize should not fire look change event when yLabelStepSize is not changed', fakeAsync(() => {

      // given
      context.yLabelStepSize = 10;
      flush();
      eventHandlerSpy.calls.reset();

      // when
      context.yLabelStepSize = 10;

      // then
      flush();
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#yLabelStepSize should fire look change event when yLabelStepSize is changed', fakeAsync(() => {

      // when
      context.yLabelStepSize = 5;

      // then
      flush();
      expect(context.yLabelStepSize).toBe(5);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#yLabelRotation should not fire look change event when yLabelRotation is not changed', fakeAsync(() => {

      // given
      context.yLabelRotation = 45;
      flush();
      eventHandlerSpy.calls.reset();

      // when
      context.yLabelRotation = 45;

      // then
      flush();
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#yLabelRotation should fire look change event when yLabelRotation is changed', fakeAsync(() => {

      // when
      context.yLabelRotation = 20;

      // then
      flush();
      expect(context.yLabelRotation).toBe(20);
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
