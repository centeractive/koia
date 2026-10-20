import { SummaryContext } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';

export interface ViewLauncherContext {
   loading: boolean;
   addSummaryTable(): SummaryContext;
   addChart(): ChartContext;
   addGraph(): GraphContext;
   canGenerateDashboard(): boolean;
   generateDashboard(): void;
}
