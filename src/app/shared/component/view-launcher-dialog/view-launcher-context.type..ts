import { SummaryContext } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { View } from 'app/shared/model/view-config';

export interface ViewLauncherContext {
   views: View[];
   loading: boolean;
   loadView(view: View): void;
   addSummaryTable(): SummaryContext;
   addChart(): ChartContext;
   addGraph(): GraphContext;
   canGenerateDashboard(): boolean;
   generateDashboard(): void;
}
