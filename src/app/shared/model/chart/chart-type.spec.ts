import { ChartType } from './chart-type';

describe('ChartType', () => {

   it('#fromType should return distinct chart type for each type', () => {

      const chartTypes: ChartType[] = [];
      ChartType.ALL.map(ct => ct.type)
         .forEach(t => {

            // when
            const chartType = ChartType.fromType(t);

            // then
            expect(chartType).toBeDefined();
            expect(chartType.type).toBe(t);
            if (chartTypes.includes(chartType)) {
               fail(t + ' returns same chart type as other type');
            } else {
               chartTypes.push(chartType);
            }
         });
   });

   it('#fromType should return chart type derived from old nvd3 type', () => {
      const oldNvd3Types = ['pieChart', 'donutChart', 'discreteBarChart', 'multiBarChart',
         'multiBarHorizontalChart', 'lineChart', 'lineWithFocusChart', 'areaChart']

      oldNvd3Types.forEach(t => expect(ChartType.fromType(t)).toBeDefined());
   });

   it('#fromType should throw error when type is unknown', () => {
      expect(() => ChartType.fromType('x')).toThrowError('unknown chart type x');
   });

   it('#fromType should throw error when type is no longer supported', () => {
      expect(() => ChartType.fromType('sunburstChart'))
         .toThrowError('Sunburst chart does no longer exist in the current Koia version');
   });
});
