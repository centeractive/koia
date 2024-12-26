import { Margin } from 'app/shared/model/chart';
import { ViewElement } from 'app/shared/model/view-config';

export interface Chart extends ViewElement {
   chartType: string;
   margin: Margin;
   showLegend: boolean;
   legendPosition: string;
   xLabelStepSize: number;
   xLabelRotation: number;
   yLabelStepSize: number;
   yLabelRotation: number;
   stacked: boolean;
}
