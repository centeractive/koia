import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'koia-page-heading',
  templateUrl: './page-heading.component.html',
  styleUrls: ['./page-heading.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class PageHeadingComponent {

  @Input() title: string;
  @Input() sceneName: string;
  @Input() printedAt: Date;
}
