import { Directive, SimpleChange } from '@angular/core';
import { fakeAsync, flush } from '@angular/core/testing';
import { Aggregation, Column, DataType, ElementContext, ExportFormat, TimeUnit } from '../model';
import { ContainerModel, DragDropEventFactory } from '../test';
import { SideBarController } from './side-bar.controller';

@Directive()
class SideBarControllerTestable extends SideBarController { }

class ContextTestable extends ElementContext {

   constructor(columns: Column[]) {
      super(columns);
   }

   getTitle(): string {
      return '';
   }

   getSupportedExportFormats(): ExportFormat[] {
      return [];
   }
}

describe('SummaryTableSideBarComponent', () => {

   const dragDropEventFactory = new DragDropEventFactory<Column>();
   let columns: Column[];
   let context: ElementContext;
   let controller: SideBarController;

   beforeAll(() => {
      columns = [
         { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE },
         { name: 'Level', dataType: DataType.TEXT, width: 60 },
         { name: 'Host', dataType: DataType.TEXT, width: 80 },
         { name: 'Path', dataType: DataType.TEXT, width: 200 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 70 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 30 }
      ];
   });

   beforeEach(() => {
      context = new ContextTestable(columns);
      context.dataColumns = [findColumn('Amount')];
      context.groupByColumns = [findColumn('Time')];
      context.aggregations = [Aggregation.MIN, Aggregation.MAX];

      controller = new SideBarControllerTestable();
      controller.ngOnChanges({ context: new SimpleChange(undefined, context, true) });
   });

   it('#dropSplitColumn should re-position context split columns when moved inside selected columns', () => {

      // given
      context.splitColumns = [findColumn('Time'), findColumn('Host'), findColumn('Level')];
      controller.selectedSplitColumns = context.splitColumns.slice(0);
      const dragDropEvent = dragDropEventFactory.createInContainerEvent('selectedSplitColumns', controller.selectedSplitColumns, 1, 0);

      // when
      controller.dropSplitColumn(dragDropEvent);

      // then
      expect(context.splitColumns.map(c => c.name)).toEqual(['Host', 'Time', 'Level']);
   });

   it('#dropSplitColumn should not change context split column when moved inside available columns', () => {

      // given
      context.splitColumns = [findColumn('Time'), findColumn('Host'), findColumn('Level')];
      controller.selectedSplitColumns = context.splitColumns.slice(0);
      const data = [findColumn('Path'), findColumn('Percent')];
      const dragDropEvent = dragDropEventFactory.createInContainerEvent('availableSplitColumns', data, 1, 0);

      // when
      controller.dropSplitColumn(dragDropEvent);

      // then
      expect(context.splitColumns.map(c => c.name)).toEqual(['Time', 'Host', 'Level']);
   });

   it('#dropSplitColumn should change context split column when moved into selected columns', () => {

      // given
      context.splitColumns = [findColumn('Time'), findColumn('Host')];
      controller.selectedSplitColumns = context.splitColumns.slice(0);
      const from: ContainerModel<Column> = {
         id: 'availableSplitColumns',
         data: [findColumn('Path'), findColumn('Level'), findColumn('Percent')],
         index: 1
      };
      const to: ContainerModel<Column> = {
         id: 'selectedSplitColumns',
         data: controller.selectedSplitColumns,
         index: 2
      };
      const dragDropEvent = dragDropEventFactory.createCrossContainerEvent(from, to);

      // when
      controller.dropSplitColumn(dragDropEvent);

      // then
      expect(context.splitColumns.map(c => c.name)).toEqual(['Time', 'Host', 'Level']);
   });

   it('#dropGroupByColumn should re-position context group-by columns when moved inside selected columns', () => {

      // given
      context.groupByColumns = [findColumn('Time'), findColumn('Host'), findColumn('Level')];
      controller.selectedGroupByColumns = context.groupByColumns.slice(0);
      const dragDropEvent = dragDropEventFactory.createInContainerEvent('selectedGroupByColumns', controller.selectedGroupByColumns, 1, 0);

      // when
      controller.dropGroupByColumn(dragDropEvent);

      // then
      expect(context.groupByColumns.map(c => c.name)).toEqual(['Host', 'Time', 'Level']);
   });

   it('#dropGroupByColumn should not change context group-by column when moved inside available columns', () => {

      // given
      context.groupByColumns = [findColumn('Time'), findColumn('Host'), findColumn('Level')];
      controller.selectedGroupByColumns = context.groupByColumns.slice(0);
      const data = [findColumn('Path'), findColumn('Percent')];
      const dragDropEvent = dragDropEventFactory.createInContainerEvent('availableGroupByColumns', data, 1, 0);

      // when
      controller.dropGroupByColumn(dragDropEvent);

      // then
      expect(context.groupByColumns.map(c => c.name)).toEqual(['Time', 'Host', 'Level']);
   });

   it('#dropGroupByColumn should change context group-by column when moved into selected columns', () => {

      // given
      context.groupByColumns = [findColumn('Time'), findColumn('Host')];
      controller.selectedGroupByColumns = context.groupByColumns.slice(0);
      const from: ContainerModel<Column> = {
         id: 'availableGroupByColumns',
         data: [findColumn('Path'), findColumn('Level'), findColumn('Percent')],
         index: 1
      };
      const to: ContainerModel<Column> = {
         id: 'selectedGroupByColumns',
         data: controller.selectedGroupByColumns,
         index: 2
      };
      const dragDropEvent = dragDropEventFactory.createCrossContainerEvent(from, to);

      // when
      controller.dropGroupByColumn(dragDropEvent);

      // then
      expect(context.groupByColumns.map(c => c.name)).toEqual(['Time', 'Host', 'Level']);
   });

   it('#addValueGrouping should add value grouping', fakeAsync(() => {

      // given
      const entries = generateEntries('Amount', 1000, 0, 1000);
      controller.entries = entries;

      // when
      controller.addValueGrouping('Amount');
      flush();

      // then
      expect(context.hasValueGrouping('Amount')).toBeTruthy();
      expect(context.valueGroupings[0].columnName).toEqual('Amount');
   }));

   it('#removeValueGrouping should remove value grouping', () => {

      // given
      const entries = generateEntries('Amount', 1000, 0, 1000);
      controller.entries = entries;
      controller.addValueGrouping('Amount');
      const amountValueGrouping = context.valueGroupings[0];

      // when
      controller.removeValueGrouping(amountValueGrouping);

      // then
      expect(context.hasValueGrouping('Amount')).toBe(false);
   });

   it('#ngOnChanges should keep element context when context did not change', () => {

      // when
      controller.ngOnChanges({ entries: new SimpleChange(undefined, [], true) });

      // then
      expect(controller.elementContext).toBe(context);
   });

   it('#onValueGroupingRangesChanged should fire structure change when column is in use', () => {

      // given
      context.dataColumns = [findColumn('Percent')];
      context.groupByColumns = [];
      const valueGrouping = { columnName: 'Percent', ranges: [{ max: 100, active: true }] };
      vi.spyOn(context, 'fireStructureChanged').mockReturnValue(undefined);

      // when
      controller.onValueGroupingRangesChanged(valueGrouping);

      // then
      expect(context.fireStructureChanged).toHaveBeenCalled();
   });

   it('#onValueGroupingRangesChanged should not fire structure change when column is not in use', () => {

      // given
      context.dataColumns = [findColumn('Path')];
      context.groupByColumns = [findColumn('Time')];
      const valueGrouping = { columnName: 'Percent', ranges: [{ max: 100, active: true }] };
      vi.spyOn(context, 'fireStructureChanged').mockReturnValue(undefined);

      // when
      controller.onValueGroupingRangesChanged(valueGrouping);

      // then
      expect(context.fireStructureChanged).not.toHaveBeenCalled();
   });

   it('#setElementPosition should emit onElementPositionChange', () => {

      // given
      vi.spyOn(controller.onElementPositionChange, 'emit').mockReturnValue(undefined);

      // when
      controller.setElementPosition(3);

      // then
      expect(controller.onElementPositionChange.emit).toHaveBeenCalledWith(3);
   });

   it('#isNumericColumn should return true when column is "Number"', () => {
      expect(controller.isNumericColumn(findColumn('Time'))).toBe(true);
      expect(controller.isNumericColumn(findColumn('Amount'))).toBe(true);
      expect(controller.isNumericColumn(findColumn('Percent'))).toBe(true);
   });

   it('#isNumericColumn should return false when column is "Text"', () => {
      expect(controller.isNumericColumn(findColumn('Level'))).toBe(false);
      expect(controller.isNumericColumn(findColumn('Host'))).toBe(false);
      expect(controller.isNumericColumn(findColumn('Path'))).toBe(false);
   });

   it('#isNumericColumn should return false when column is missing', () => {
      expect(controller.isNumericColumn(findColumn(undefined))).toBe(false);
      expect(controller.isNumericColumn(findColumn(null))).toBe(false);
   });

   function findColumn(name: string): Column {
      return columns.find(c => c.name === name);
   }

   function generateEntries(columnName: string, count: number, minValue: number, maxValue: number): object[] {
      const entries: object[] = new Array(count);
      const diffPerEntry = (maxValue - minValue) / (count - 1);
      let value = minValue;
      for (let i = 0; i < count - 1; i++) {
         entries[i] = { [columnName]: value };
         value += diffPerEntry;
      }
      entries[count - 1] = { [columnName]: maxValue };
      return entries;
   }
});


