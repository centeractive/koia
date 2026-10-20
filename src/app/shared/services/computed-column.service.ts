import { Injectable } from '@angular/core';
import { Column, Scene } from 'app/shared/model';
import { isComputedColumn, isOperandColumn } from 'app/shared/utils/column-utils';
import { Subject } from 'rxjs';
import { CouchDBConstants } from './backend/couchdb/couchdb-constants';
import { DBService } from './backend/db.service';
import { QueryConverter } from './backend/mango/query-converter';
import { RawDataStateService } from './saved-views/raw-data-state.service';
import { ViewColumnRenamer } from './view-persistence/view-column-renamer';
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

  static readonly RESERVED_NAMES = [CouchDBConstants._ID, CouchDBConstants._REV, ...QueryConverter.TABLE_STYLE_FIELDS];

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

  /**
   * @returns the names of all scene columns except the computed column of the specified name, plus the reserved names
   */
  usedNames(exceptName?: string): string[] {
    return this.scene().columns
      .filter(c => !(isComputedColumn(c) && c.name === exceptName))
      .map(c => c.name)
      .concat(ComputedColumnService.RESERVED_NAMES);
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

  async remove(name: string): Promise<void> {
    const columns = this.scene().columns.filter(c => !(isComputedColumn(c) && c.name === name));
    return this.update(columns, { name: undefined, previousName: name });
  }

  private async update(columns: Column[], change: ComputedColumnChange): Promise<void> {
    const scene = this.scene();
    const previousColumns = scene.columns;
    const renamed = change.name !== undefined && change.name !== change.previousName;
    scene.columns = columns;
    const undoRename = renamed ? new ViewColumnRenamer(change.previousName, change.name).renameInSavedViews(this.viewPersistenceService.findSavedViews(scene)) : undefined;
    try {
      await this.dbService.updateScene(scene);
    } catch (err) {
      scene.columns = previousColumns;
      undoRename?.();
      throw err;
    }
    if (renamed) {
      this.viewTabsService.renameColumn(change.previousName, change.name);
      this.rawDataStateService.renameColumn(change.previousName, change.name);
    }
    this.changedSubject.next(change);
  }

  private scene(): Scene {
    return this.dbService.getActiveScene();
  }
}
