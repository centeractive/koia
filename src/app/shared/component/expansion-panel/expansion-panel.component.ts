import { Component, Input } from '@angular/core';

@Component({
  selector: 'koia-expansion-panel',
  templateUrl: './expansion-panel.component.html',
  styleUrls: ['./expansion-panel.component.css']
})
export class ExpansionPanelComponent {

  @Input() title: string;
  @Input() expanded = false;

}
