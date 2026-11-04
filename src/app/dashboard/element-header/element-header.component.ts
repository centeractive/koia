import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { ElementContext, EnumLabels, ExportFormat } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { GridLayout } from '../grid-layout';
import { HEADER_CONTROLS } from '../selecting-click';

@Component({
  selector: 'koia-element-header',
  templateUrl: './element-header.component.html',
  styleUrls: ['./element-header.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ElementHeaderComponent {

  readonly rowSpans = GridLayout.ROW_SPANS;

  @Input() context: ElementContext;
  @Input() gridLayout: GridLayout;
  @Input() stackable: boolean;
  /** whether the header moves the tile, its controls and the title being edited excluded */
  @Input() @HostBinding('class.koia-header-draggable') headerDraggable = false;
  @Output() configure = new EventEmitter<MouseEvent>();
  @Output() remove = new EventEmitter<void>();
  @Output() saveAs = new EventEmitter<ExportFormat>();
  @Output() titleChange = new EventEmitter<string>();
  @Output() bringToFront = new EventEmitter<void>();
  @Output() sendToBack = new EventEmitter<void>();

  /**
   * keeps a press on the controls from starting a drag of the tile
   */
  onHeaderPress(event: Event): void {
    if (this.headerDraggable && (event.target as Element).closest(HEADER_CONTROLS)) {
      event.stopPropagation();
    }
  }

  isMoreMenuAvailable(): boolean {
    return !!this.gridLayout || this.stackable || this.context.getSupportedExportFormats().length > 0;
  }

  exportFormatLabel(exportFormat: ExportFormat): string {
    return EnumLabels.exportFormat(exportFormat);
  }

  chartContext(): ChartContext {
    return this.context instanceof ChartContext ? this.context : undefined;
  }
}
