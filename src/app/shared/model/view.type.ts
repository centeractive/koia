import { ViewElement } from './view-element.type';

export interface View {
   name: string;
   gridColumns: number;
   gridCellRatio: string;
   elements: ViewElement[];
}
