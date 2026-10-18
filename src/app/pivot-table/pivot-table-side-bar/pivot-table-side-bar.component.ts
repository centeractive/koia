import { Component, Input, OnChanges, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { ArrayUtils } from 'app/shared/utils';
import { ValueGroupingGenerator } from 'app/shared/value-range';
import { ValueGrouping } from 'app/shared/value-range/model/value-grouping.type';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { IDataFrame, ISeries } from 'data-forge';
import { Column, DataType } from '../../shared/model';
import { PivotContext } from '../model';

@Component({
    selector: 'koia-pivot-table-side-bar',
    templateUrl: './pivot-table-side-bar.component.html',
    styleUrls: ['./pivot-table-side-bar.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PivotTableSideBarComponent implements OnChanges {

  @Input() columns: Column[];
  @Input() context: PivotContext;
  @Input() data: IDataFrame;

  @ViewChild(MatAccordion) accordion: MatAccordion;

  multiExpandable: boolean;
  nonGroupedColumns: Column[];
  private valueGroupingGenerator = new ValueGroupingGenerator();

  ngOnChanges(): void {
    if (this.context) {
      if (this.columns) {
        this.identifyNonGroupedColumns();
      }
      if (this.data) {
        this.retainGroupingsMissingLimits();
      }
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
    const series: ISeries<number, number> = this.data.getSeries(columnName);
    return {
      min: series.min(),
      max: series.max(),
    };
  }
}
