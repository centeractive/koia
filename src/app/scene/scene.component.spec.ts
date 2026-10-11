import { DatePipe, Location } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { Router, RouterModule, UrlTree } from '@angular/router';
import { RawDataComponent } from 'app/raw-data/raw-data.component';
import { ColumnPair, DataType, Route, Scene, SceneInfo } from 'app/shared/model';
import { NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { DataHandler, ReaderService } from 'app/shared/services/reader';
import { SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { ColumnMappingComponent } from './column-mapping/column-mapping.component';
import { SceneComponent } from './scene.component';
import type { Mock } from 'vitest';

describe('SceneComponent', () => {

  const datePipe = new DatePipe('en-US');
  const readerService = new ReaderService();
  const notificationService = new NotificationServiceMock();
  let navigateByUrlSpy: Mock;
  let isBackendInitializedSpy: Mock;
  let dbService: DBService;
  let scenes: Scene[];
  let tableData: string[][];
  let component: SceneComponent;
  let fixture: ComponentFixture<SceneComponent>;
  let findSceneInfos: Mock;

  beforeAll(() => {
    scenes = [SceneFactory.createScene('1', []), SceneFactory.createScene('2', []), SceneFactory.createScene('3', [])];
    tableData = [
      ['A', '1'],
      ['B', '2'],
      ['C', '3']
    ];
  });

  beforeEach(waitForAsync(async () => {
    vi.spyOn(console, 'log').mockReturnValue(undefined);
    dbService = new DBService(null);
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [SceneComponent, ColumnMappingComponent],
      imports: [RouterModule.forRoot([{ path: '**', component: RawDataComponent }], {}), MatBottomSheetModule, MatExpansionModule,
        MatCardModule, FormsModule, MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatSelectModule, MatProgressBarModule,
        MatSlideToggleModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule
      ],
      providers: [
        Location,
        MatBottomSheet,
        { provide: ReaderService, useValue: readerService },
        { provide: DBService, useValue: dbService },
        { provide: NotificationService, useValue: notificationService }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigateByUrlSpy = vi.spyOn(router, 'navigateByUrl').mockReturnValue(undefined);

    fixture = TestBed.createComponent(SceneComponent);
    component = fixture.componentInstance;
    vi.spyOn(notificationService, 'onSuccess').mockReturnValue(undefined);
    vi.spyOn(notificationService, 'onWarning').mockReturnValue(undefined);
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);
    isBackendInitializedSpy = vi.spyOn(dbService, 'isBackendInitialized').mockReturnValue(true);
    vi.spyOn(dbService, 'findFreeDatabaseName').mockResolvedValue('data_1');
    vi.spyOn(dbService, 'getMaxDataItemsPerScene').mockReturnValue(1_000);
    findSceneInfos = vi.spyOn(dbService, 'findSceneInfos').mockResolvedValue(scenes);
    vi.spyOn(dbService, 'writeEntries').mockImplementation(() => Promise.resolve());
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#ngOnInit should navigate to front page when backend is not initialized', () => {

    // given
    isBackendInitializedSpy.mockReturnValue(false);

    // when
    component.ngOnInit();

    // then
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.FRONT);
  });

  it('#ngOnInit should predefine column mapping source', fakeAsync(() => {

    // given
    const sceneInfos = createSceneInfos(3);
    findSceneInfos.mockResolvedValue(sceneInfos);

    // when
    component.ngOnInit();
    flush();

    // then
    expect(component.columnMappingsSourceCandidates).toEqual(sceneInfos);
    expect(component.columnMappingsSource).toBe(sceneInfos[0]);
  }));

  it('butHome#click should navigate to front component', () => {

    // given
    const butHome: HTMLButtonElement = fixture.debugElement.query(By.css('#butHome')).nativeElement;

    // when
    butHome.click();

    // then
    const urlTree: UrlTree = vi.mocked(navigateByUrlSpy).mock.lastCall[0];
    expect(urlTree.toString()).toBe('/' + Route.FRONT);
  });

  it('butScenes#click should navigate to scenes component', () => {

    // given
    const butScenes: HTMLButtonElement = fixture.debugElement.query(By.css('#butScenes')).nativeElement;

    // when
    butScenes.click();

    // then    
    const urlTree: UrlTree = vi.mocked(navigateByUrlSpy).mock.lastCall[0];
    expect(urlTree.toString()).toBe('/' + Route.SCENES);
  });

  it('#onSourceTypeChange should init context', fakeAsync(() => {

    // given
    vi.spyOn(component, 'initContext').mockReturnValue(undefined);

    // when
    component.onSourceTypeChange();

    // then
    expect(component.initContext).toHaveBeenCalled();
  }));

  function loadSample(): void {
    vi.spyOn(readerService, 'readHeader').mockResolvedValue('dummy');
    component.onFileSelChange(createFileList('dummy data'));
    flush();
    fixture.detectChanges();
  }

  function clickSelectFile(): void {
    vi.spyOn(component.fileInputRef.nativeElement, 'click').mockReturnValue(undefined);
    fixture.nativeElement.querySelector('#select_file_button').click();
  }

  function putFileIntoInput(name: string): void {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File(['other data'], name));
    component.fileInputRef.nativeElement.files = dataTransfer.files;
  }

  function dataSample(): HTMLTextAreaElement {
    return fixture.nativeElement.querySelector('#textarea_data_sample');
  }

  function progressBar(): HTMLElement {
    return fixture.nativeElement.querySelector('mat-progress-bar');
  }

  it('#click on select file button should open file dialog with cleared input', fakeAsync(() => {

    // given
    loadSample();
    putFileIntoInput('Other.csv');

    // when
    clickSelectFile();

    // then
    expect(component.fileInputRef.nativeElement.click).toHaveBeenCalled();
    expect(component.fileInputRef.nativeElement.value).toBe('');
  }));

  it('#window focus after select file should hide previous data sample and show progress bar immediately', fakeAsync(() => {

    // given
    loadSample();
    clickSelectFile();

    // when
    window.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    // then
    expect(dataSample()).toBeNull();
    expect(progressBar()).not.toBeNull();
  }));

  it('#window focus without select file should keep data sample', fakeAsync(() => {

    // given
    loadSample();

    // when
    window.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    // then
    expect(dataSample()).not.toBeNull();
    expect(progressBar()).toBeNull();
  }));

  it('#cancel on file input after window focus should restore previous data sample and hide progress bar', fakeAsync(() => {

    // given
    loadSample();
    const file = component.file;
    component.columnMappings = [createColumnPair('x')];
    clickSelectFile();
    window.dispatchEvent(new Event('focus'));

    // when
    component.fileInputRef.nativeElement.dispatchEvent(new Event('cancel'));
    fixture.detectChanges();

    // then
    expect(component.file).toBe(file);
    expect(dataSample().value).toBe('dummy');
    expect(component.columnMappings.length).toBe(1);
    expect(progressBar()).toBeNull();
  }));

  it('#change on file input without file after window focus should restore previous data sample', fakeAsync(() => {

    // given
    loadSample();
    clickSelectFile();
    window.dispatchEvent(new Event('focus'));

    // when
    component.fileInputRef.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // then
    expect(dataSample().value).toBe('dummy');
    expect(progressBar()).toBeNull();
  }));

  it('#cancel on file input without previous context should not show progress bar', fakeAsync(() => {

    // when
    component.fileInputRef.nativeElement.dispatchEvent(new Event('cancel'));
    fixture.detectChanges();

    // then
    expect(component.file).toBeUndefined();
    expect(progressBar()).toBeNull();
  }));

  it('#change on file input after window focus should show new data sample', fakeAsync(() => {

    // given
    loadSample();
    clickSelectFile();
    window.dispatchEvent(new Event('focus'));
    putFileIntoInput('Other.csv');
    vi.spyOn(readerService, 'readHeader').mockResolvedValue('other');

    // when
    component.fileInputRef.nativeElement.dispatchEvent(new Event('change'));
    flush();
    fixture.detectChanges();

    // then
    expect(component.file.name).toBe('Other.csv');
    expect(dataSample().value).toBe('other');
    expect(progressBar()).toBeNull();
  }));

  it('#change on file input should hide previous data sample and show progress bar immediately', fakeAsync(() => {

    // given
    loadSample();
    putFileIntoInput('Other.csv');

    // when
    component.fileInputRef.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // then
    expect(dataSample()).toBeNull();
    expect(progressBar()).not.toBeNull();
    flush();
  }));

  it('#change on file input after cancel should not restore previous data sample again', fakeAsync(() => {

    // given
    loadSample();
    clickSelectFile();
    window.dispatchEvent(new Event('focus'));
    component.fileInputRef.nativeElement.dispatchEvent(new Event('cancel'));
    component.fileHeader = 'changed';

    // when
    component.fileInputRef.nativeElement.dispatchEvent(new Event('change'));

    // then
    expect(component.fileHeader).toBe('changed');
  }));

  it('#onFileSelChange should generate scene name and short description', fakeAsync(() => {

    // given
    const fileList = createFileList('dummy data');
    vi.spyOn(readerService, 'readHeader').mockResolvedValue('dummy');

    // when
    component.onFileSelChange(fileList);

    // then
    flush();
    const expectedName = 'Test / ' + datePipe.transform(fileList[0].lastModified, 'mediumDate');
    expect(component.scene.name).toBe(expectedName);
    expect(component.scene.shortDescription.startsWith('CSV Test.csv (modified on')).toBe(true);
  }));

  it('#onFileSelChange should notify error when file header cannot be read', fakeAsync(() => {

    // given
    const fileList = createFileList('dummy data');
    vi.spyOn(readerService, 'readHeader').mockRejectedValue('error');

    // when
    component.onFileSelChange(fileList);
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalled();
  }));

  it('#click on "Detect Columns" button should detect columns within sample data', fakeAsync(() => {

    // given
    const fileList = createFileList('dummy data');
    vi.spyOn(readerService, 'readHeader').mockResolvedValue('dummy');
    component.onFileSelChange(fileList);
    flush();
    fixture.detectChanges();
    vi.spyOn(component.selectedReader, 'readSample').mockResolvedValue({ tableData: tableData.slice(0, 4) });
    const detectColumnsButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_detect_columns')).nativeElement;

    // when
    detectColumnsButton.click();

    // then
    flush();
    expect(component.columnMappings).toBeDefined();
    expect(component.columnMappings.length).toBe(2);
    fixture.detectChanges();
    const preview = fixture.debugElement.query(By.css('koia-scene-preview')).nativeElement;
    expect(preview.columnPairs).toBe(component.columnMappings);
    expect(preview.mappingResults).toBe(component.previewData);
    expect(fixture.debugElement.query(By.css('#but_load_data'))).not.toBeNull();
  }));

  it('should separate cancel and load data buttons by gap', fakeAsync(() => {

    // given
    initUpToDetectColumns();

    // when
    const cancel = fixture.nativeElement.querySelector('#but_cancel').getBoundingClientRect();
    const loadData = fixture.nativeElement.querySelector('#but_load_data').getBoundingClientRect();

    // then
    expect(loadData.left - cancel.right).toBeCloseTo(16, 0);
  }));

  it('should separate load data button and max items by gap', fakeAsync(() => {

    // given
    initUpToDetectColumns();

    // when
    const loadData = fixture.nativeElement.querySelector('#but_load_data').getBoundingClientRect();
    const maxItems = fixture.nativeElement.querySelector('.max_items').getBoundingClientRect();

    // then
    expect(maxItems.left - loadData.right).toBeCloseTo(16, 0);
  }));

  it('#onDataTypeChanged should show data format fields when TIME', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    const targetColumn = component.columnMappings[1].target;
    targetColumn.dataType = DataType.TIME;

    // when
    component.onDataTypeChanged(targetColumn);

    // then
    fixture.detectChanges();
    const formatDebugElements = fixture.debugElement.queryAll(By.css('.column_format'));
    const sourceFormatDebutElement = fixture.debugElement.query(By.css('.input_source_format'));
    const displayFormatDebugElement = fixture.debugElement.query(By.css('.select_display_format'));
    expect(formatDebugElements.length).toBe(2);
    expect(sourceFormatDebutElement).toBeDefined();
    expect(sourceFormatDebutElement.nativeElement.value).toBe('');
    expect(displayFormatDebugElement).toBeDefined();
    const matSelect: MatSelect = displayFormatDebugElement.componentInstance;
    expect(matSelect.value).toBe(component.dateFormats[0]);
  }));

  it('#click on date format icon should show DatePipe format page', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    const targetColumn = component.columnMappings[1].target;
    targetColumn.dataType = DataType.TIME;
    component.onDataTypeChanged(targetColumn);
    fixture.detectChanges();
    vi.spyOn(window, 'open').mockReturnValue(undefined);
    const refreshPreviewButtons: HTMLButtonElement[] =
      fixture.debugElement.queryAll(By.css('.but_date_formats')).map(de => de.nativeElement);

    // when
    refreshPreviewButtons[0].click();

    // then
    expect(window.open).toHaveBeenCalledWith('https://angular.io/api/common/DatePipe#custom-format-options');
  }));

  it('#click on "Delete column mapping" should mark column mapping to be skipped', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    const delColMappingButtons: HTMLButtonElement[] = fixture.debugElement.queryAll(By.css('.but_delete')).map(de => de.nativeElement);

    // when
    delColMappingButtons[1].click();

    // then
    flush();
    expect(component.columnMappings.length).toBe(2);
    expect(component.columnMappings.map(cp => cp.skip)).toEqual([undefined, true]);
  }));

  it('#click on "Load Data" should notify error when scene cannot be persisted', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    vi.spyOn(dbService, 'persistScene').mockRejectedValue(undefined);
    const loadDataButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_load_data')).nativeElement;

    // when
    loadDataButton.click();

    // then
    flush();
    expect(notificationService.onError).toHaveBeenCalled();
  }));

  it('#click on "Load Data" should persist scene and import data', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    vi.spyOn(component.selectedReader, 'readData').mockImplementation((file: File, chunkSize: number, dataHandler: DataHandler) => {
      dataHandler.onValues(tableData);
      dataHandler.onComplete();
    });
    vi.spyOn(dbService, 'persistScene').mockImplementation((scene: Scene) => Promise.resolve(scene));
    const loadDataButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_load_data')).nativeElement;

    // when
    loadDataButton.click();

    // then
    flush();
    expect(component.targetColumnNames).toEqual(['Column 1', 'Column 2']);
    expect(component.scene.creationTime).toBeDefined();
    expect(dbService.persistScene).toHaveBeenCalled();
    expect(dbService.writeEntries).toHaveBeenCalledWith('data_1', [
      { _id: '1000001', 'Column 1': 'A', 'Column 2': 1 },
      { _id: '1000002', 'Column 1': 'B', 'Column 2': 2 },
      { _id: '1000003', 'Column 1': 'C', 'Column 2': 3 }
    ] as any);
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('#click on "Load Data" should persist scene and import partial data when first column was deleted', fakeAsync(() => {
    // given
    initUpToDetectColumns();
    const delColMappingButtons: HTMLButtonElement[] = fixture.debugElement.queryAll(By.css('.but_delete')).map(de => de.nativeElement);
    delColMappingButtons[0].click();

    vi.spyOn(component.selectedReader, 'readData').mockImplementation((file: File, chunkSize: number, dataHandler: DataHandler) => {
      dataHandler.onValues(tableData);
      dataHandler.onComplete();
    });
    vi.spyOn(dbService, 'persistScene').mockImplementation((scene: Scene) => Promise.resolve(scene));
    const loadDataButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_load_data')).nativeElement;

    // when
    loadDataButton.click();

    // then
    flush();
    expect(component.targetColumnNames).toEqual(['Column 2']);
    expect(component.scene.creationTime).toBeDefined();
    expect(dbService.persistScene).toHaveBeenCalled();
    expect(dbService.writeEntries).toHaveBeenCalledWith('data_1', [
      { _id: '1000001', 'Column 2': 1 },
      { _id: '1000002', 'Column 2': 2 },
      { _id: '1000003', 'Column 2': 3 }
    ] as any);
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('#click on "Load Data" should persist scene and import partial data when last column was deleted', fakeAsync(() => {
    // given
    initUpToDetectColumns();
    const delColMappingButtons: HTMLButtonElement[] = fixture.debugElement.queryAll(By.css('.but_delete')).map(de => de.nativeElement);
    delColMappingButtons[1].click();

    vi.spyOn(component.selectedReader, 'readData').mockImplementation((file: File, chunkSize: number, dataHandler: DataHandler) => {
      dataHandler.onValues(tableData);
      dataHandler.onComplete();
    });
    vi.spyOn(dbService, 'persistScene').mockImplementation((scene: Scene) => Promise.resolve(scene));
    const loadDataButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_load_data')).nativeElement;

    // when
    loadDataButton.click();

    // then
    flush();
    expect(component.targetColumnNames).toEqual(['Column 1']);
    expect(component.scene.creationTime).toBeDefined();
    expect(dbService.persistScene).toHaveBeenCalled();
    expect(dbService.writeEntries).toHaveBeenCalledWith('data_1', [
      { _id: '1000001', 'Column 1': 'A' },
      { _id: '1000002', 'Column 1': 'B' },
      { _id: '1000003', 'Column 1': 'C' }
    ] as any);
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('#click on cancel button should cancel ongoing data load and not submit pending items', () => {

    // given
    component.scene.creationTime = new Date().getTime();
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_cancel')).nativeElement;
    vi.spyOn(component.entryPersister, 'postingComplete').mockImplementation(() => null);

    // when
    htmlButton.click();

    // then
    expect(component.entryPersister.postingComplete).toHaveBeenCalledWith(false);
  });

  it('#click on cancel button should show warning when no scenes exist', () => {

    // given
    component.scenesExist = false;
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_cancel')).nativeElement;

    // when
    htmlButton.click();

    // then
    const bottomSheet = TestBed.inject(MatBottomSheet);
    expect(notificationService.onWarning).toHaveBeenCalledWith(bottomSheet,
      'Currently there exists no scene, at least one must be created!');
  });

  it('#click on cancel button should navigate to previous page when scenes exist', () => {

    // given
    const location = TestBed.inject(Location);
    vi.spyOn(location, 'back').mockReturnValue(undefined);
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_cancel')).nativeElement;

    // when
    htmlButton.click();

    // then
    expect(location.back).toHaveBeenCalled();
  });

  function createSceneInfos(count: number): SceneInfo[] {
    const sceneInfos: SceneInfo[] = [];
    const now = new Date().getTime();
    for (let i = 0; i < count; i++) {
      sceneInfos.push({
        creationTime: now,
        name: 'abc ' + i,
        shortDescription: 'xyz ' + i,
        database: 'data_' + i,
        columnMappings: [createColumnPair('a'), createColumnPair('b')]
      });
    }
    return sceneInfos;
  }

  function initUpToDetectColumns(): void {
    const fileList = createFileList('dummy data');
    vi.spyOn(readerService, 'readHeader').mockResolvedValue('dummy');
    component.onFileSelChange(fileList);
    flush();
    fixture.detectChanges();
    vi.spyOn(component.selectedReader, 'readSample').mockResolvedValue({ tableData: tableData.slice(0, 4) });
    fixture.debugElement.query(By.css('#but_detect_columns')).nativeElement.click();
    flush();
    fixture.detectChanges();
  }

  function createFileList(data: string): FileList {
    const file = new File([data], 'Test.csv');
    return {
      0: file,
      length: 1,
      item: () => file
    } as any as FileList;
  }

  function createColumnPair(name: string): ColumnPair {
    return {
      source: {
        name: name,
        dataType: DataType.NUMBER,
        width: 10
      },
      target: {
        name: name,
        dataType: DataType.TIME,
        width: 10
      }
    };
  }
});
