import { ViewElement } from '../../model/view-element.type';

export interface Graph extends ViewElement {
   linkStrength: number;
   friction: number;
   linkDist: number;
   charge: number;
   gravity: number;
   theta: number;
   alpha: number;
}
