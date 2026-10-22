import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Route } from 'app/shared/model';

/**
 * fills the window with a header (navigation, page title, language selection) above the scrollable page content
 */
@Component({
  selector: 'koia-page-frame',
  templateUrl: './page-frame.component.html',
  styleUrls: ['./page-frame.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class PageFrameComponent {

  @Input() heading: string;
  @Input() active: Route;
  @Input() scenesExist = true;
}
