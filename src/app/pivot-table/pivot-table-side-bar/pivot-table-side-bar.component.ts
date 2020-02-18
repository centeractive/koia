import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Column, DataType } from '../../shared/model';
import { IDataFrame, ISeries } from 'data-forge';
import { NumberUtils, ArrayUtils } from 'app/shared/utils';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatAccordion } from '@angular/material/expansion';
import { ValueGroupingGenerator } from 'app/shared/value-range';
import { ValueGrouping } from 'app/shared/value-range/model/value-grouping.type';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { PivotContext } from '../model';

@Component({
  selector: 'koia-pivot-table-side-bar',
  templateUrl: './pivot-table-side-bar.component.html',
  styleUrls: ['./pivot-table-side-bar.component.css']
})
export class PivotTableSideBarComponent implements OnChanges {

  @Input() columns: Column[];
  @Input() context: PivotContext;
  @Input() data: IDataFrame;

  @ViewChild(MatAccordion) accordion: MatAccordion;

  multiExpandable: boolean;
  nonGroupedColumns: Column[];
  private valueGroupingGenerator = new ValueGroupingGenerator();

  ngOnChanges(changes: SimpleChanges): void {
    if (this.context) {
      if (this.columns) {
        this.identifyNonGroupedColumns();
      }
      if (this.data) {
        this.retainGroupingsMissingLimits();
      }
    }
  }

  onMultiExpandableChanged(checked: boolean): void {
    if (!checked) {
      this.accordion.closeAll();
    }
  }

  addValueGrouping(column: Column): ValueGrouping {
    const grouping = this.valueGroupingGenerator.createGrouping(this.data, column.name);
    this.context.valueGroupings.push(grouping);
    this.identifyNonGroupedColumns();
    return grouping;
  }

  removeValueGrouping(valueGrouping: ValueGrouping): void {
    ArrayUtils.removeElement(this.context.valueGroupings, valueGrouping);
    this.identifyNonGroupedColumns();
  }

  private identifyNonGroupedColumns(): void {
    const groupedColumns = this.context.valueGroupings.map(g => g.columnName);
    this.nonGroupedColumns = this.columns
      .filter(c => c.dataType === DataType.NUMBER)
      .filter(c => !groupedColumns.includes(c.name));
  }

  private retainGroupingsMissingLimits(): void {
    this.context.valueGroupings
      .filter(g => !g.minMaxValues)
      .forEach(g => g.minMaxValues = this.limitsOf(g.columnName));
  }

  private limitsOf(columnName: string): ValueRange {
    const series: ISeries<number, any> = this.data.getSeries(columnName);
    return {
      min: series.min(),
      max: series.max(),
    };
  }

  addGroupingRange(valueGrouping: ValueGrouping): ValueRange {
    const max = NumberUtils.roundUpBroad(valueGrouping.minMaxValues.min);
    const range: ValueRange = { max: max, active: true };
    valueGrouping.ranges.push(range);
    return range;
  }

  dropGroupingRange(grouping: ValueGrouping, event: CdkDragDrop<string[]>) {
    ArrayUtils.move(grouping.ranges, event.previousIndex, event.currentIndex);
  }

  isNumberKey(event: KeyboardEvent): boolean {
    return NumberUtils.isNumberKey(event);
  }

  removeGroupingRange(grouping: ValueGrouping, range: ValueRange) {
    ArrayUtils.removeElement(grouping.ranges, range);
  }
}
