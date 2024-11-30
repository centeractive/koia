import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'koia-expansion-panel',
    templateUrl: './expansion-panel.component.html',
    styleUrls: ['./expansion-panel.component.css'],
    standalone: false
})
export class ExpansionPanelComponent {

  @Input() title: string;
  @Input() expanded = false;
  @Input() deletable = false;

  @Output() delete = new EventEmitter<void>();

}
