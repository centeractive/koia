import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CanvasPaging } from 'app/shared/model/canvas-paging.enum';
import { applyPrintSheets, resetPrintSheets } from './print-sheets';
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
  /** paging of the printed sheets, [[undefined]] to print the view on unnamed pages */
  @Input() printSheets: CanvasPaging;
  @Output() readonly printStart = new EventEmitter<Date>();

  printedAt: Date;

  constructor(private elementRef: ElementRef<HTMLElement>, private cdr: ChangeDetectorRef) { }

  @HostListener('window:beforeprint')
  onBeforePrint(): void {
    const header = this.elementRef.nativeElement.parentElement;
    if (header.getClientRects().length > 0) {
      this.printedAt = new Date();
      applyPrintSheets(document, this.printSheets);
      fitPrintableContentToPage(header.parentElement);
      this.cdr.detectChanges();
      this.printStart.emit(this.printedAt);
    }
  }

  @HostListener('window:afterprint')
  onAfterPrint(): void {
    resetPrintZoom(document);
    resetPrintSheets(document);
  }
}
