import { Component, Input } from '@angular/core';
import { TicksConfig } from 'app/shared/model/chart';

@Component({
  selector: 'koia-ticks',
  templateUrl: './ticks.component.html',
  styleUrl: './ticks.component.css',
  standalone: false
})
export class TicksComponent {

  @Input() ticks: TicksConfig;
}
