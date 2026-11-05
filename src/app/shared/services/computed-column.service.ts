import { Injectable } from '@angular/core';
import { Column, DataType, Scene } from 'app/shared/model';
import { ColumnNameConverter } from 'app/shared/utils/column-name-converter';
import { isComputedColumn, isOperandColumn } from 'app/shared/utils/column-utils';
import { Subject } from 'rxjs';
import { CouchDBConstants } from './backend/couchdb/couchdb-constants';
import { DBService } from './backend/db.service';
import { QueryConverter } from './backend/mango/query-converter';
import { RawDataStateService } from './saved-views/raw-data-state.service';
import { ColumnReferenceUpdater } from './view-persistence/column-references/column-reference-updater';
import { ViewPersistenceService } from './view-persistence/view-persistence.service';
import { ViewTabsService } from './view-tabs/view-tabs.service';

/**
 * name is undefined when the computed column was removed
 */
export interface ComputedColumnChange {
  name: string;
  previousName: string;
}

/**
 * maintains the computed columns of the active scene
 */
@Injectable({
  providedIn: 'root'
})
export class ComputedColumnService {

  /**
   * besides the fields of CouchDB and table styles '__proto__', which as property name sets the prototype instead of a value
   */
  static readonly RESERVED_NAMES = [CouchDBConstants._ID, CouchDBConstants._REV, ...QueryConverter.TABLE_STYLE_FIELDS, '__proto__'];

  private readonly changedSubject = new Subject<ComputedColumnChange>();

  /**
   * emits synchronously after a computed column was successfully saved or removed
   */
  readonly changed$ = this.changedSubject.asObservable();

  constructor(private dbService: DBService, private viewTabsService: ViewTabsService,
    private viewPersistenceService: ViewPersistenceService, private rawDataStateService: RawDataStateService) { }

  columns(): Column[] {
    return this.scene().columns.filter(isComputedColumn);
  }

  operandColumns(): Column[] {
    return this.scene().columns.filter(isOperandColumn);
  }

  canCreate(): boolean {
    return this.operandColumns().length > 0;
  }

  /**
   * @returns the names of all scene columns, the time grouping labels of time columns and the reserved names,
   * except the name of the computed column of the specified name
   */
  usedNames(exceptName?: string): string[] {
    const editedName = this.columns().some(c => c.name === exceptName) ? exceptName : undefined;
    return this.scene().columns.map(c => c.name)
      .concat(this.timeGroupingLabels(), ComputedColumnService.RESERVED_NAMES)
      .filter(n => n !== editedName);
  }

  /**
   * replaces the computed column of the previous name or appends the specified column when none exists
   */
  async save(column: Column, previousName = column.name): Promise<void> {
    const columns = this.scene().columns;
    if (this.usedNames(previousName).includes(column.name)) {
      throw new Error('column name "' + column.name + '" is already in use');
    }
    if (columns.some(c => c.name === previousName && !isComputedColumn(c))) {
      throw new Error('column "' + previousName + '" is not a computed column');
    }
    const index = columns.findIndex(c => c.name === previousName);
    const newColumns = index < 0 ? [...columns, column] : columns.map((c, i) => i === index ? column : c);
    return this.update(newColumns, { name: column.name, previousName });
  }

  /**
   * removes the computed column of the specified name and all references to it, does nothing when no such column exists
   */
  async remove(name: string): Promise<void> {
    if (!this.columns().some(c => c.name === name)) {
      return;
    }
    const columns = this.scene().columns.filter(c => !(isComputedColumn(c) && c.name === name));
    return this.update(columns, { name: undefined, previousName: name });
  }

  private async update(columns: Column[], change: ComputedColumnChange): Promise<void> {
    const scene = this.scene();
    const previousColumns = scene.columns;
    const updater = new ColumnReferenceUpdater(change);
    scene.columns = columns;
    const undo = updater.affectsReferences() ? updater.inSavedViews(this.viewPersistenceService.findSavedViews(scene)) : undefined;
    try {
      await this.dbService.updateScene(scene);
    } catch (err) {
      scene.columns = previousColumns;
      undo?.();
      throw err;
    }
    this.viewTabsService.updateColumnReferences(change);
    this.rawDataStateService.updateColumnReferences(change);
    this.changedSubject.next(change);
  }

  private timeGroupingLabels(): string[] {
    return this.scene().columns
      .filter(c => c.dataType === DataType.TIME)
      .flatMap(c => ColumnNameConverter.RELEVANT_TIME_UNITS.map(u => ColumnNameConverter.toLabel(c, u)));
  }

  private scene(): Scene {
    return this.dbService.getActiveScene();
  }
}
