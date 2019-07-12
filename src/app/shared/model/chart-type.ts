import { GroupingType } from './grouping-type.enum';

export class ChartType {

   static readonly PIE = new ChartType('Pie', 'pieChart', GroupingType.NONE, 'pie_chart', false, 200);
   static readonly DONUT = new ChartType('Donut', 'donutChart', GroupingType.NONE, 'donut_small', false, 200);
   static readonly BAR = new ChartType('Bar', 'discreteBarChart', GroupingType.NONE, 'bar_chart', false, 150);
   static readonly MULTI_BAR = new ChartType('Grouped Bar', 'multiBarChart', GroupingType.SINGLE, 'grouped_bar_chart', true, 200);
   static readonly MULTI_HORIZONTAL_BAR = new ChartType('Grouped Horizontal Bar', 'multiBarHorizontalChart',
      GroupingType.SINGLE, 'grouped_horizontal_bar_chart', true, 200);
   static readonly LINE = new ChartType('Line', 'lineChart', GroupingType.SINGLE, 'timeline', false, undefined);
   static readonly LINE_WITH_FOCUS = new ChartType('Zoomable Line', 'lineWithFocusChart', GroupingType.SINGLE, 'zoomable_line_chart',
      true, undefined);
   static readonly AREA = new ChartType('Area', 'areaChart', GroupingType.SINGLE, 'area_chart', true, undefined);
   static readonly SCATTER = new ChartType('Scatter', 'scatterChart', GroupingType.SINGLE, 'scatter_plot', false, undefined);
   static readonly SUNBURST = new ChartType('Sunburst', 'sunburstChart', GroupingType.MULTIPLE, 'wb_sunny', false, undefined);

   static readonly ALL = [
      ChartType.PIE,
      ChartType.DONUT,
      ChartType.BAR,
      ChartType.MULTI_BAR,
      ChartType.MULTI_HORIZONTAL_BAR,
      ChartType.LINE,
      ChartType.LINE_WITH_FOCUS,
      ChartType.AREA,
      ChartType.SCATTER,
      ChartType.SUNBURST
   ];

   static fromType(type: string): ChartType {
      for (const chartType of ChartType.ALL) {
         if (chartType.type === type) {
            return chartType;
         }
      }
      return null;
   }

   constructor(readonly name: string, readonly type: string, readonly groupingType: GroupingType,
      readonly icon: string, readonly customIcon: boolean, readonly maxValues: number) { }
}
