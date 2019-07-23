import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GraphContext } from '../shared/model';
import { SideBarController } from 'app/shared/controller/side-bar.controller';

@Component({
  selector: 'koia-graph-side-bar',
  templateUrl: './graph-side-bar.component.html',
  styleUrls: ['./graph-side-bar.component.css']
})
export class GraphSideBarComponent extends SideBarController implements OnChanges {

  @Input() context: GraphContext;

  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    this.defineSelectableItems();
  }

  protected defineSelectableItems() {
    if (this.context) {
      this.selectedGroupByColumns = this.context.groupByColumns;
    }
    super.defineSelectableItems();
  }
}
