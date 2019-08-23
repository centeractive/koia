import { fakeAsync, flush } from '@angular/core/testing';

import { Column, ElementContext, Aggregation, DataType, TimeUnit, ExportFormat } from '../model';
import { SimpleChange } from '@angular/core';
import { SideBarController } from './side-bar.controller';
import { of } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { NumberUtils } from '../utils';
import { ValueRange } from '../value-range/model/value-range.type';

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

   it('#ngOnChanges should identify non grouped columns', () => {
      const expectedNonGroupedColumns = columns.filter(c => c.name === 'Amount' || c.name === 'Percent');
      expect(controller.nonGroupedColumns).toEqual(expectedNonGroupedColumns);
   });

   it('#addValueGrouping should add value grouping', fakeAsync(() => {

      // given
      const entries = generateEntries('Amount', 1000, 0, 1000);
      controller.entries$ = of(entries);

      // when
      controller.addValueGrouping('Amount');
      flush();

      // then
      expect(context.hasValueGrouping('Amount')).toBeTruthy();
      expect(context.valueGroupings[0].columnName).toEqual('Amount');
      const expectedNonGroupedColumns = columns.filter(c => c.name === 'Percent');
      expect(controller.nonGroupedColumns).toEqual(expectedNonGroupedColumns);
   }));

   it('#removeValueGrouping should remove value grouping', () => {

      // given
      const entries = generateEntries('Amount', 1000, 0, 1000);
      controller.entries$ = of(entries);
      controller.addValueGrouping('Amount');
      const amountValueGrouping = context.valueGroupings[0];

      // when
      controller.removeValueGrouping(amountValueGrouping);

      // then
      expect(context.hasValueGrouping('Amount')).toBeFalsy();
      const expectedNonGroupedColumns = columns.filter(c => c.name === 'Amount' || c.name === 'Percent');
      expect(controller.nonGroupedColumns).toEqual(expectedNonGroupedColumns);
   });

   it('#addGroupingValueRange should add range', () => {

      // given
      const entries = generateEntries('Amount', 1000, 0, 1000);
      controller.entries$ = of(entries);
      controller.addValueGrouping('Amount');
      const amountValueGrouping = context.valueGroupings[0];
      const rangesCount = amountValueGrouping.ranges.length;

      // when
      const range = controller.addGroupingValueRange(amountValueGrouping);

      // then
      expect(context.valueGroupings[0]).toBe(amountValueGrouping);
      expect(range).toBeTruthy();
      expect(amountValueGrouping.ranges.includes(range)).toBeTruthy();
      expect(amountValueGrouping.ranges.length).toEqual(rangesCount + 1);
   });

   it('#dropGroupingRange should move range to new position', () => {

      // given
      const entries = generateEntries('Amount', 1000, 0, 1000);
      controller.entries$ = of(entries);
      controller.addValueGrouping('Amount');
      const amountValueGrouping = context.valueGroupings[0];
      const rangesCount = amountValueGrouping.ranges.length;
      const rangeFirst = amountValueGrouping.ranges[0];
      const rangeSecond = amountValueGrouping.ranges[1];

      // when
      const dropEvent = <CdkDragDrop<string[]>>{ previousIndex: 0, currentIndex: 1 }
      controller.dropGroupingRange(amountValueGrouping, dropEvent);

      // then
      expect(context.valueGroupings[0]).toBe(amountValueGrouping);
      expect(amountValueGrouping.ranges.length).toEqual(rangesCount);
      expect(amountValueGrouping.ranges[0]).toBe(rangeSecond);
      expect(amountValueGrouping.ranges[1]).toBe(rangeFirst);
   });

   it('#removeGroupingRange should remove range', () => {

      // given
      const entries = generateEntries('Amount', 1000, 0, 1000);
      controller.entries$ = of(entries);
      controller.addValueGrouping('Amount');
      const amountValueGrouping = context.valueGroupings[0];
      const rangesCount = amountValueGrouping.ranges.length;
      const rangeToRemove = amountValueGrouping.ranges[0];

      // when
      controller.removeGroupingRange(amountValueGrouping, rangeToRemove);

      // then
      expect(context.valueGroupings[0]).toBe(amountValueGrouping);
      expect(amountValueGrouping.ranges.includes(rangeToRemove)).toBeFalsy();
      expect(amountValueGrouping.ranges.length).toEqual(rangesCount - 1);
   });

   it('#groupingRangeStateChanged should fire structure change when column in use', () => {

      // given
      context.dataColumns = [findColumn('Percent')];
      context.groupByColumns = [];
      const range: ValueRange = { max: 100, active: false };
      const valueGrouping = { columnName: 'Percent', ranges: [range] };
      spyOn(context, 'fireStructureChanged');

      // when
      controller.groupingRangeStateChanged(valueGrouping, range, true);

      // then
      expect(range.active).toBe(true);
      expect(context.fireStructureChanged).toHaveBeenCalled();
   });

   it('#groupingRangeStateChanged should fire structure change when grouped by column', () => {

      // given
      context.dataColumns = [findColumn('Level')];
      context.groupByColumns = [findColumn('Percent')];
      const range: ValueRange = { max: 100, active: true };
      const valueGrouping = { columnName: 'Percent', ranges: [range] };
      spyOn(context, 'fireStructureChanged');

      // when
      controller.groupingRangeStateChanged(valueGrouping, range, false);

      // then
      expect(range.active).toBe(false);
      expect(context.fireStructureChanged).toHaveBeenCalled();
   });

   it('#groupingRangeStateChanged should not fire structure change when column not in use', () => {

      // given
      context.dataColumns = [findColumn('Path')];
      context.groupByColumns = [findColumn('Time')];
      const range: ValueRange = { max: 100, active: true };
      const valueGrouping = { columnName: 'Percent', ranges: [range] };
      spyOn(context, 'fireStructureChanged');

      // when
      controller.groupingRangeStateChanged(valueGrouping, range, false);

      // then
      expect(range.active).toBe(false);
      expect(context.fireStructureChanged).not.toHaveBeenCalled();
   });

   it('#setElementPosition should emit onElementPositionChange', () => {

      // given
      spyOn(controller.onElementPositionChange, 'emit');

      // when
      controller.setElementPosition(3);

      // then
      expect(controller.onElementPositionChange.emit).toHaveBeenCalledWith(3);
   });

   it('#isNumericColumn should return true when column is "Number"', () => {
      expect(controller.isNumericColumn(findColumn('Time'))).toBeTruthy();
      expect(controller.isNumericColumn(findColumn('Amount'))).toBeTruthy();
      expect(controller.isNumericColumn(findColumn('Percent'))).toBeTruthy();
   });

   it('#isNumericColumn should return false when column is "Text"', () => {
      expect(controller.isNumericColumn(findColumn('Level'))).toBeFalsy();
      expect(controller.isNumericColumn(findColumn('Host'))).toBeFalsy();
      expect(controller.isNumericColumn(findColumn('Path'))).toBeFalsy();
   });

   it('#isNumericColumn should return false when column is missing', () => {
      expect(controller.isNumericColumn(findColumn(undefined))).toBeFalsy();
      expect(controller.isNumericColumn(findColumn(null))).toBeFalsy();
   });

   it('#isNumberKey should invoke NumberUtils#isNumberKey', () => {

      // given
      spyOn(NumberUtils, 'isNumberKey');

      // when
      const event = new KeyboardEvent('keydown', { key: '1' });
      controller.isNumberKey(event);

      // then
      expect(NumberUtils.isNumberKey).toHaveBeenCalledWith(event);
   });

   function findColumn(name: string): Column {
      return columns.find(c => c.name === name);
   }

   function generateEntries(columnName: string, count: number, minValue: number, maxValue: number): Object[] {
      const entries: Object[] = new Array(count);
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


