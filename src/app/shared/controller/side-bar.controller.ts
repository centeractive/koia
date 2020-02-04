import { Output, EventEmitter, Input, ViewChild, SimpleChanges, OnChanges, Directive } from '@angular/core';
import { MatAccordion } from '@angular/material';
import { Column, ElementContext, DataType, TimeUnit } from '../model';
import { NumberUtils, ArrayUtils, DataTypeUtils } from '../utils';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DataFrame } from 'data-forge';
import { Observable } from 'rxjs';
import { ValueGroupingGenerator } from '../value-range';
import { ValueGrouping } from '../value-range/model/value-grouping.type';
import { ValueRange } from '../value-range/model/value-range.type';

@Directive()
export abstract class SideBarController implements OnChanges {

   @Input() entries$: Observable<Object[]>;
   @Input() gridColumns: number;
   @Input() elementCount: number;
   @Input() elementPosition: number;
   @Output() onElementPositionChange: EventEmitter<number> = new EventEmitter(true);

   @ViewChild(MatAccordion) accordion: MatAccordion;

   multiExpandable: boolean;
   readonly selectableTimeUnits = [undefined, TimeUnit.SECOND, TimeUnit.MINUTE, TimeUnit.HOUR, TimeUnit.DAY, TimeUnit.MONTH, TimeUnit.YEAR];

   availableSplitColumns: Column[];
   selectedSplitColumns: Column[];

   nonGroupedColumns: Column[];
   availableGroupByColumns: Column[];
   selectedGroupByColumns: Column[];
   gridColumnSpans: number[];
   readonly gridRowSpans: number[] = [1, 2, 3, 4];
   elementPositions: number[];
   elementContext: ElementContext;
   private valueGroupingGenerator = new ValueGroupingGenerator();

   ngOnChanges(changes: SimpleChanges): void {
      if (changes['context']) {
         this.elementContext = changes['context'].currentValue;
         this.identifyNonGroupedColumns();
      }
   }

   private identifyNonGroupedColumns(): void {
      const groupedColumns = this.elementContext.valueGroupings.map(g => g.columnName);
      this.nonGroupedColumns = this.elementContext.columns
         .filter(c => c.dataType === DataType.NUMBER)
         .filter(c => !groupedColumns.includes(c.name));
   }

   onMultiExpandableChanged(checked: boolean): void {
      if (!checked) {
         this.accordion.closeAll();
      }
   }

   protected defineSelectableItems() {
      if (this.gridColumns) {
         this.gridColumnSpans = NumberUtils.rangeClosedIntArray(this.gridColumns);
      }
      if (this.elementCount) {
         this.elementPositions = NumberUtils.rangeClosedIntArray(this.elementCount);
      }
      this.selectedSplitColumns = this.elementContext.splitColumns;
      this.availableSplitColumns = this.determineAvailableSplitColumns();
      this.selectedGroupByColumns = this.elementContext.groupByColumns;
      this.availableGroupByColumns = this.determineAvailableGroupByColumns();
   }

   private determineAvailableSplitColumns(): Column[] {
      return this.elementContext.columns
         .filter(c => c.dataType !== DataType.TIME)
         .filter(c => !this.elementContext.dataColumns.includes(c))
         .filter(c => !this.selectedSplitColumns.includes(c));
   }

   private determineAvailableGroupByColumns(): Column[] {
      return this.elementContext.columns
         .filter(c => !this.elementContext.dataColumns.includes(c))
         .filter(c => !this.selectedGroupByColumns.includes(c));
   }

   iconOf(dataType: DataType): string {
      return DataTypeUtils.iconOf(dataType);
   }

   dropSplitColumn(event: CdkDragDrop<Column[]>): void {
      if (event.previousContainer === event.container) {
         moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
         if (event.container.id === 'selectedSplitColumns') {
            this.elementContext.splitColumns = this.selectedSplitColumns;
         }
      } else {
         transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
         this.elementContext.splitColumns = this.selectedSplitColumns;
      }
   }

   dropGroupByColumn(event: CdkDragDrop<Column[]>): void {
      if (event.previousContainer === event.container) {
         moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
         if (event.container.id === 'selectedGroupByColumns') {
            this.elementContext.groupByColumns = this.selectedGroupByColumns;
         }
      } else {
         transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
         this.elementContext.groupByColumns = this.selectedGroupByColumns;
      }
   }

   addValueGrouping(columnName: string): void {
      this.entries$.subscribe(entries => {
         const data = new DataFrame(entries);
         const grouping = this.valueGroupingGenerator.createGrouping(data, columnName);
         this.elementContext.addValueGrouping(grouping);
         this.identifyNonGroupedColumns();
      });
   }

   removeValueGrouping(valueGrouping: ValueGrouping): void {
      this.elementContext.removeValueGrouping(valueGrouping);
      this.identifyNonGroupedColumns();
   }

   addGroupingValueRange(valueGrouping: ValueGrouping): ValueRange {
      const max = NumberUtils.roundUpBroad(valueGrouping.minMaxValues.min);
      const range: ValueRange = { max: max, active: true };
      valueGrouping.ranges.push(range);
      if (this.elementContext.isColumnInUse(valueGrouping.columnName)) {
         this.elementContext.fireStructureChanged();
      }
      return range;
   }

   dropGroupingRange(valueGrouping: ValueGrouping, event: CdkDragDrop<string[]>) {
      ArrayUtils.move(valueGrouping.ranges, event.previousIndex, event.currentIndex);
   }

   removeGroupingRange(valueGrouping: ValueGrouping, range: ValueRange): void {
      ArrayUtils.removeElement(valueGrouping.ranges, range);
      if (this.elementContext.isColumnInUse(valueGrouping.columnName)) {
         this.elementContext.fireStructureChanged();
      }
   }

   groupingRangeStateChanged(valueGrouping: ValueGrouping, range: ValueRange, active: boolean): void {
      range.active = active;
      if (this.elementContext.isColumnInUse(valueGrouping.columnName)) {
         this.elementContext.fireStructureChanged();
      }
   }

   isNumberKey(event: KeyboardEvent): boolean {
      return NumberUtils.isNumberKey(event);
   }

   isNumericColumn(column: Column): boolean {
      return column && DataTypeUtils.isNumeric(column.dataType);
   }

   setElementPosition(elementPosition: number): void {
      this.elementPosition = elementPosition;
      this.onElementPositionChange.emit(elementPosition);
   }
}
