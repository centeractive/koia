import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

/**
 * shows a copy of the source element
 */
@Directive({
  selector: '[koiaClone]',
  standalone: false
})
export class CloneDirective implements OnChanges {

  @Input('koiaClone') source: HTMLElement | undefined;

  constructor(private elementRef: ElementRef<HTMLElement>) { }

  ngOnChanges(): void {
    const host = this.elementRef.nativeElement;
    if (this.source) {
      host.replaceChildren(this.source.cloneNode(true));
    } else {
      host.replaceChildren();
    }
  }
}
