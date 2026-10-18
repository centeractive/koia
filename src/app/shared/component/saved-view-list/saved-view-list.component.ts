import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'koia-saved-view-list',
  templateUrl: './saved-view-list.component.html',
  styleUrls: ['./saved-view-list.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class SavedViewListComponent {

  @Input() views: { name: string; modifiedTime: number }[];
  @Output() viewSelected = new EventEmitter<{ name: string; modifiedTime: number }>();
}
