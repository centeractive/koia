import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'koia-front-guide',
  templateUrl: './front-guide.component.html',
  styleUrls: ['./front-guide.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class FrontGuideComponent { }
