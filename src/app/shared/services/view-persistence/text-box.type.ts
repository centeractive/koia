import type { JSONContent } from '@tiptap/core';
import { ViewElement } from '../../model/view-config/view-element.type';

export interface TextBox extends ViewElement {
   content: JSONContent;
   backgroundColor: string;
   /** index of the anchor tile in the view's elements */
   anchor?: number;
   anchorX?: number;
   anchorY?: number;
}
