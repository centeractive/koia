export enum Aggregation {
   COUNT = 'Count',
   AVG = 'Average',
   MEDIAN = 'Median',
   MAX = 'Max',
   MIN = 'Min',
   SUM = 'Sum',
   ROW_COUNT = 'Row Count'
}

export const VALUE_AGGREGATIONS: readonly Aggregation[] = [Aggregation.AVG, Aggregation.MEDIAN, Aggregation.MAX, Aggregation.MIN,
   Aggregation.SUM];
