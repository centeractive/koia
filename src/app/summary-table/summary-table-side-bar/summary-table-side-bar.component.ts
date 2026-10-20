import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { SideBarController } from 'app/shared/controller';
import { Aggregation, Column, DataType, SummaryContext } from '../../shared/model';
import { isComputedColumn } from 'app/shared/utils/column-utils';

@Component({
  selector: 'koia-summary-table-side-bar',
  templateUrl: './summary-table-side-bar.component.html',
  styleUrls: ['./summary-table-side-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class SummaryTableSideBarComponent extends SideBarController implements OnChanges {

  static readonly VALUE_AGGREGATIONS = [Aggregation.AVG, Aggregation.MEDIAN, Aggregation.MAX, Aggregation.MIN, Aggregation.SUM];

  @Input() context: SummaryContext;

  dataColumns: Column[];
  availableAggregations: Aggregation[];
  selectedAggregations: Aggregation[];

  override ngOnChanges(changes: SimpleChanges): void {
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
    if (this.context.isAggregationCountSelected() || !this.isCountDistinctValuesEnabled()) {
      super.addValueGrouping(column.name);
    } else {
      this.context.silent = true;
      super.addValueGrouping(column.name);
      this.context.silent = false;
      this.context.aggregations = [Aggregation.COUNT];
    }
  }

  onComputedColumnCreated(column: Column): void {
    this.onColumnChanged(this.contextColumnOf(column));
  }

  /**
   * counting distinct values groups by the data column, which is not supported for computed columns
   */
  isCountDistinctValuesEnabled(): boolean {
    return !this.context.dataColumns.some(isComputedColumn);
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

  protected override defineSelectableItems() {
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
