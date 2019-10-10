import { ChartType } from './chart-type';

describe('ChartType', () => {

   it('#fromType should return undefined when type is unknown', () => {
      expect(ChartType.fromType('x')).toBeUndefined();
   });

   it('#fromType should return distinct chart type for each type', () => {

      const chartTypes: ChartType[] = [];
      for (const type of ChartType.ALL.map(ct => ct.type)) {

         // when
         const chartType = ChartType.fromType(type);

         // then
         expect(chartType).toBeDefined();
         if (chartTypes.includes(chartType)) {
            fail(type + ' returns same chart type as other type');
         } else {
            chartTypes.push(chartType);
         }
      }
   });
});
