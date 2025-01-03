import { Component, Input } from '@angular/core';
import { ScaleConfig } from 'app/shared/model/chart';

@Component({
  selector: 'koia-scale',
  templateUrl: './scale.component.html',
  styleUrl: './scale.component.css',
  standalone: false
})
export class ScaleComponent {

  @Input() title: string;
  @Input() scale: ScaleConfig;
}
