import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { SummaryContext, Aggregation, DataType, Column } from '../../shared/model';
import { SideBarController } from 'app/shared/controller';

@Component({
  selector: 'koia-summary-table-side-bar',
  templateUrl: './summary-table-side-bar.component.html',
  styleUrls: ['./summary-table-side-bar.component.css']
})
export class SummaryTableSideBarComponent extends SideBarController implements OnChanges {

  static readonly VALUE_AGGREGATIONS = [Aggregation.AVG, Aggregation.MEDIAN, Aggregation.MAX, Aggregation.MIN, Aggregation.SUM];

  @Input() context: SummaryContext;

  dataColumns: Column[];
  availableAggregations: Aggregation[];
  selectedAggregations: Aggregation[];

  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    this.defineSelectableItems();
  }

  onColumnChanged(column: Column): void {
    this.context.dataColumns = [column];
    if (this.isNumericColumn(column) && !this.context.hasValueGrouping(column.name)) {
      if (this.context.isAggregationCountSelected()) {
        this.context.aggregations = SummaryTableSideBarComponent.VALUE_AGGREGATIONS.slice(0, 1);
      }
    } else {
      this.context.aggregations = [Aggregation.COUNT];
    }
    this.defineSelectableItems();
  }

  addValueGroupingFor(column: Column): void {
    if (this.context.isAggregationCountSelected()) {
      super.addValueGrouping(column.name);
    } else {
      this.context.silent = true;
      super.addValueGrouping(column.name);
      this.context.silent = false;
      this.context.aggregations = [Aggregation.COUNT];
    }
  }

  isAggregateValuesEnabled(): boolean {
    if (this.context.hasDataColumn()) {
      return this.isNumericColumn(this.context.dataColumns[0]) && !this.context.hasValueGrouping(this.context.dataColumns[0].name)
    }
    return true;
  }

  onAggregationTypeChanged(countDistinctValues: boolean): void {
    if (countDistinctValues) {
      this.context.aggregations = [Aggregation.COUNT];
    } else {
      this.context.aggregations = [SummaryTableSideBarComponent.VALUE_AGGREGATIONS[0]];
      this.initSelectedAndAvailableAggregations();
    }
  }

  protected defineSelectableItems() {
    this.dataColumns = this.context.columns
      .filter(c => c.dataType !== DataType.TIME);
    this.initSelectedAndAvailableAggregations();
    super.defineSelectableItems();
  }

  private initSelectedAndAvailableAggregations() {
    this.selectedAggregations = this.context.aggregations;
    this.availableAggregations = SummaryTableSideBarComponent.VALUE_AGGREGATIONS
      .filter(a => !this.selectedAggregations.includes(a));
  }

  dropAggregation(event: CdkDragDrop<Aggregation[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      if (event.container.id === 'selectedAggregations') {
        this.context.aggregations = this.selectedAggregations;
      }
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.context.aggregations = this.selectedAggregations;
    }
  }
}
