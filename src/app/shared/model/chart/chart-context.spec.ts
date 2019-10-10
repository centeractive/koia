import { fakeAsync, flush } from '@angular/core/testing';
import { ChangeEvent } from '../change-event.enum';
import { Column } from '../column.type';
import { DataType } from '../data-type.enum';
import { ChartContext } from './chart-context';
import { ChartType } from './chart-type';
import { ExportFormat } from '../export-format.enum';
import { Aggregation } from '../aggregation.enum';

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

      // when
      context.legendPosition = context.legendPosition;
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#legendPosition should fire look change event when legendPosition is changed', fakeAsync(() => {

      // when
      context.legendPosition = 'test';
      flush();

      // then
      expect(context.legendPosition).toBe('test');
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#showLegend should not fire look change event when value is not changed', fakeAsync(() => {

      // when
      context.showLegend = context.showLegend;
      flush();

      // then
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

      // when
      context.valueAsPercent = context.valueAsPercent;
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#valueAsPercent should fire look change event when value is changed', fakeAsync(() => {

      // when
      const initialValue = context.valueAsPercent;
      context.valueAsPercent = !initialValue;
      flush();

      // then
      expect(context.valueAsPercent).toBe(!initialValue);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#xLabelRotation should not fire look change event when xLabelRotation is not changed', fakeAsync(() => {

      // when
      context.xLabelRotation = context.xLabelRotation;
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#xLabelRotation should fire look change event when xLabelRotation is changed', fakeAsync(() => {

      // when
      context.xLabelRotation = 99;
      flush();

      // then
      expect(context.xLabelRotation).toBe(99);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#stacked should return false when chart is unknown', () => {

      // given
      context.chart = undefined;

      // when/then
      expect(context.stacked).toBeFalsy();
   });

   it('#stacked should return false when non-multibar chart', () => {

      // given
      context.chart = { pie: { }};

      // when/then
      expect(context.stacked).toBeFalsy();
   });

   it('#stacked should return true when stacked multibar', () => {

      // given
      context.chart = { multibar: { stacked: () => true }};

      // when/then
      expect(context.stacked).toBeTruthy();
   });

   it('#stacked should return false when non-stacked multibar', () => {

      // given
      context.chart = { multibar: { stacked: () => false }};

      // when/then
      expect(context.stacked).toBeFalsy();
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
      expect(title).toBe('Amount');
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
      expect(title).toBe('Count distinct values of Amount (Sample)');
   });

   it('#getTitle when user-defined', () => {

      // given
      context.title = 'test title';

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('test title');
   });

   it('#getSupportedExportFormats should return PNG', () => {
      expect(context.getSupportedExportFormats()).toEqual([ExportFormat.PNG]);
   });

   function column(name: string): Column {
      return columns.find(c => c.name === name);
   }
});
