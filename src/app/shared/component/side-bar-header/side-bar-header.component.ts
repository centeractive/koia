import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'koia-side-bar-header',
  templateUrl: './side-bar-header.component.html',
  styleUrls: ['./side-bar-header.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class SideBarHeaderComponent {

  @Input() multiExpandable: boolean;
  @Output() multiExpandableChange = new EventEmitter<boolean>();
  @Output() expandAll = new EventEmitter<void>();
  @Output() collapseAll = new EventEmitter<void>();

  onMultiExpandableChanged(checked: boolean): void {
    this.multiExpandable = checked;
    this.multiExpandableChange.emit(checked);
    if (!checked) {
      this.collapseAll.emit();
    }
  }
}
