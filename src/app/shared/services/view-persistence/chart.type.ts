import { Margin, Ticks } from 'app/shared/model/chart';
import { ViewElement } from 'app/shared/model/view-config';

export interface Chart extends ViewElement {
   chartType: string;
   margin: Margin;
   showLegend: boolean;
   legendPosition: string;
   baseTicks: Ticks;
   valueTicks: Ticks;
   stacked: boolean;
}
