import { Directive, ElementRef, Renderer2, HostBinding, ChangeDetectorRef } from '@angular/core';
import { SliderElementDirective } from './slider-element.directive';

@Directive({
    selector: '[ngxSliderHandle]',
    standalone: false
})
export class SliderHandleDirective extends SliderElementDirective {
  @HostBinding('class.ngx-slider-active')
  active = false;

  @HostBinding('attr.role')
  role = '';

  @HostBinding('attr.tabindex')
  tabindex = '';

  @HostBinding('attr.aria-orientation')
  ariaOrientation = '';

  @HostBinding('attr.aria-label')
  ariaLabel = '';

  @HostBinding('attr.aria-labelledby')
  ariaLabelledBy = '';

  @HostBinding('attr.aria-valuenow')
  ariaValueNow = '';

  @HostBinding('attr.aria-valuetext')
  ariaValueText = '';

  @HostBinding('attr.aria-valuemin')
  ariaValueMin = '';

  @HostBinding('attr.aria-valuemax')
  ariaValueMax = '';

  focus(): void {
    this.elemRef.nativeElement.focus();
  }

  constructor(elemRef: ElementRef, renderer: Renderer2, changeDetectionRef: ChangeDetectorRef) {
    super(elemRef, renderer, changeDetectionRef);
  }
}
