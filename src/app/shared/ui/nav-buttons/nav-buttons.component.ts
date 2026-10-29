import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Route } from 'app/shared/model';
import { USER_MANUAL_URL } from 'app/shared/utils/user-manual';

/**
 * navigates to the front page, the scenes and a new scene, marking the button of the current page, and opens the user manual
 */
@Component({
  selector: 'koia-nav-buttons',
  templateUrl: './nav-buttons.component.html',
  styleUrls: ['./nav-buttons.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class NavButtonsComponent {

  @Input() active: Route;
  @Input() scenesExist = true;

  readonly routes = Route;
  readonly urlFront = '/' + Route.FRONT;
  readonly urlScenes = '/' + Route.SCENES;
  readonly urlScene = '/' + Route.SCENE;
  readonly userManualUrl = USER_MANUAL_URL;
}
