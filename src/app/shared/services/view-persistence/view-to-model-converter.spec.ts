import { Aggregation, Column, DataType } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { ElementType, ViewElement } from 'app/shared/model/view-config';
import { Chart } from './chart.type';
import { ViewToModelConverter } from './view-to-model-converter';

describe('ViewToModelConverter', () => {

   const columns: Column[] = [
      { name: 'Time', dataType: DataType.TIME, width: 100 },
      { name: 'Level', dataType: DataType.TEXT, width: 60 },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70 }
   ];
   const converter = new ViewToModelConverter(columns);

   it('#convert should throw error when element type is unknown', () => {

      // given
      const viewElement = { elementType: 99 as ElementType } as ViewElement;

      // when
      const convert = () => converter.convert([viewElement]);

      // then
      expect(convert).toThrow('view element of type 99 not yet implemented');
   });

   it('#convert should leave value scales undefined when chart has no value scales', () => {

      // given
      const chart: Chart = {
         elementType: ElementType.CHART, title: 'Test Chart', gridColumnSpan: 1, gridRowSpan: 1, width: 600, height: 600,
         dataColumns: [columns[2]], splitColumns: [], groupByColumns: [columns[1]], aggregations: [Aggregation.SUM],
         valueGroupings: [], chartType: 'barChart', margin: { top: 1, right: 2, bottom: 3, left: 4 }, showLegend: true,
         legendPosition: 'top', baseScale: undefined, valueScales: undefined, stacked: false, multiValueAxes: false,
         colorOptions: undefined
      };

      // when
      const contexts = converter.convert([chart]);

      // then
      const context = contexts[0] as ChartContext;
      expect(context).toBeInstanceOf(ChartContext);
      expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
      expect(context.valueScales).toBeUndefined();
   });
});
