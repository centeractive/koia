import { Margin } from 'app/shared/model/chart';
import { ViewElement } from 'app/shared/model/view-config';
import { Scale } from './scale.type';

export interface Chart extends ViewElement {
   chartType: string;
   margin: Margin;
   showLegend: boolean;
   legendPosition: string;
   baseScale: Scale;
   valueScales: Scale[];
   stacked: boolean;
   multiValueAxes: boolean;
}
