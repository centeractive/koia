import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input } from '@angular/core';
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

  printedAt: Date;

  constructor(private elementRef: ElementRef<HTMLElement>, private cdr: ChangeDetectorRef) { }

  @HostListener('window:beforeprint')
  onBeforePrint(): void {
    const header = this.elementRef.nativeElement.parentElement;
    if (header.getClientRects().length > 0) {
      this.printedAt = new Date();
      fitPrintableContentToPage(header.parentElement);
      this.cdr.detectChanges();
    }
  }

  @HostListener('window:afterprint')
  onAfterPrint(): void {
    resetPrintZoom(document);
  }
}
