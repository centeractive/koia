import { DatePipe, Location } from '@angular/common';
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
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By, HAMMER_LOADER } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { RawDataComponent } from 'app/raw-data/raw-data.component';
import { Column, ColumnPair, DataType, Route, Scene, SceneInfo } from 'app/shared/model';
import { NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { DataHandler, ReaderService } from 'app/shared/services/reader';
import { SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { ColumnMappingComponent } from './column-mapping/column-mapping.component';
import { SceneComponent } from './scene.component';

describe('SceneComponent', () => {

  const datePipe = new DatePipe('en-US');
  const readerService = new ReaderService();
  const notificationService = new NotificationServiceMock();
  let isBackendInitializedSpy: jasmine.Spy;
  let dbService: DBService;
  let scenes: Scene[];
  let tableData: string[][];
  let component: SceneComponent;
  let fixture: ComponentFixture<SceneComponent>;
  let findSceneInfos: jasmine.Spy;

  beforeAll(() => {
    scenes = [SceneFactory.createScene('1', []), SceneFactory.createScene('2', []), SceneFactory.createScene('3', [])];
    tableData = [
      ['A', '1'],
      ['B', '2'],
      ['C', '3']
    ];
  });

  beforeEach(waitForAsync(() => {
    spyOn(console, 'log');
    dbService = new DBService(null);
    TestBed.configureTestingModule({
      declarations: [SceneComponent, ColumnMappingComponent],
      imports: [RouterModule.forRoot([{ path: '**', component: RawDataComponent }], {}), MatBottomSheetModule, MatExpansionModule,
        MatCardModule, FormsModule, MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatSelectModule, MatProgressBarModule,
        MatSlideToggleModule, MatTableModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, BrowserAnimationsModule
      ],
      providers: [
        Location,
        MatBottomSheet,
        { provide: ReaderService, useValue: readerService },
        { provide: DBService, useValue: dbService },
        { provide: NotificationService, useValue: notificationService },
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => null) }
      ]
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(SceneComponent);
    component = fixture.componentInstance;
    spyOn(notificationService, 'onSuccess');
    spyOn(notificationService, 'onWarning');
    spyOn(notificationService, 'onError');
    isBackendInitializedSpy = spyOn(dbService, 'isBackendInitialized').and.returnValue(true);
    spyOn(dbService, 'findFreeDatabaseName').and.resolveTo('data_1');
    spyOn(dbService, 'getMaxDataItemsPerScene').and.returnValue(1_000);
    findSceneInfos = spyOn(dbService, 'findSceneInfos').and.resolveTo(scenes);
    spyOn(dbService, 'writeEntries').and.callFake(() => Promise.resolve());
    fixture.detectChanges();
    flush();
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#ngOnInit should navigate to front page when backend is not initialized', () => {

    // given
    isBackendInitializedSpy.and.returnValue(false);
    spyOn(component.router, 'navigateByUrl');

    // when
    component.ngOnInit();

    // then
    expect(component.router.navigateByUrl).toHaveBeenCalledWith(Route.FRONT);
  });

  it('#ngOnInit should predefine column mapping source', fakeAsync(() => {

    // given
    const sceneInfos = createSceneInfos(3);
    findSceneInfos.and.resolveTo(sceneInfos);

    // when
    component.ngOnInit();
    flush();

    // then
    expect(component.columnMappingsSourceCandidates).toEqual(sceneInfos);
    expect(component.columnMappingsSource).toBe(sceneInfos[0]);
  }));

  it('home button should point to front component', () => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#butHome')).nativeElement;

    // when
    const link = htmlButton.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.FRONT);
  });

  it('scenes button should point to scenes component', () => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#butScenes')).nativeElement;

    // when
    const link = htmlButton.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.SCENES);
  });

  it('#onSourceTypeChange should init context', fakeAsync(() => {

    // given
    spyOn(component, 'initContext');

    // when
    component.onSourceTypeChange();

    // then
    expect(component.initContext).toHaveBeenCalled();
  }));

  it('#change on file input should init context', fakeAsync(() => {

    // given
    component.file = new File([], 'Test.csv');
    component.fileHeader = 'xyz';
    component.columnMappings = [createColumnPair('x')];
    component.feedback = 'abc';

    // when
    component.fileInputRef.nativeElement.dispatchEvent(new Event('change'));

    // then
    flush();
    expect(component.file).toBeUndefined();
    expect(component.fileHeader).toBeUndefined();
    expect(component.columnMappings).toBeUndefined();
    expect(component.feedback).toBeUndefined();
  }));

  it('#onFileSelChange should generate scene name and short description', fakeAsync(() => {

    // given
    const fileList = createFileList('dummy data');
    spyOn(readerService, 'readHeader').and.resolveTo('dummy');

    // when
    component.onFileSelChange(fileList);

    // then
    flush();
    const expectedName = 'Test / ' + datePipe.transform(fileList[0].lastModified, 'mediumDate');
    expect(component.scene.name).toBe(expectedName);
    expect(component.scene.shortDescription.startsWith('CSV Test.csv (modified on')).toBeTrue();
  }));

  it('#onFileSelChange should notify error when file header cannot be read', fakeAsync(() => {

    // given
    const fileList = createFileList('dummy data');
    spyOn(readerService, 'readHeader').and.rejectWith('error');

    // when
    component.onFileSelChange(fileList);
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalled();
  }));

  it('#click on "Detect Columns" button should detect columns within sample data', fakeAsync(() => {

    // given
    const fileList = createFileList('dummy data');
    spyOn(readerService, 'readHeader').and.resolveTo('dummy');
    component.onFileSelChange(fileList);
    flush();
    fixture.detectChanges();
    spyOn(component.selectedReader, 'readSample').and.resolveTo({ tableData: tableData.slice(0, 4) });
    const detectColumnsButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_detect_columns')).nativeElement;

    // when
    detectColumnsButton.click();

    // then
    flush();
    expect(component.columnMappings).toBeDefined();
    expect(component.columnMappings.length).toBe(2);
    expect(fixture.debugElement.query(By.css('#div_preview_table'))).toBeDefined();
    expect(fixture.debugElement.query(By.css('#but_load_data'))).toBeDefined();
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
    spyOn(window, 'open');
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

  it('#formatValue should return empty string when object value is null', () => {

    // given
    const column: Column = { name: 'Nested', dataType: DataType.OBJECT, width: 100 };
    const entry = { ID: 1, Nested: null };

    // when
    const formatted = component.formatValue(column, entry);

    // then
    expect(formatted).toBe('');
  });

  it('#formatValue should return ellipsis when object value is defined', () => {

    // given
    const column: Column = { name: 'Nested', dataType: DataType.OBJECT, width: 100 };
    const entry = { ID: 1, Nested: '{ a: \'x\' }' };

    // when
    const formatted = component.formatValue(column, entry);

    // then
    expect(formatted).toBe('...');
  });

  it('#formatValue should return empty string when number value is null', () => {

    // given
    const column: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 100 };
    const entry = { ID: 1, Amount: null };

    // when
    const formatted = component.formatValue(column, entry);

    // then
    expect(formatted).toBe('');
  });

  it('#formatValue should return formatted time using column displayFormat', () => {

    // given
    const column: Column = {
      name: 'Time', dataType: DataType.TIME, width: 100,
      format: 'yyyy-MM-dd HH:mm:ss SSS'
    };
    const time = new Date('2019-01-30T18:24:17').getTime() + 557;
    const entry = { ID: 1, Time: time };

    // when
    const formatted = component.formatValue(column, entry);

    // then
    expect(formatted).toBe('2019-01-30 18:24:17 557');
  });

  it('#formatValue should return formatted number using current locale', () => {

    // given
    const column: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 100 };
    const entry = { ID: 1, Amount: 15_000 };

    // when
    const formatted = component.formatValue(column, entry);

    // then
    expect(formatted).toBe((15_000).toLocaleString());
  });

  it('#formatValue should return value when value is text', () => {

    // given
    const column: Column = { name: 'Host', dataType: DataType.TEXT, width: 100 };
    const entry = { ID: 1, Host: 'server1' };

    // when
    const formatted = component.formatValue(column, entry);

    // then
    expect(formatted).toBe('server1');
  });

  it('#click on "Load Data" should notify error when scene cannot be persisted', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    spyOn(dbService, 'persistScene').and.rejectWith();
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
    spyOn(component.selectedReader, 'readData').and.callFake((file: File, chunkSize: number, dataHandler: DataHandler) => {
      dataHandler.onValues(tableData);
      dataHandler.onComplete();
    });
    spyOn(dbService, 'persistScene').and.callFake((scene: Scene) => Promise.resolve(scene));
    spyOn(component.router, 'navigateByUrl');
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
    expect(component.router.navigateByUrl).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('#click on "Load Data" should persist scene and import partial data when first column was deleted', fakeAsync(() => {
    // given
    initUpToDetectColumns();
    const delColMappingButtons: HTMLButtonElement[] = fixture.debugElement.queryAll(By.css('.but_delete')).map(de => de.nativeElement);
    delColMappingButtons[0].click();

    spyOn(component.selectedReader, 'readData').and.callFake((file: File, chunkSize: number, dataHandler: DataHandler) => {
      dataHandler.onValues(tableData);
      dataHandler.onComplete();
    });
    spyOn(dbService, 'persistScene').and.callFake((scene: Scene) => Promise.resolve(scene));
    spyOn(component.router, 'navigateByUrl');
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
    expect(component.router.navigateByUrl).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('#click on "Load Data" should persist scene and import partial data when last column was deleted', fakeAsync(() => {
    // given
    initUpToDetectColumns();
    const delColMappingButtons: HTMLButtonElement[] = fixture.debugElement.queryAll(By.css('.but_delete')).map(de => de.nativeElement);
    delColMappingButtons[1].click();

    spyOn(component.selectedReader, 'readData').and.callFake((file: File, chunkSize: number, dataHandler: DataHandler) => {
      dataHandler.onValues(tableData);
      dataHandler.onComplete();
    });
    spyOn(dbService, 'persistScene').and.callFake((scene: Scene) => Promise.resolve(scene));
    spyOn(component.router, 'navigateByUrl');
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
    expect(component.router.navigateByUrl).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('#click on cancel button should cancel ongoing data load and not submit pending items', () => {

    // given
    component.scene.creationTime = new Date().getTime();
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_cancel')).nativeElement;
    spyOn(component.entryPersister, 'postingComplete').and.callFake(() => null);

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
    spyOn(location, 'back');
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
    spyOn(readerService, 'readHeader').and.resolveTo('dummy');
    component.onFileSelChange(fileList);
    flush();
    fixture.detectChanges();
    spyOn(component.selectedReader, 'readSample').and.resolveTo({ tableData: tableData.slice(0, 4) });
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
