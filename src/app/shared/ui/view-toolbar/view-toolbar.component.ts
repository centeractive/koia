import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

export interface SavedView {
  name: string;
  modifiedTime: number;
}

@Component({
  selector: 'koia-view-toolbar',
  templateUrl: './view-toolbar.component.html',
  styleUrls: ['./view-toolbar.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ViewToolbarComponent<T extends SavedView> {

  @Input() moreMenu: MatMenu;
  @Input() persistable = true;
  @Input() hasContent = true;
  @Input() savedViews: T[] = [];
  @Output() save = new EventEmitter<void>();
  @Output() restore = new EventEmitter<T>();

  printView(): void {
    window.print();
  }
}
