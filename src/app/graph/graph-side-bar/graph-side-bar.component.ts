import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GraphContext } from 'app/shared/model/graph';
import { SideBarController } from 'app/shared/controller/side-bar.controller';

@Component({
  selector: 'koia-graph-side-bar',
  templateUrl: './graph-side-bar.component.html',
  styleUrls: ['./graph-side-bar.component.css'],
  standalone: false
})
export class GraphSideBarComponent extends SideBarController implements OnChanges {

  @Input() context: GraphContext;

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    this.defineSelectableItems();
  }

}
