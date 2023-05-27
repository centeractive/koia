import { EventEmitter } from '@angular/core';
import { Aggregation } from './aggregation.enum';
import { Query } from './query';
import { ChangeEvent } from './change-event.enum';
import { ValueGrouping } from '../value-range/model/value-grouping.type';
import { ArrayUtils } from '../utils/array-utils';
import { Column } from './column.type';
import { ExportFormat } from './export-format.enum';
import { DataType } from './data-type.enum';
import { ColorProvider, ColorProviderFactory } from '../color';
import * as _ from 'lodash';

export abstract class ElementContext {

   private changeEventEmitter = new EventEmitter<ChangeEvent>(true);

   private _title: string;

   private _gridColumnSpan: number;
   private _gridRowSpan: number;
   private _width: number;
   private _height: number;

   private _query: Query;
   private _dataColumns: Column[] = [];
   private _splitColumns: Column[] = [];
   private _groupByColumns: Column[] = [];
   private _aggregations: Aggregation[] = [];
   private _valueGroupings: ValueGrouping[] = [];

   private _colorProvider: ColorProvider;

   // transient
   private _silent: boolean;
   private _columns: Column[];
   private _entries: object[];
   private _warning: string;

   constructor(columns: Column[]) {
      this._columns = columns;
      this._gridColumnSpan = 1;
      this._gridRowSpan = 1;
      this._width = 600;
      this._height = 400;
      this._groupByColumns = [];
      this._aggregations = [Aggregation.COUNT];
      this._valueGroupings = [];
      this._colorProvider = ColorProviderFactory.create();
   }

   public get title(): string {
      return this._title;
   }
   public set title(value: string) {
      this._title = value;
   }

   get gridColumnSpan(): number {
      return this._gridColumnSpan;
   }

   set gridColumnSpan(gridColumnSpan: number) {
      if (this._gridColumnSpan !== gridColumnSpan) {
         this._gridColumnSpan = gridColumnSpan;
         this.fireSizeChanged();
      }
   }

   get gridRowSpan(): number {
      return this._gridRowSpan;
   }

   set gridRowSpan(gridRowSpan: number) {
      if (this._gridRowSpan !== gridRowSpan) {
         this._gridRowSpan = gridRowSpan;
         this.fireSizeChanged();
      }
   }

   get width(): number {
      return this._width;
   }

   get height(): number {
      return this._height;
   }

   setSize(width: number, height: number): void {
      if (this._width !== width || this._height !== height) {
         this._width = width;
         this._height = height;
         this.fireSizeChanged();
      }
   }

   get query(): Query {
      return this._query;
   }

   set query(query: Query) {
      this._query = query;
   }

   get dataColumns(): Column[] {
      return this._dataColumns.slice(0);
   }

   set dataColumns(dataColumns: Column[]) {
      this._dataColumns = dataColumns || [];
      this._groupByColumns = this._groupByColumns.filter(c => !this._dataColumns.includes(c));
      this.fireStructureChanged();
   }

   /**
    * @returns [[true]] if at least on data column is defined, [[false]] otherwise
    */
   hasDataColumn(): boolean {
      return this._dataColumns.length > 0;
   }

   get splitColumns(): Column[] {
      return this._splitColumns.slice(0);
   }

   set splitColumns(splitColumns: Column[]) {
      this._splitColumns = splitColumns || [];
      this._groupByColumns = this._groupByColumns.filter(c => !this._splitColumns.includes(c));
      this.fireStructureChanged();
   }

   isInUseAsDataColumn(column: Column): boolean {
      return this._dataColumns.find(c => c === column) !== undefined;
   }

   addDataColumn(dataColumn: Column) {
      this._dataColumns.push(dataColumn);
      this._groupByColumns = this._groupByColumns.filter(c => c !== dataColumn);
      this.fireStructureChanged();
   }

   removeDataColumn(dataColumn: Column) {
      this._dataColumns = this._dataColumns.filter(c => c !== dataColumn);
      this.fireStructureChanged();
   }

   /**
    * @returns [[true]] if the specified column is used either as data column or for grouping, [[false]] otherwise
    */
   isColumnInUse(columnName: string): boolean {
      if (this._dataColumns.map(c => c.name).includes(columnName)) {
         return true;
      }
      return this._groupByColumns.find(c => c.name === columnName) !== undefined;
   }

   get groupByColumns(): Column[] {
      return this._groupByColumns.slice(0);
   }

   set groupByColumns(columns: Column[]) {
      this._groupByColumns = columns || [];
      this.fireStructureChanged();
   }

   isAnyColumnWithValueGroupingInUse(): boolean {
      for (const column of this.valueGroupings.map(g => g.columnName)) {
         if (this.isColumnInUse(column)) {
            return true;
         }
      }
      return false;
   }

   get aggregations(): Aggregation[] {
      return this._aggregations.slice(0);
   }

   set aggregations(aggregations: Aggregation[]) {
      if (aggregations && aggregations.length > 1 && aggregations.find(a => a === Aggregation.COUNT)) {
         throw new Error(Aggregation.COUNT + ' must not be combined with other aggregations');
      }
      this._aggregations = aggregations || [];
      this.fireStructureChanged();
   }

   isAggregationCountSelected(): boolean {
      return this._aggregations.length === 1 && this._aggregations[0] === Aggregation.COUNT;
   }

   get valueGroupings(): ValueGrouping[] {
      return this._valueGroupings.slice(0);
   }

   set valueGroupings(valueGroupings: ValueGrouping[]) {
      this._valueGroupings = valueGroupings || [];
      this.fireStructureChanged();
   }

   addValueGrouping(valueGrouping: ValueGrouping) {
      this._valueGroupings.push(valueGrouping);
      if (this.isColumnInUse(valueGrouping.columnName)) {
         this.fireStructureChanged();
      }
   }

   removeValueGrouping(valueGrouping: ValueGrouping) {
      ArrayUtils.removeElement(this._valueGroupings, valueGrouping);
      if (this.isColumnInUse(valueGrouping.columnName)) {
         this.fireStructureChanged();
      }
   }

   hasValueGrouping(columnName: string): boolean {
      return this.valueGroupings
         .map(g => g.columnName)
         .includes(columnName);
   }

   get colorProvider(): ColorProvider {
      return this._colorProvider;
   }

   set colorProvider(colorProvider: ColorProvider) {
      if (!_.isEqual(this._colorProvider.options, colorProvider.options)) {
         this._colorProvider = colorProvider;
         this.fireLookChanged();
      }
   }

   get columns(): Column[] {
      return this._columns;
   }

   getNumericColumns(): Column[] {
      return this._columns.filter(c => c.dataType === DataType.NUMBER || c.dataType === DataType.TIME);
   }

   getTextColumns(): Column[] {
      return this._columns.filter(c => c.dataType === DataType.TEXT);
   }

   get entries(): object[] {
      return this._entries;
   }

   set entries(entries: object[]) {
      this._entries = entries;
      this.fireStructureChanged();
   }

   /**
    * tells the context to fire change events or not
    */
   set silent(silent: boolean) {
      this._silent = silent;
   }

   abstract getTitle(): string;

   abstract getSupportedExportFormats(): ExportFormat[];

   get warning(): string {
      return this._warning;
   }

   set warning(value: string) {
      this._warning = value;
   }

   /**
     * registers a handler for change events emitted by this instance
     *
     * @param eventHandler custom handler for emitted events of type <ChangeEvent>
    */
   subscribeToChanges(eventHandler: any): void {
      this.changeEventEmitter.subscribe(eventHandler);
   }

   fireLookChanged(): void {
      this.fireContextChanged(ChangeEvent.LOOK);
   }

   fireSizeChanged(): void {
      this.fireContextChanged(ChangeEvent.SIZE);
   }

   fireStructureChanged(): void {
      this.fireContextChanged(ChangeEvent.STRUCTURE);
   }

   private fireContextChanged(changeEvent: ChangeEvent): void {
      if (!this._silent) {
         this.changeEventEmitter.emit(changeEvent);
      }
   }
}
