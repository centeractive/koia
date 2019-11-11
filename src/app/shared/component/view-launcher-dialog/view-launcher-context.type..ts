import { SummaryContext, GraphContext } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { View } from 'app/shared/model/view-config';

export interface ViewLauncherContext {

   findViews(): View[];

   loadView(view: View): void;

   addSummaryTable(): SummaryContext;

   addChart(): ChartContext;

   addGraph(): GraphContext;
}
