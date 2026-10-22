import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

@Component({
  selector: 'koia-view-toolbar',
  templateUrl: './view-toolbar.component.html',
  styleUrls: ['./view-toolbar.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ViewToolbarComponent {

  @Input() moreMenu: MatMenu;
}
