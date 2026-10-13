import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DataReader, ReaderService } from 'app/shared/services/reader';

@Component({
  selector: 'koia-front-info',
  templateUrl: './front-info.component.html',
  styleUrls: ['./front-info.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class FrontInfoComponent {

  readonly readers: DataReader[];

  constructor(readerService: ReaderService) {
    this.readers = readerService.getReaders();
  }
}
