import { ColorScheme } from 'app/shared/color';
import { ViewElement } from '../../model/view-config/view-element.type';

export interface Graph extends ViewElement {
   colorScheme: ColorScheme;
   linkStrength: number;
   friction: number;
   linkDist: number;
   charge: number;
   gravity: number;
   theta: number;
   alpha: number;
}
