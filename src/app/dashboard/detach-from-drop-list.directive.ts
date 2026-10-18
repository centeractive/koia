import { CDK_DROP_LIST } from '@angular/cdk/drag-drop';
import { Directive } from '@angular/core';

/**
 * keeps the draggable elements inside from registering with the enclosing drop list, so they are moved freely
 * and neither sort nor count as items of the list
 */
@Directive({
  selector: '[koiaDetachFromDropList]',
  providers: [{ provide: CDK_DROP_LIST, useValue: null }],
  standalone: false
})
export class DetachFromDropListDirective { }
