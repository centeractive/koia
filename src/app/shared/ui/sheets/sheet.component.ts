import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SheetLayout } from './sheet-layout';

/**
 * a page of its layout, drawn as sheet of paper with heading and page number when paged
 */
@Component({
  selector: '[koiaSheet]',
  templateUrl: './sheet.component.html',
  host: {
    class: 'div_canvas_page',
    '[class.div_canvas_sheet]': 'layout.pageFormat.paged',
    '[class.div_canvas_page_spare]': 'spare',
    '[style]': 'layout.pageStyle(page)'
  },
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class SheetComponent {

  @Input() layout: SheetLayout;
  @Input() page: number;
  @Input() count: number;
  /** a spare sheet shows neither heading nor page number */
  @Input() spare = false;
  @Input() title: string;
  @Input() sceneName: string;
  @Input() printedAt: Date;
}
