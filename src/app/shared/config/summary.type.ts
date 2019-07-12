import { ViewElement } from './view-element.type';

export interface Summary extends ViewElement {
   empty: string; // not used but required (marker interface without property not allowed)
}
