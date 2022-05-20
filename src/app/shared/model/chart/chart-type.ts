export class ChartType {

   static readonly PIE = new ChartType('Pie', 'pie', 'pie_chart', false, 1000);
   static readonly DOUGHNUT = new ChartType('Doughnut', 'doughnut', 'donut_small', false, 1000);
   static readonly BAR = new ChartType('Bar', 'bar', 'bar_chart', false, 5000);
   static readonly HORIZONTAL_BAR = new ChartType('Horizontal Bar', 'horizontalBar', 'horizontal_bar_chart', true, 5000);
   static readonly RADAR = new ChartType('Radar', 'radar', 'radar_chart', false, 1000);
   static readonly POLAR_AREA = new ChartType('Polar Area', 'polarArea', 'polar_area_chart', true, 1000);
   static readonly LINE = new ChartType('Line', 'line', 'timeline', false);
   static readonly AREA = new ChartType('Area', 'area', 'area_chart', true);
   static readonly SCATTER = new ChartType('Scatter', 'scatter', 'scatter_plot', false);

   static readonly ALL = [
      ChartType.PIE,
      ChartType.DOUGHNUT,
      ChartType.BAR,
      ChartType.HORIZONTAL_BAR,
      ChartType.RADAR,
      ChartType.POLAR_AREA,
      ChartType.LINE,
      ChartType.AREA,
      ChartType.SCATTER
   ];

   static fromType(type: string): ChartType {
      for (const chartType of ChartType.ALL) {
         if (chartType.type === type) {
            return chartType;
         }
      }
      return this.fromOldType(type);
   }

   /**
    * tries to deduct the chart type from the former nvd3 type for backward compatibility
    */
   private static fromOldType(type: string): ChartType {
      switch (type) {
         case ('pieChart'):
            return ChartType.PIE;
         case ('donutChart'):
            return ChartType.DOUGHNUT;
         case ('discreteBarChart'):
         case ('multiBarChart'):
            return ChartType.BAR;
         case ('multiBarHorizontalChart'):
            return ChartType.HORIZONTAL_BAR;
         case ('lineChart'):
         case ('lineWithFocusChart'):
            return ChartType.LINE;
         case ('areaChart'):
            return ChartType.AREA;
         case ('scatterChart'):
            return ChartType.SCATTER;
         case ('sunburstChart'):
            throw new Error('Sunburst chart does no longer exist in the current Koia version');
         default:
            throw new Error('unknown chart type ' + type);
      }
   }

   constructor(readonly name: string, readonly type: string, readonly icon: string,
      readonly customIcon: boolean, readonly maxValues?: number) { }

   static isCircularChart(chartType: ChartType): boolean {
      return chartType === ChartType.PIE || chartType === ChartType.DOUGHNUT ||
         chartType === ChartType.RADAR || chartType === ChartType.POLAR_AREA;
   }

   static isCategoryChart(chartType: ChartType): boolean {
      return chartType === ChartType.PIE || chartType === ChartType.DOUGHNUT ||
         chartType === ChartType.BAR || chartType === ChartType.HORIZONTAL_BAR ||
         chartType === ChartType.RADAR || chartType === ChartType.POLAR_AREA;
   }
}
