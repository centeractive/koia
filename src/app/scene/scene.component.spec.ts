import { ComponentFixture, TestBed, fakeAsync, flush, waitForAsync } from '@angular/core/testing';

import { SceneComponent } from './scene.component';
import { NotificationService } from 'app/shared/services';
import { Route, Scene, DataType, ColumnPair, SceneInfo, Column, Document } from 'app/shared/model';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DBService } from 'app/shared/services/backend';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { DatePipe, Location } from '@angular/common';
import { ReaderService, DataHandler } from 'app/shared/services/reader';
import { HAMMER_LOADER, By } from '@angular/platform-browser';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { SceneFactory } from 'app/shared/test';
import { ColumnMappingComponent } from './column-mapping/column-mapping.component';
import { MatBottomSheetModule, MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

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
      ['C', '3'],
      ['D', '4'],
      ['E', '5'],
      ['F', '6'],
      ['G', '7'],
      ['H', '8'],
      ['I', '9']
    ];
  });

  beforeEach(waitForAsync(() => {
    spyOn(console, 'log').and.callFake(s => null);
    dbService = new DBService(null);
    TestBed.configureTestingModule({
      declarations: [SceneComponent, ColumnMappingComponent],
      imports: [RouterTestingModule, MatBottomSheetModule, MatExpansionModule, MatCardModule, FormsModule, MatFormFieldModule,
        ReactiveFormsModule, MatInputModule, MatSelectModule, MatProgressBarModule, MatSlideToggleModule, MatTableModule,
        MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, BrowserAnimationsModule],
      providers: [Location, MatBottomSheet,
        { provide: ReaderService, useValue: readerService },
        { provide: DBService, useValue: dbService },
        { provide: NotificationService, useValue: notificationService },
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
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
    spyOn(dbService, 'findFreeDatabaseName').and.returnValue(of('data_1').toPromise());
    spyOn(dbService, 'getMaxDataItemsPerScene').and.returnValue(1_000);
    findSceneInfos = spyOn(dbService, 'findSceneInfos').and.returnValue(Promise.resolve(scenes));
    spyOn(dbService, 'writeEntries').and.callFake((database: string, entries: Document[]) => Promise.resolve());
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
    findSceneInfos.and.returnValue(Promise.resolve(sceneInfos));

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

  it('#change on file input should init context', () => {

    // given
    component.file = new File([], 'Test.csv');
    component.fileHeader = 'xyz';
    component.columnMappings = [createColumnPair('x')];
    component.feedback = 'abc';

    // when
    component.fileInputRef.nativeElement.dispatchEvent(new Event('change'))

    // then
    expect(component.file).toBeUndefined();
    expect(component.fileHeader).toBeUndefined();
    expect(component.columnMappings).toBeUndefined();
    expect(component.feedback).toBeUndefined();
  });

  it('#onFileSelChange should generate scene name and short description', fakeAsync(() => {

    // given
    const fileList = createFileList('dummy data');
    spyOn(readerService, 'readHeader').and.returnValue(Promise.resolve('dummy'));

    // when
    component.onFileSelChange(fileList);

    // then
    flush();
    const expectedName = 'Test / ' + datePipe.transform(fileList[0].lastModified, 'mediumDate');
    expect(component.scene.name).toBe(expectedName);
    const expectedShortDesc = 'CSV Test.csv (modified on ' + datePipe.transform(new Date(), 'medium') + ')';
    expect(component.scene.shortDescription).toBe(expectedShortDesc);
  }));

  it('#onFileSelChange should notify error when file header cannot be read', fakeAsync(() => {

    // given
    const fileList = createFileList('dummy data');
    spyOn(readerService, 'readHeader').and.returnValue(Promise.reject('error'));

    // when
    component.onFileSelChange(fileList);
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalled();
  }));

  it('#click on "Detect Columns" button should detect columns within sample data', fakeAsync(() => {

    // given
    const fileList = createFileList('dummy data');
    spyOn(readerService, 'readHeader').and.returnValue(Promise.resolve('dummy'));
    component.onFileSelChange(fileList);
    flush();
    fixture.detectChanges();
    spyOn(component.selectedReader, 'readSample').and.returnValue(Promise.resolve({ tableData: tableData.slice(0, 4) }));
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
    const matIconDebugElement = fixture.debugElement.query(By.css('.icon_link'));

    // when
    matIconDebugElement.nativeElement.click();

    // then
    expect(window.open).toHaveBeenCalledWith('https://angular.io/api/common/DatePipe#custom-format-options');
  }));

  it('#click on "Delete column mapping" should remove column mapping', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    const delColMappingButtons: HTMLButtonElement[] =
      fixture.debugElement.queryAll(By.css('.but_column_mapping')).map(de => de.nativeElement);

    // when
    delColMappingButtons[1].click();

    // then
    flush();
    expect(component.columnMappings.length).toBe(1);
    expect(component.columnMappings[0].source.name).toBe('Column 1');
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

  it('#formatValue should return formatted number using locale en-US', () => {

    // given
    const column: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 100 };
    const entry = { ID: 1, Amount: 15_000 };

    // when
    const formatted = component.formatValue(column, entry);

    // then
    expect(formatted).toBe('15,000');
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
    spyOn(dbService, 'persistScene').and.returnValue(Promise.reject());
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
    spyOn(component.selectedReader, 'readData').and.callFake((url: string, chunkSize: number, dataHandler: DataHandler) => {
      dataHandler.onValues(tableData.slice(1));
      dataHandler.onComplete();
    });
    spyOn(dbService, 'persistScene').and.callFake((scene: Scene) => Promise.resolve(scene));
    spyOn(component.router, 'navigateByUrl');
    const loadDataButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_load_data')).nativeElement;

    // when
    loadDataButton.click();

    // then
    flush();
    expect(component.scene.creationTime).toBeDefined();
    expect(dbService.persistScene).toHaveBeenCalled();
    expect(dbService.writeEntries).toHaveBeenCalled();
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

  function createFileList(data: string) {
    const file = new File([data], 'Test.csv');
    return {
      0: file,
      length: 1,
      item: (index: number) => file
    };
  }

  function initUpToDetectColumns(): void {
    const fileList = createFileList('dummy data');
    spyOn(readerService, 'readHeader').and.returnValue(Promise.resolve('dummy'));
    component.onFileSelChange(fileList);
    flush();
    fixture.detectChanges();
    spyOn(component.selectedReader, 'readSample').and.returnValue(Promise.resolve({ tableData: tableData.slice(0, 4) }));
    fixture.debugElement.query(By.css('#but_detect_columns')).nativeElement.click();
    flush();
    fixture.detectChanges();
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
