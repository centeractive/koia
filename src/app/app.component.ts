import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IconRegistrarService } from './shared/services';

@Component({
    selector: 'koia-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent {

  constructor(iconRegistrarService: IconRegistrarService) {
    iconRegistrarService.registerSvgIcons();
  }
}
