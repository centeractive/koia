import { Location } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatAccordion } from '@angular/material/expansion';
import { ProgressBarMode } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { Attribute, ColumnPair, Route, Scene, SceneInfo } from 'app/shared/model';
import { NotificationService } from 'app/shared/services';
import { LanguageService } from 'app/shared/services/language';
import { DBService } from 'app/shared/services/backend';
import { CommonUtils, NumberUtils } from 'app/shared/utils';
import { CHARACTER_SETS } from 'app/shared/utils/charactersets';
import { LocaleUtils } from 'app/shared/utils/i18n/locale-utils';
import { PromiseProgressMonitor } from 'app/shared/utils/promise-progress-monitor';
import { formattedNumberValidator } from 'app/shared/validator/number-validator';
import { DataHandler, DataReader, ReaderService } from '../shared/services/reader';
import { ColumnMappingGenerator, ConfinedStringSet, EntryMapper, MappingResult } from './column-mapping/mapper';
import { EntryPersister, ProgressMonitor } from './persister';
import { SceneUtils } from './utils';

@Component({
  selector: 'koia-front',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class SceneComponent extends AbstractComponent implements OnInit, AfterViewInit {

  private static readonly HEADER_SIZE = 10_000;
  private static readonly SAMPLE_SIZE = 100;
  private static readonly BATCH_SIZE = 1_000;

  readonly urlFront = '/' + Route.FRONT;
  readonly urlScenes = '/' + Route.SCENES;

  @ViewChild(MatAccordion) accordion: MatAccordion;
  @ViewChild('fileInput') fileInputRef: ElementRef<HTMLInputElement>;

  readers: DataReader[];
  selectedReader: DataReader;
  currSourceName: string;
  file: File;
  characterSets = CHARACTER_SETS;
  encoding = CHARACTER_SETS[0];
  fileHeader: string;
  readerAttributes: Attribute[];
  locales: string[];
  selectedLocale: string;
  columnMappingsSourceCandidates: SceneInfo[];
  adoptColumnsFromExistingScene = false;
  columnMappingsSource: SceneInfo;
  columnMappings: ColumnPair[];
  columnMappingsValid: boolean;
  targetColumnNames: string[];
  readingSample: boolean;
  previewData: MappingResult[];
  scenesExist: boolean;
  scene: Scene;
  maxItemsPerScene: number;
  feedback: string;
  percentPersisted: number;
  entryPersister: EntryPersister;
  maxItemsToLoadControl: FormControl<number>;
  abortDataloadOnError = false;
  progressBarMode: ProgressBarMode;
  canceled = false;

  private generatedSceneName: string;
  private generatedSceneShortDesc: string;
  private sampleEntries: object[];
  private columnFactory = new ColumnMappingGenerator();
  private mappingErrors = new ConfinedStringSet(10);
  private fileDialogOpen = false;
  private loadFailed = false;
  private previousContext: Pick<SceneComponent, 'file' | 'fileHeader' | 'columnMappings' | 'feedback'> & { sampleEntries: object[] } | undefined;

  constructor(private router: Router, private location: Location, bottomSheet: MatBottomSheet, private readerService: ReaderService,
    private dbService: DBService, notificationService: NotificationService) {
    super(bottomSheet, notificationService);
  }

  ngOnInit(): void {
    if (!this.dbService.isBackendInitialized()) {
      this.router.navigateByUrl(Route.FRONT);
    } else {
      this.readers = this.readerService.getReaders();
      this.selectedReader = this.readers[0];
      this.currSourceName = this.selectedReader.getSourceName();
      this.defineLocales();
      this.collectColumnMappingSources();
      this.initScene();
      this.detectIfScenesExist();
    }
  }

  ngAfterViewInit(): void {
    this.fileInputRef.nativeElement.addEventListener('change', () => this.onFileSelChange(this.fileInputRef.nativeElement.files));
    this.fileInputRef.nativeElement.addEventListener('cancel', () => this.restorePreviousContext());
  }

  private defineLocales(): void {
    this.locales = LocaleUtils.supportedLocales();
    if (this.locales.includes(LocaleUtils.osDefaultLocale())) {
      this.selectedLocale = LocaleUtils.osDefaultLocale();
    } else if (this.locales.includes(LocaleUtils.browserDefaultLocale())) {
      this.selectedLocale = LocaleUtils.browserDefaultLocale();
    } else if (this.locales.includes('en-US')) {
      this.selectedLocale = 'en-US';
    } else if (this.locales.includes('en')) {
      this.selectedLocale = 'en';
    } else {
      this.selectedLocale = this.locales[0];
    }
  }

  private detectIfScenesExist(): void {
    this.dbService.findSceneInfos()
      .then(sceneInfos => this.scenesExist = sceneInfos && sceneInfos.length > 0);
  }

  private collectColumnMappingSources(): void {
    this.dbService.findSceneInfos().then(sceneInfos => {
      this.columnMappingsSourceCandidates = sceneInfos.filter(si => si.columnMappings);
      if (this.columnMappingsSourceCandidates.length > 0) {
        this.columnMappingsSource = this.columnMappingsSourceCandidates[0];
      }
    });
  }

  private initScene(): void {
    this.dbService.findFreeDatabaseName()
      .then(db => {
        this.scene = SceneUtils.createScene(db);
        this.maxItemsPerScene = this.dbService.getMaxDataItemsPerScene();
        this.maxItemsToLoadControl = new FormControl<number>(this.maxItemsPerScene, [Validators.required, formattedNumberValidator(1, this.maxItemsPerScene)]);
        this.entryPersister = this.createEntryPersister();
      })
      .catch(err => this.notifyError(err));
  }

  private createEntryPersister(): EntryPersister {
    const progressMonitor: ProgressMonitor = {
      onProgress: (percent, message) => {
        this.percentPersisted = percent;
        this.feedback = this.canceled ? LanguageService.instant('scene.aborting', { message }) : message;
      },
      onComplete: msg => this.entryPersisterCompleted(msg),
      onError: err => {
        this.loadFailed = true;
        this.notifyError(err);
        this.progressBarMode = undefined;
      }
    };
    return new EntryPersister(this.dbService, this.scene.database, SceneComponent.BATCH_SIZE, progressMonitor);
  }

  private entryPersisterCompleted(msg: string): void {
    if (!this.loadFailed) {
      const message = this.canceled ? LanguageService.instant('scene.loadingCanceled', { message: msg }) : msg;
      if (this.mappingErrors.size() > 0) {
        this.notifyWarning(LanguageService.instant('scene.mappingErrors', { message, count: this.mappingErrors.size() }) + '\n\n' +
          this.mappingErrors.toString());
      } else if (this.canceled) {
        this.notifyWarning(message);
      } else {
        this.notifySuccess(msg);
      }
    }
    this.progressBarMode = undefined;
    this.router.navigateByUrl(Route.SCENES);
  }

  onSourceTypeChange(): void {
    this.currSourceName = this.selectedReader.getSourceName();
    this.fileInputRef.nativeElement.value = '';
    this.initContext();
  }

  selectFile(): void {
    this.fileInputRef.nativeElement.value = '';
    this.fileDialogOpen = true;
    this.fileInputRef.nativeElement.click();
  }

  /**
   * browsers fire the file input 'change' event up to several seconds after the file dialog was closed,
   * the window regaining focus is the earliest sign of a file being selected
   */
  @HostListener('window:focus')
  onWindowFocus(): void {
    if (this.fileDialogOpen) {
      this.fileDialogOpen = false;
      this.previousContext = { file: this.file, fileHeader: this.fileHeader, sampleEntries: this.sampleEntries,
        columnMappings: this.columnMappings, feedback: this.feedback };
      this.initContext();
      this.readingSample = true;
    }
  }

  onFileSelChange(files: FileList): void {
    if (!files.length) {
      this.restorePreviousContext();
      return;
    }
    this.fileDialogOpen = false;
    this.previousContext = undefined;
    this.initContext();
    this.file = files[0];
    this.scene.context = SceneUtils.fileContextInfo(this.file);
    this.readDataSample();
  }

  private restorePreviousContext(): void {
    this.fileDialogOpen = false;
    this.readingSample = false;
    if (this.previousContext) {
      Object.assign(this, this.previousContext);
      this.previousContext = undefined;
    }
  }

  onCharacterEncodingChange(): void {
    if (this.file) {
      this.initContext(true);
      this.readDataSample();
    }
  }

  private async readDataSample(): Promise<void> {
    this.readingSample = true;
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    this.readerService.readHeader(this.file, SceneComponent.HEADER_SIZE, this.encoding)
      .then(data => this.onDataSample(data))
      .catch(err => this.notifyError(err))
      .finally(() => this.readingSample = false);
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
    this.readerAttributes = this.selectedReader.furnishAttributes(this.fileHeader, this.selectedLocale);
  }

  initContext(keepFile = false): void {
    if (!keepFile) {
      this.file = undefined;
    }
    this.fileHeader = undefined;
    this.sampleEntries = undefined;
    this.columnMappings = undefined;
    this.feedback = undefined;
  }

  async readSample(): Promise<void> {
    this.readingSample = true;
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    this.selectedReader.readSample(this.file, SceneComponent.SAMPLE_SIZE, this.encoding)
      .then(sample => {
        this.sampleEntries = sample.entries ? sample.entries : SceneUtils.entriesFromTableData(sample);
        this.columnMappings = this.adoptColumnsFromExistingScene ? CommonUtils.clone(this.columnMappingsSource.columnMappings) :
          this.columnFactory.generate(this.sampleEntries, this.selectedLocale);
        this.onColumnChanged();
      })
      .catch(err => this.notifyError(err))
      .finally(() => this.readingSample = false);
  }

  deleteColumnMapping(columnPair: ColumnPair): void {
    columnPair.skip = true;
    this.onColumnChanged();
  }

  onColumnChanged(): void {
    this.targetColumnNames = this.columnMappings.filter(cp => !cp.skip).map(cp => cp.target.name);
    this.validateColumnMappings();
    this.previewData = new EntryMapper(this.columnMappings, this.selectedLocale).mapObjects(this.sampleEntries);
  }

  private validateColumnMappings(): void {
    this.columnMappingsValid = this.targetColumnNames.length > 0 && this.targetColumnNames
      .find(n => !n || n.length > ColumnMappingGenerator.COLUMN_NAME_MAX_LENGTH) == undefined;
  }

  isPreviewDirty(): boolean {
    return this.previewData && this.previewData.find(mr => mr.errors.length > 0) !== undefined;
  }

  persistScene(): void {
    this.scene.creationTime = new Date().getTime();
    const colMappings = this.columnMappings.filter(cp => !cp.skip);
    this.scene.columnMappings = colMappings;
    this.scene.columns = colMappings.map(cp => cp.target);
    this.accordion.closeAll();
    this.progressBarMode = 'query';
    this.feedback = LanguageService.instant('scene.initializingDataLoad');
    const progressMonitor = new PromiseProgressMonitor();

    progressMonitor.onProgressChange(() => {
      this.progressBarMode = 'determinate';
      this.percentPersisted = progressMonitor.settledPercent;
      if (progressMonitor.settled == 0) {
        this.feedback = LanguageService.instant('scene.tasksInitializing', { settled: progressMonitor.settled, count: progressMonitor.count });
      } else {
        this.feedback = LanguageService.instant('scene.taskCompleted',
          { settled: progressMonitor.settled, count: progressMonitor.count, task: progressMonitor.lastSettledTask });
      }
    });

    this.dbService.persistScene(this.scene, false, progressMonitor)
      .then(() => this.loadData())
      .catch(err => {
        this.notifyError(err);
        this.scene.creationTime = undefined;
        this.progressBarMode = undefined;
      });
  }

  private loadData(): void {
    this.loadFailed = false;
    this.feedback = LanguageService.instant('scene.readingData');
    this.progressBarMode = 'query';
    this.mappingErrors.clear();
    this.entryPersister.reset();
    const entryMapper = new EntryMapper(this.columnMappings, this.selectedLocale);
    const dataHandler = this.createDataHandler(entryMapper);
    console.log('start loading file ' + this.file.name + ' of type ' + this.file.type);
    setTimeout(() => this.selectedReader.readData(this.file, SceneComponent.BATCH_SIZE * 160, dataHandler, this.encoding), 500); // let UI update itself
  }

  private createDataHandler(entryMapper: EntryMapper): DataHandler {
    return {
      onValues: rows => this.persistEntries(entryMapper.mapRows(rows)),
      onEntries: entries => this.persistEntries(entryMapper.mapObjects(entries)),
      onError: err => {
        this.loadFailed = true;
        this.notifyError(err);
        if (!this.entryPersister.isPostingComplete()) {
          this.entryPersister.postingComplete(false);
        }
      },
      onComplete: () => {
        if (!this.entryPersister.isPostingComplete()) {
          this.progressBarMode = 'determinate';
          this.entryPersister.postingComplete(true);
          console.log('finished reading data');
        }
      },
      isCanceled: () => this.entryPersister.isPostingComplete()
    };
  }

  private persistEntries(mappingResults: MappingResult[]): void {
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
        const maxItemsToLoad = NumberUtils.parseFormattedNumber(this.maxItemsToLoadControl.value);
        if (this.entryPersister.getPosted() + entries.length > maxItemsToLoad) {
          this.entryPersister.post(entries.slice(0, maxItemsToLoad - this.entryPersister.getPosted()));
          this.entryPersister.postingComplete(true);
        } else {
          this.entryPersister.post(entries);
        }
      }
    }
  }

  cancel(): void {
    if (this.scene.creationTime && !this.entryPersister.isPostingComplete()) {
      this.canceled = true;
      this.entryPersister.postingComplete(false);
    } else if (this.scenesExist) {
      this.location.back();
    } else {
      this.notifyWarning(LanguageService.instant('scene.noSceneExists'));
    }
  }
}
