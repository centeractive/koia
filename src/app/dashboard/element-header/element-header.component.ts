import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ElementContext, EnumLabels, ExportFormat } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { GridLayout } from '../grid-layout';

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
  @Input() movable: boolean;
  @Input() stackable: boolean;
  @Output() configure = new EventEmitter<MouseEvent>();
  @Output() remove = new EventEmitter<void>();
  @Output() saveAs = new EventEmitter<ExportFormat>();
  @Output() titleChange = new EventEmitter<string>();
  @Output() bringToFront = new EventEmitter<void>();
  @Output() sendToBack = new EventEmitter<void>();

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
