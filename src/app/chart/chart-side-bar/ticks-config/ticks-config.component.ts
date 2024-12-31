import { Component, Input } from '@angular/core';
import { TicksConfig } from 'app/shared/model/chart';

@Component({
  selector: 'koia-ticks-config',
  templateUrl: './ticks-config.component.html',
  styleUrl: './ticks-config.component.css',
  standalone: false
})
export class TicksConfigComponent {

  @Input() title: string;
  @Input() ticksConfig: TicksConfig;
}
