import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CanvasPaging } from 'app/shared/model/canvas-paging.enum';
import { PageFormat } from './page-format';

/**
 * radio buttons choosing between the screen view and pages of a view, followed by the print button enabled for pages
 */
@Component({
  selector: 'koia-paging-toggles',
  templateUrl: './paging-toggles.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class PagingTogglesComponent {

  readonly CanvasPaging = CanvasPaging;

  /** active paging, none active when undefined */
  @Input() paging: CanvasPaging | undefined;
  @Input() showMonitor = true;
  @Input() printDisabled = false;
  @Output() readonly pagingChange = new EventEmitter<CanvasPaging>();

  isPaged(): boolean {
    return PageFormat.isPaged(this.paging);
  }
}
