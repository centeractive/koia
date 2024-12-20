export class ChartType {

   static readonly PIE = new ChartType('Pie', 'pie', 'pie_chart', false, 1000);
   static readonly DOUGHNUT = new ChartType('Doughnut', 'doughnut', 'donut_small', false, 1000);
   static readonly BAR = new ChartType('Bar', 'bar', 'bar_chart', false, 5000);
   static readonly LINEAR_BAR = new ChartType('Linear Bar', 'linearBar', 'linear_bar_chart', true);
   static readonly HORIZONTAL_BAR = new ChartType('Horizontal Bar', 'horizontalBar', 'horizontal_bar_chart', true, 5000);
   static readonly LINEAR_HORIZONTAL_BAR = new ChartType('Linear Horizontal Bar', 'linearHorizontalBar', 'linear_horizontal_bar_chart', true);
   static readonly RADAR = new ChartType('Radar', 'radar', 'radar_chart', false, 1000);
   static readonly POLAR_AREA = new ChartType('Polar Area', 'polarArea', 'polar_area_chart', true, 1000);
   static readonly LINE = new ChartType('Line', 'line', 'timeline', false);
   static readonly AREA = new ChartType('Area', 'area', 'area_chart', true);
   static readonly SCATTER = new ChartType('Scatter', 'scatter', 'scatter_plot', false);

   static readonly ALL = [
      ChartType.PIE,
      ChartType.DOUGHNUT,
      ChartType.BAR,
      ChartType.LINEAR_BAR,
      ChartType.HORIZONTAL_BAR,
      ChartType.LINEAR_HORIZONTAL_BAR,
      ChartType.RADAR,
      ChartType.POLAR_AREA,
      ChartType.LINE,
      ChartType.AREA,
      ChartType.SCATTER
   ];

   static readonly CIRCULAR = [ChartType.PIE, ChartType.DOUGHNUT, ChartType.RADAR, ChartType.POLAR_AREA];
   static readonly CATEGORY = [ChartType.PIE, ChartType.DOUGHNUT, ChartType.BAR, ChartType.HORIZONTAL_BAR, ChartType.RADAR, ChartType.POLAR_AREA];
   static readonly LINEAR = [ChartType.LINEAR_BAR, ChartType.LINEAR_HORIZONTAL_BAR, ChartType.LINE, ChartType.AREA, ChartType.SCATTER];
   static readonly HORIZONTAL = [ChartType.HORIZONTAL_BAR, ChartType.LINEAR_HORIZONTAL_BAR];

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
            return ChartType.BAR;
         case ('multiBarChart'):
            return ChartType.LINEAR_BAR;
         case ('multiBarHorizontalChart'):
            return ChartType.LINEAR_HORIZONTAL_BAR;
         case ('lineChart'):
         case ('lineWithFocusChart'):
            return ChartType.LINE;
         case ('areaChart'):
            return ChartType.AREA;
         case ('scatterChart'):
            return ChartType.SCATTER;
         case ('sunburstChart'):
            throw new Error('Sunburst chart does no longer exist in this Koia version');
         default:
            throw new Error('unknown chart type ' + type);
      }
   }

   constructor(readonly name: string, readonly type: string, readonly icon: string,
      readonly customIcon: boolean, readonly maxValues?: number) { }

   static isCircularChart(chartType: ChartType): boolean {
      return ChartType.CIRCULAR.includes(chartType);
   }

   static isCategoryChart(chartType: ChartType): boolean {
      return ChartType.CATEGORY.includes(chartType);
   }

   static isLinearChart(chartType: ChartType): boolean {
      return ChartType.LINEAR.includes(chartType);
   }

   static isHorizontalChart(chartType: ChartType): boolean {
      return ChartType.HORIZONTAL.includes(chartType);
   }

   static isSameCategory(chartType1: ChartType, chartType2: ChartType): boolean {
      return (ChartType.isCircularChart(chartType1) && ChartType.isCircularChart(chartType2)) ||
         (ChartType.isCategoryChart(chartType1) && ChartType.isCategoryChart(chartType2)) ||
         (ChartType.isLinearChart(chartType1) && ChartType.isLinearChart(chartType2)) ||
         (ChartType.isHorizontalChart(chartType1) && ChartType.isHorizontalChart(chartType2));
   }

}
