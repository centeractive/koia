import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { applyPrintOrientation, resetPrintOrientation } from './print-orientation';
import { fitPrintableContentToPage, resetPrintZoom } from './print-zoom';

@Component({
  selector: 'koia-print-heading',
  templateUrl: './print-heading.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class PrintHeadingComponent {

  @Input() title: string;
  @Input() sceneName: string;
  @Input() portrait = false;
  @Output() readonly printStart = new EventEmitter<Date>();

  printedAt: Date;

  constructor(private elementRef: ElementRef<HTMLElement>, private cdr: ChangeDetectorRef) { }

  @HostListener('window:beforeprint')
  onBeforePrint(): void {
    const header = this.elementRef.nativeElement.parentElement;
    if (header.getClientRects().length > 0) {
      this.printedAt = new Date();
      applyPrintOrientation(document, this.portrait);
      fitPrintableContentToPage(header.parentElement);
      this.cdr.detectChanges();
      this.printStart.emit(this.printedAt);
    }
  }

  @HostListener('window:afterprint')
  onAfterPrint(): void {
    resetPrintZoom(document);
    resetPrintOrientation(document);
  }
}
