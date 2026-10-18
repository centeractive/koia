import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Directive, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { DataFrame } from 'data-forge';
import { Column, DataType, ElementContext, GROUPING_TIME_UNITS } from '../model';
import { DataTypeUtils } from '../utils';
import { ValueGroupingGenerator } from '../value-range';
import { ValueGrouping } from '../value-range/model/value-grouping.type';

@Directive()
export abstract class SideBarController implements OnChanges {

   @Input() entries: object[];
   @Input() gridColumns: number;
   @Input() elementCount: number;
   @Input() elementPosition: number;
   @Output() onElementPositionChange: EventEmitter<number> = new EventEmitter(true);

   @ViewChild(MatAccordion) accordion: MatAccordion;

   multiExpandable = true;
   readonly selectableTimeUnits = GROUPING_TIME_UNITS;

   availableSplitColumns: Column[];
   selectedSplitColumns: Column[];

   availableGroupByColumns: Column[];
   selectedGroupByColumns: Column[];
   elementContext: ElementContext;
   private valueGroupingGenerator = new ValueGroupingGenerator();

   ngOnChanges(changes: SimpleChanges): void {
      if (changes['context']) {
         this.elementContext = changes['context'].currentValue;
      }
   }

   protected defineSelectableItems(): void {
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
      const data = new DataFrame(this.entries);
      const grouping = this.valueGroupingGenerator.createGrouping(data, columnName);
      this.elementContext.addValueGrouping(grouping);
   }

   removeValueGrouping(valueGrouping: ValueGrouping): void {
      this.elementContext.removeValueGrouping(valueGrouping);
   }

   onValueGroupingRangesChanged(valueGrouping: ValueGrouping): void {
      if (this.elementContext.isColumnInUse(valueGrouping.columnName)) {
         this.elementContext.fireStructureChanged();
      }
   }

   isNumericColumn(column: Column): boolean {
      return DataTypeUtils.isNumericColumn(column);
   }

   setElementPosition(elementPosition: number): void {
      this.elementPosition = elementPosition;
      this.onElementPositionChange.emit(elementPosition);
   }
}
