import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NotificationService } from 'app/shared/services';
import { Route, Scene, Attribute, DataType, Column, ColumnPair } from 'app/shared/model';
import { Router } from '@angular/router';
import { MatBottomSheet, MatAccordion } from '@angular/material';
import { DBService } from 'app/shared/services/backend';
import { DataReader, DataHandler, ReaderService } from '../shared/services/reader';
import { SceneUtils, ColumnDefinitionAssistant } from './utils';
import { ProgressMonitor, EntryPersister } from './persister';
import { ValueFormatter, DateTimeUtils, ArrayUtils } from 'app/shared/utils';
import { DatePipe } from '@angular/common';
import { ConfinedStringSet, MappingResult, ColumnMappingGenerator, EntryMapper } from './mapper';
import { AbstractComponent } from 'app/shared/controller';

@Component({
  selector: 'koia-front',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.css']
})
export class SceneComponent extends AbstractComponent implements OnInit {

  private static readonly HEADER_SIZE = 10_000;
  private static readonly SAMPLE_SIZE = 100;
  private static readonly BATCH_SIZE = 1_000;

  readonly urlRawdata = '/' + Route.RAWDATA;
  readonly urlGrid = '/' + Route.GRID;
  readonly urlFlex = '/' + Route.FLEX;
  readonly urlPivot = '/' + Route.PIVOT;

  readonly columnDefinitions = 'Column Definitions';
  readonly columnDefAssistant = new ColumnDefinitionAssistant();
  readonly now = new Date();
  readonly datePipe = new DatePipe('en-US');

  @ViewChild(MatAccordion, undefined) accordion: MatAccordion;
  @ViewChild('fileInput', undefined) fileInputRef: ElementRef<HTMLInputElement>;

  readers: DataReader[];
  selectedReader: DataReader;
  file: File;
  fileHeader: string;
  readerAttributes: Attribute[];
  locales: string[];
  selectedLocale: string;
  columnMappings: ColumnPair[];
  targetColumnNames: string[];
  dateFormats: string[];
  previewData: MappingResult[];
  scene: Scene;
  feedback: string;
  percentPersisted: number;
  entryPersister: EntryPersister;
  usesBrowserStorage: boolean;
  maxItemsPerScene: number;
  maxItemsToLoad: number;
  abortDataloadOnError = true;
  progressBarMode: string;

  private generatedSceneName: string;
  private generatedSceneShortDesc: string;
  private sampleEntries: Object[];
  private columnFactory = new ColumnMappingGenerator();
  private mappingErrors = new ConfinedStringSet(10);
  private valueFormatter = new ValueFormatter();
  private canceled = false;

  constructor(public router: Router, bottomSheet: MatBottomSheet, private readerService: ReaderService,
    private dbService: DBService, notificationService: NotificationService) {
      super(bottomSheet, notificationService);
  }

  ngOnInit() {
    this.dateFormats = DateTimeUtils.allTimeUnits('desc').map(timeunit => DateTimeUtils.ngFormatOf(timeunit));
    this.readers = this.readerService.getReaders();
    this.selectedReader = this.readers[0];
    this.defineLocales();
    this.dbService.initBackend()
      .then(r => this.initScene())
      .catch(err => this.notifyError(err));
    this.fileInputRef.nativeElement.addEventListener('change', c => this.onFileSelChange(this.fileInputRef.nativeElement.files));
  }

  private defineLocales(): void {
    this.locales = DateTimeUtils.listMomentLocals();
    this.selectedLocale = this.locales.includes('en') ? 'en' : this.locales[0];
  }

  private initScene(): void {
    this.dbService.findFreeDatabaseName()
      .then(db => {
        this.scene = SceneUtils.createScene(db);
        this.usesBrowserStorage = this.dbService.usesBrowserStorage();
        this.maxItemsPerScene = this.dbService.getMaxDataItemsPerScene();
        this.maxItemsToLoad = this.maxItemsPerScene;
        this.entryPersister = this.createEntryPersister();
      })
      .catch(err => this.notifyError(err));
  }

  private createEntryPersister(): EntryPersister {
    const progressMonitor: ProgressMonitor = {
      onProgress: (percent, message) => {
        this.percentPersisted = percent;
        this.feedback = message + (this.canceled ? ' aborting...' : '');
      },
      onComplete: msg => this.entryPersisterCompleted(msg),
      onError: err => {
        this.notifyError(err);
        this.progressBarMode = undefined;
      }
    };
    return new EntryPersister(this.dbService, this.scene.database, SceneComponent.BATCH_SIZE, progressMonitor);
  }

  private entryPersisterCompleted(msg: string) {
    const canceledHint = this.canceled ? 'Loading canceled: ' : '';
    if (this.mappingErrors.size() > 0) {
      this.notifyWarning(canceledHint + msg + ', ' + this.mappingErrors.size() + ' mapping errors did occur...\n\n' +
        this.mappingErrors.toString());
    } else if (this.canceled) {
      this.notifyWarning(canceledHint + msg);
    } else {
      this.notifySuccess(msg);
    }
    this.progressBarMode = undefined;
    this.router.navigateByUrl(Route.SCENES);
  }

  onSourceTypeChange() {
    this.fileInputRef.nativeElement.value = '';
    this.initContext();
  }

  onFileSelChange(files: FileList): void {
    this.initContext();
    if (files.length > 0) {
      this.file = files[0];
      this.scene.context = SceneUtils.fileContextInfo(this.file);
      this.readerService.readHeader(this.file, SceneComponent.HEADER_SIZE)
        .then(data => this.onDataSample(data))
        .catch(err => this.notifyError(err));
    }
  }

  private onDataSample(data: string): void {
    if (!this.scene.name || this.scene.name === this.generatedSceneName) {
      this.generatedSceneName = SceneUtils.generateSceneName(this.selectedReader, this.file);
      this.scene.name = this.generatedSceneName;
    }
    if (!this.scene.shortDescription || this.scene.shortDescription === this.generatedSceneShortDesc) {
      this.generatedSceneShortDesc = SceneUtils.generateSceneDescription(this.selectedReader, this.file);
      this.scene.shortDescription = this.generatedSceneShortDesc;
    }
    if (this.selectedReader.expectsPlainTextData()) {
      this.fileHeader = data + (this.file.size > SceneComponent.HEADER_SIZE ? '...' : '');
    } else {
      this.fileHeader = '*** binary data cannot be displayed ***';
    }
    this.readerAttributes = this.selectedReader.furnishAttributes(this.fileHeader);
  }

  initContext(): void {
    this.file = undefined;
    this.fileHeader = undefined;
    this.sampleEntries = undefined;
    this.columnMappings = undefined;
    this.feedback = undefined;
  }

  readSample(): void {
    const url = URL.createObjectURL(this.file);
    this.selectedReader.readSample(url, SceneComponent.SAMPLE_SIZE)
      .then(sample => {
        this.closeExpPanelsAbove(this.columnDefinitions);
        this.sampleEntries = sample.entries ? sample.entries : SceneUtils.entriesFromTableData(sample);
        this.columnMappings = this.columnFactory.generate(this.sampleEntries, this.selectedLocale);
        this.onColumnChanged();
      })
      .catch(err => this.notifyError(err));
  }

  deleteColumnMapping(columnPair: ColumnPair): void {
    ArrayUtils.removeElement(this.columnMappings, columnPair);
    this.onColumnChanged();
  }

  formattedNow(format: string): string {
    return this.datePipe.transform(this.now, format);
  }

  formatValue(column: Column, entry: Object): any {
    return this.valueFormatter.formatValue(column, entry[column.name]);
  }

  onDataTypeChanged(targetColumn: Column): void {
    if (targetColumn.dataType === DataType.TIME && !targetColumn.format) {
      targetColumn.format = this.dateFormats[0];
    }
    this.onColumnChanged();
  }

  onColumnChanged(): void {
    this.targetColumnNames = this.columnMappings.map(cp => cp.target.name);
    this.previewData = new EntryMapper(this.columnMappings, this.selectedLocale).mapObjects(this.sampleEntries);
  }

  openDatePipeFormatPage() {
    window.open('https://angular.io/api/common/DatePipe#custom-format-options');
  }

  isPreviewDirty(): boolean {
    return this.previewData && this.previewData.find(mr => mr.errors.length > 0) !== undefined;
  }

  loadScene() {
    this.scene.creationTime = new Date().getTime();
    this.scene.columns = this.columnMappings.map(cp => cp.target);
    this.accordion.closeAll();
    this.progressBarMode = 'query';
    this.feedback = 'initializing data load...';
    this.dbService.persistScene(this.scene, false)
      .then(r => this.loadData())
      .catch(err => this.notifyError(err));
  }

  private loadData(): void {
    this.feedback = 'reading data...';
    this.mappingErrors.clear();
    this.entryPersister.reset();
    const entryMapper = new EntryMapper(this.columnMappings, this.selectedLocale);
    const dataHandler: DataHandler = this.createDataHandler(entryMapper);
    console.log('start loading file ' + this.file.name + ' of type ' + this.file.type);
    const url = URL.createObjectURL(this.file);
    setTimeout(() => this.selectedReader.readData(url, SceneComponent.BATCH_SIZE, dataHandler), 500); // let UI update itself
  }

  private createDataHandler(entryMapper: EntryMapper): DataHandler {
    return {
      onValues: rows => this.persistEntries(entryMapper.mapRows(rows)),
      onEntries: entries => this.persistEntries(entryMapper.mapObjects(entries)),
      onError: err => this.notifyError(err),
      onComplete: () => {
        this.progressBarMode = 'determinate';
        this.entryPersister.postingComplete(true);
        console.log('finished reading data');
      },
      isCanceled: () => this.entryPersister.isPostingComplete()
    };
  }

  private persistEntries(mappingResults: MappingResult[]) {
    if (!this.entryPersister.isPostingComplete()) {
      mappingResults
        .filter(mr => mr.errors.length > 0)
        .forEach(mr => this.mappingErrors.addAll(mr.errors));
      if (this.mappingErrors.size() > 0 && this.abortDataloadOnError) {
        this.entryPersister.postingComplete(false);
      } else {
        const entries = mappingResults
          .filter(mr => mr.entry)
          .map(mr => mr.entry);
        if (this.entryPersister.getPosted() + entries.length > this.maxItemsToLoad) {
          this.entryPersister.post(entries.slice(0, this.maxItemsToLoad - this.entryPersister.getPosted()));
          this.entryPersister.postingComplete(true);
        } else {
          this.entryPersister.post(entries);
        }
      }
    }
  }

  private closeExpPanelsAbove(headerName: string): void {
    const headerNumber = Number(headerName.charAt(0));
    const headers = this.accordion._headers.toArray();
    for (let i = 0; i < headerNumber - 1; i++) {
      if (headers[i]._isExpanded()) {
        headers[i]._toggle();
      }
    }
    if (headers[headerNumber - 1]) {
      headers[headerNumber - 1].focus();
    }
  }

  cancel() {
    if (this.scene.creationTime && !this.entryPersister.isPostingComplete()) {
      this.canceled = true;
      this.entryPersister.postingComplete(false);
    } else {
      this.router.navigateByUrl(Route.SCENES);
    }
  }
}
