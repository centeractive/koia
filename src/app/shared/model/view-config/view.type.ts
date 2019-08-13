import { ViewElement } from './view-element.type';
import { Route } from '../route.enum';

export interface View {
   route: Route,
   name: string;
   modifiedTime: number;
   gridColumns: number;
   gridCellRatio: string;
   elements: ViewElement[];
}
