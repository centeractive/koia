import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ScaleConfig } from 'app/shared/model/chart';

@Component({
  selector: 'koia-scale',
  templateUrl: './scale.component.html',
  styleUrl: './scale.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ScaleComponent {

  @Input() title: string;
  @Input() scale: ScaleConfig;
}
