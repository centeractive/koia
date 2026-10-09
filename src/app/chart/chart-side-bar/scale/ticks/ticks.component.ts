import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TicksConfig } from 'app/shared/model/chart';

@Component({
  selector: 'koia-ticks',
  templateUrl: './ticks.component.html',
  styleUrl: './ticks.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class TicksComponent {

  @Input() ticks: TicksConfig;
}
