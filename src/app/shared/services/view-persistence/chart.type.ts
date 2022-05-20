import { Margin } from 'app/shared/model/chart';
import { ViewElement } from '../../model/view-config/view-element.type';

export interface Chart extends ViewElement {
   chartType: string;
   margin: Margin;
   showLegend: boolean;
   legendPosition: string;
   xLabelRotation: number;
   stacked: boolean;
}
