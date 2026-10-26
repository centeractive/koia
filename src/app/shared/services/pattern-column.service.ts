import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { Column, ColumnPair, DataType, Scene } from 'app/shared/model';
import { CommonUtils } from 'app/shared/utils';
import { canDerivePattern, patternColumnName } from 'app/shared/utils/column-utils';
import { PatternMasker } from 'app/shared/utils/pattern-masker';
import { DBService } from './backend/db.service';
import { ComputedColumnService } from './computed-column.service';
import { LanguageService } from './language';

/**
 * adds pattern columns to existing scenes, see [[PatternMasker]]
 */
@Injectable({
  providedIn: 'root'
})
export class PatternColumnService {

  static readonly PATTERN_SAMPLE_SIZE = 100;

  constructor(private dbService: DBService, private router: Router) { }

  /**
   * @returns the names of the columns a pattern column can be derived from and whose sampled values are free text
   */
  async suitableColumnNames(scene: Scene): Promise<Set<string>> {
    const candidates = scene.columns.filter(c => canDerivePattern(c, scene.columns)).map(c => c.name);
    if (!candidates.length) {
      return new Set();
    }
    const sample = await this.dbService.findSampleEntries(scene.database, PatternColumnService.PATTERN_SAMPLE_SIZE);
    return new Set(candidates.filter(name => PatternMasker.suitsColumn(sample, name)));
  }

  /**
   * writes the pattern of the specified column into every entry of the scene, indexes it and adds the pattern column to the
   * scene (the UI offers it for [[suitableColumnNames]] only), the active scene is updated in place and its views are rebuilt on the next navigation.
   *
   * A failure leaves the scene without pattern column, adding it again repeats only what is missing. Should the scene update
   * fail after the index was created, the entry count of the scene is one too high until the pattern column is added again.
   * The name of the pattern column contains a translated suffix, so it depends on the current language.
   *
   * @param onProgress receives the number of entries processed so far
   * @returns the added pattern column
   */
  async add(sceneId: string, columnName: string, onProgress: (count: number) => void): Promise<Column> {
    const activeScene = this.dbService.getActiveScene();
    const scene = activeScene?._id === sceneId ? activeScene : await this.dbService.findScene(sceneId);
    const column = this.patternColumnOf(scene, columnName);
    await this.dbService.addPatternField(scene.database, columnName, column.name, onProgress);
    await this.dbService.createColumnIndex(scene.database, column.name);
    await this.addToScene(scene, column);
    if (scene === activeScene) {
      (this.router.routeReuseStrategy as AppRouteReuseStrategy).clear();
    }
    return column;
  }

  private patternColumnOf(scene: Scene, columnName: string): Column {
    const source = scene.columns.find(c => c.name === columnName);
    if (!source) {
      throw new Error('column "' + columnName + '" does not exist');
    }
    if (!canDerivePattern(source, scene.columns)) {
      throw new Error('no pattern column can be added to column "' + columnName + '"');
    }
    const usedNames = new Set([...scene.columns.map(c => c.name), ...ComputedColumnService.RESERVED_NAMES]);
    const name = patternColumnName(columnName, usedNames, LanguageService.instant('scene.column.patternSuffix'));
    return { name, dataType: DataType.TEXT, width: source.width, indexed: true, patternOf: columnName };
  }

  /**
   * adds the column and, when the scene has a mapping of the source column, a pattern mapping, so that adopting the column
   * mappings of the scene on import keeps the pattern column
   */
  private async addToScene(scene: Scene, column: Column): Promise<void> {
    const previousColumns = scene.columns;
    const previousColumnMappings = scene.columnMappings;
    scene.columns = [...scene.columns, column];
    const columnPair = scene.columnMappings?.find(cp => !cp.skip && cp.target.name === column.patternOf);
    if (columnPair) {
      const patternPair: ColumnPair = { source: CommonUtils.clone(columnPair.source), target: CommonUtils.clone(column) };
      scene.columnMappings = [...scene.columnMappings, patternPair];
    }
    try {
      await this.dbService.updateScene(scene);
    } catch (err) {
      scene.columns = previousColumns;
      scene.columnMappings = previousColumnMappings;
      throw err;
    }
  }
}
