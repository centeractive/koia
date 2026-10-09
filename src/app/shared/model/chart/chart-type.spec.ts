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
               throw new Error(t + ' returns same chart type as other type');
            } else {
               chartTypes.push(chartType);
            }
         });
   });

   it('#fromType should throw error when type is unknown', () => {
      expect(() => ChartType.fromType('x')).toThrow(expect.objectContaining({ message: 'unknown chart type x' }));
   });

});
