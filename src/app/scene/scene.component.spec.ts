import { DatePipe, Location } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, reflectComponentType } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
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
import { Router, RouterModule } from '@angular/router';
import { RawDataComponent } from 'app/raw-data/raw-data.component';
import { Attribute, ColumnPair, DataType, Route, Scene, SceneInfo } from 'app/shared/model';
import { KoiaFormDirective } from 'app/shared/directives/koia-form.directive';
import { NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { DataHandler, ReaderService, Sample } from 'app/shared/services/reader';
import { SceneFactory } from 'app/shared/test';
import { PageFrameComponent } from 'app/shared/ui/page-frame/page-frame.component';
import { LocaleUtils } from 'app/shared/utils/i18n/locale-utils';
import { PromiseProgressMonitor } from 'app/shared/utils/promise-progress-monitor';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { ColumnMappingComponent } from './column-mapping/column-mapping.component';
import { EntryPersister } from './persister/entry-persister';
import { SceneComponent } from './scene.component';
import { page } from 'vitest/browser';
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
  const levelSample: Sample = { entries: [{ Level: 'WARN', Message: 'a' }, { Level: 'INFO', Message: 'b' }], levelColumn: 'Level' };
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
    dbService = new DBService(null, null);
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [SceneComponent, ColumnMappingComponent, KoiaFormDirective, PageFrameComponent],
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

  it('should have own selector', () => {
    expect(reflectComponentType(SceneComponent).selector).toBe('koia-scene');
  });

  it('should frame page as new scene page', () => {

    // when
    const frame: PageFrameComponent = fixture.debugElement.query(By.directive(PageFrameComponent)).componentInstance;

    // then
    expect(frame.active).toBe(Route.SCENE);
    expect(frame.heading).toBe('New Scene');
    expect(frame.scenesExist).toBe(true);
  });

  it('should tell page frame that no scenes exist when there are no scene infos', fakeAsync(() => {

    // given
    findSceneInfos.mockResolvedValue([]);

    // when
    component.ngOnInit();
    flush();
    fixture.detectChanges();

    // then
    const frame: PageFrameComponent = fixture.debugElement.query(By.directive(PageFrameComponent)).componentInstance;
    expect(frame.scenesExist).toBe(false);
  }));

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

  it('#ngOnInit should read scene infos once', fakeAsync(() => {

    // given
    findSceneInfos.mockClear();

    // when
    component.ngOnInit();
    flush();

    // then
    expect(findSceneInfos).toHaveBeenCalledTimes(1);
    expect(component.scenesExist).toBe(true);
  }));

  it('#ngOnInit should notify error when scene infos cannot be read', fakeAsync(() => {

    // given
    findSceneInfos.mockRejectedValue('db error');

    // when
    component.ngOnInit();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'db error');
  }));

  it('#onSourceTypeChange should init context', fakeAsync(() => {

    // given
    vi.spyOn(component, 'initContext').mockReturnValue(undefined);

    // when
    component.onSourceTypeChange();

    // then
    expect(component.initContext).toHaveBeenCalled();
  }));

  it('#onFileSelChange should truncate header of large file', fakeAsync(() => {

    // given
    vi.spyOn(readerService, 'readHeader').mockResolvedValue('dummy');

    // when
    component.onFileSelChange(createFileList('x'.repeat(10_001)));
    flush();

    // then
    expect(component.fileHeader).toBe('dummy...');
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
    component.levelColumn = 'Level';
    clickSelectFile();
    window.dispatchEvent(new Event('focus'));

    // when
    component.fileInputRef.nativeElement.dispatchEvent(new Event('cancel'));
    fixture.detectChanges();

    // then
    expect(component.file).toBe(file);
    expect(dataSample().value).toBe('dummy');
    expect(component.columnMappings.length).toBe(1);
    expect(component.levelColumn).toBe('Level');
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

  it('#onFileSelChange should append (2) to generated scene name when it exists', fakeAsync(() => {

    // given
    const fileList = createFileList('dummy data');
    vi.spyOn(readerService, 'readHeader').mockResolvedValue('dummy');
    const existingName = 'Test / ' + datePipe.transform(fileList[0].lastModified, 'mediumDate');
    findSceneInfos.mockResolvedValue([{ ...createSceneInfos(1)[0], name: existingName }]);
    component.ngOnInit();
    flush();

    // when
    component.onFileSelChange(fileList);
    flush();

    // then
    expect(component.scene.name).toBe(existingName + ' (2)');
  }));

  it('#isSceneNameTaken should return true when name exists', () => {

    // given
    component.scene.name = 'Scene 1';

    // when
    const taken = component.isSceneNameTaken();

    // then
    expect(taken).toBe(true);
  });

  it('#isSceneNameTaken should return true when trimmed name exists', () => {

    // given
    component.scene.name = ' Scene 1 ';

    // when
    const taken = component.isSceneNameTaken();

    // then
    expect(taken).toBe(true);
  });

  it('#isSceneNameTaken should return false when name does not exist', () => {

    // given
    component.scene.name = 'Scene X';

    // when
    const taken = component.isSceneNameTaken();

    // then
    expect(taken).toBe(false);
  });

  it('#isSceneNameTaken should return false when name is undefined', () => {

    // when
    const taken = component.isSceneNameTaken();

    // then
    expect(taken).toBe(false);
  });

  it('scene name field should show error when name exists', () => {

    // given
    component.scene.name = 'Scene 1';

    // when
    fixture.detectChanges();

    // then
    const formField: HTMLElement = fixture.nativeElement.querySelector('.scene_name');
    expect(formField.querySelector('mat-error').textContent.trim()).toBe('Scene name already exists');
    expect(formField.classList).toContain('mat-form-field-invalid');
  });

  it('scene name field should limit input to max scene name length', () => {

    // when
    fixture.detectChanges();

    // then
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.scene_name input');
    expect(input.maxLength).toBe(40);
  });

  it('scene name field should not show error when name is unique', () => {

    // given
    component.scene.name = 'Scene X';

    // when
    fixture.detectChanges();

    // then
    const formField: HTMLElement = fixture.nativeElement.querySelector('.scene_name');
    expect(formField.querySelector('mat-error')).toBeNull();
    expect(formField.classList).not.toContain('mat-form-field-invalid');
  });

  it('"Detect Columns" button should be disabled when scene name exists', fakeAsync(() => {

    // given
    loadSample();
    component.scene.name = 'Scene 1';

    // when
    fixture.detectChanges();

    // then
    const detectColumnsButton: HTMLButtonElement = fixture.nativeElement.querySelector('#but_detect_columns');
    expect(detectColumnsButton.disabled).toBe(true);
  }));

  it('"Detect Columns" button should be enabled when scene name is unique', fakeAsync(() => {

    // given
    loadSample();
    component.scene.name = 'Scene X';

    // when
    fixture.detectChanges();

    // then
    const detectColumnsButton: HTMLButtonElement = fixture.nativeElement.querySelector('#but_detect_columns');
    expect(detectColumnsButton.disabled).toBe(false);
  }));

  it('"Load Data" button should be hidden when scene name exists', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    component.scene.name = 'Scene 1';

    // when
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelector('#but_load_data')).toBeNull();
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

  it('#click on "Detect Columns" button should collapse data source and attribute panels', fakeAsync(() => {

    // when
    initUpToDetectColumns();

    // then
    const panels: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('mat-expansion-panel'));
    expect(panels.map(p => p.classList.contains('mat-expanded'))).toEqual([false, false, true, true]);
  }));

  it('should separate cancel and load data buttons by gap', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    expect(fixture.nativeElement.querySelector('.span_load img')).toBeNull();

    // when
    const cancel = fixture.nativeElement.querySelector('#but_cancel').getBoundingClientRect();
    const loadData = fixture.nativeElement.querySelector('#but_load_data').getBoundingClientRect();

    // then
    expect(loadData.left - cancel.right).toBeCloseTo(8, 0);
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

  it('form fields should be outlined', () => {

    // when
    const formFields: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('mat-form-field'));

    // then
    expect(formFields.length).toBeGreaterThanOrEqual(3);
    formFields.forEach(f => expect(f.classList).toContain('mat-form-field-appearance-outline'));
  });

  it('column mapping form fields should inherit outlined appearance', fakeAsync(() => {

    // given
    initUpToDetectColumns();

    // when
    const formFields: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('koia-column-mapping mat-form-field'));

    // then
    expect(formFields.length).toBe(6);
    formFields.forEach(f => expect(f.classList).toContain('mat-form-field-appearance-outline'));
  }));

  it('adopt columns toggle, scene select and detect button should wrap on narrow screen', fakeAsync(() => {

    // when
    initUpToDetectColumns();

    // then
    expect(getComputedStyle(fixture.nativeElement.querySelector('#div_detect_columns')).flexWrap).toBe('wrap');
  }));

  describe('on desktop', () => {

    beforeAll(() => page.viewport(1280, 800));

    afterAll(() => page.viewport(414, 896));

    function expectOnOneLineInOrder(selectors: string[]): void {
      const rects = selectors.map(s => fixture.nativeElement.querySelector(s).getBoundingClientRect());
      const centerOf = (r: DOMRect) => r.top + r.height / 2;
      rects.forEach(r => expect(Math.abs(centerOf(r) - centerOf(rects[0]))).toBeLessThanOrEqual(1));
      rects.slice(1).forEach((r, i) => expect(rects[i].right).toBeLessThan(r.left));
    }

    it('source type, select file button, file name and encoding should share one row', fakeAsync(() => {

      // given
      initUpToDetectColumns();

      // when
      component.accordion.openAll();
      fixture.detectChanges();

      // then
      expectOnOneLineInOrder(['.form_field_source_type', '#select_file_button', '.file_name', '.form_field_encoding']);
    }));

    it('language, source attributes and detect button should share one row', fakeAsync(() => {

      // given
      initUpToDetectColumns();
      component.columnMappingsSource = undefined;

      // when
      component.accordion.openAll();
      fixture.detectChanges();

      // then
      expectOnOneLineInOrder(['.form_field_language', '#div_source_attributes > mat-slide-toggle', '.form_field_separator',
        '#but_detect_columns']);
    }));

    it('wide attribute field should be wider than other attribute fields', () => {

      // given
      const logReader = component.readers[3];
      component.selectedReader = logReader;
      component.readerAttributes = logReader.furnishAttributes('', 'en-US');
      component.fileHeader = 'x';
      component.accordion.openAll();

      // when
      fixture.detectChanges();

      // then
      const field: HTMLElement = fixture.nativeElement.querySelector('[data-attribute="scene.reader.logPattern"]');
      expect(field.getBoundingClientRect().width).toBeGreaterThan(180);
    });

    it('adopt columns toggle, scene select and detect button should share one row', fakeAsync(() => {

      // given
      initUpToDetectColumns();
      component.accordion.openAll();
      const sceneInfos = createSceneInfos(1);
      component.columnMappingsSourceCandidates = sceneInfos;
      component.columnMappingsSource = sceneInfos[0];
      fixture.detectChanges();

      // when
      fixture.nativeElement.querySelector('#div_detect_columns mat-slide-toggle button').click();
      fixture.detectChanges();

      // then
      expect(getComputedStyle(fixture.nativeElement.querySelector('#div_detect_columns')).display).toBe('flex');
      expectOnOneLineInOrder(['#div_detect_columns mat-slide-toggle', '#column_mapping_source', '#but_detect_columns']);
    }));
  });

  it('panel titles should show step numbers', fakeAsync(() => {

    // given
    initUpToDetectColumns();

    // when
    const steps: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.step'));

    // then
    expect(steps.map(s => s.textContent)).toEqual(['1', '2', '3', '4']);
  }));

  it('encoding select should be shown for reader supporting encoding only', () => {

    // given
    const [csvReader, , jsonReader] = component.readers;

    // when
    component.selectedReader = jsonReader;
    fixture.detectChanges();
    const encodingOfJson = fixture.nativeElement.querySelector('.form_field_encoding');
    component.selectedReader = csvReader;
    fixture.detectChanges();
    const encodingOfCsv = fixture.nativeElement.querySelector('.form_field_encoding');

    // then
    expect(encodingOfJson).toBeNull();
    expect(encodingOfCsv).not.toBeNull();
  });

  it('wide attribute should be rendered in wide form field marked with attribute name', () => {

    // given
    const logReader = component.readers[3];
    component.selectedReader = logReader;
    component.readerAttributes = logReader.furnishAttributes('', 'en-US');
    component.fileHeader = 'x';

    // when
    fixture.detectChanges();

    // then
    const field: HTMLElement = fixture.nativeElement.querySelector('[data-attribute="scene.reader.logPattern"]');
    expect(field.classList).toContain('form_field_wide');
    expect(fixture.nativeElement.querySelector('.form_field_encoding')).not.toBeNull();
  });

  it('value choice button should sit inside attribute form field', () => {

    // given
    showValueChoiceAttribute();

    // when
    const button = fixture.nativeElement.querySelector('.form_field_separator .but_value_choice');

    // then
    expect(button).not.toBeNull();
  });

  it('value choice menu item should set attribute value', fakeAsync(() => {

    // given
    const attr = showValueChoiceAttribute();
    component.columnMappings = [];

    // when
    fixture.nativeElement.querySelector('.but_value_choice').click();
    fixture.detectChanges();
    flush();
    const menuItems: HTMLElement[] = Array.from(document.querySelectorAll('.mat-mdc-menu-item'));
    menuItems.find(i => i.textContent.trim() === '$.b').click();
    flush();

    // then
    expect(attr.value).toBe('$.b');
    expect(component.columnMappings).toBeNull();
  }));

  it('column mapping rows should wrap fields with gap', fakeAsync(() => {

    // given
    initUpToDetectColumns();

    // when
    const style = getComputedStyle(fixture.nativeElement.querySelector('koia-column-mapping > div'));

    // then
    expect(style.flexWrap).toBe('wrap');
    expect(style.columnGap).toBe('12px');
  }));

  it('#onDataTypeChanged should show data format fields when TIME', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    const columnMapping: ColumnMappingComponent = fixture.debugElement.queryAll(By.directive(ColumnMappingComponent))[1].componentInstance;
    columnMapping.mapping.target.dataType = DataType.TIME;

    // when
    columnMapping.onDataTypeChanged();

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
    expect(matSelect.value).toBe(columnMapping.dateFormats[0]);
  }));

  it('#click on date format icon should show DatePipe format page', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    const columnMapping: ColumnMappingComponent = fixture.debugElement.queryAll(By.directive(ColumnMappingComponent))[1].componentInstance;
    columnMapping.mapping.target.dataType = DataType.TIME;
    columnMapping.onDataTypeChanged();
    fixture.detectChanges();
    vi.spyOn(window, 'open').mockReturnValue(undefined);
    const refreshPreviewButtons: HTMLButtonElement[] =
      fixture.debugElement.queryAll(By.css('.but_date_formats')).map(de => de.nativeElement);

    // when
    refreshPreviewButtons[0].click();

    // then
    expect(window.open).toHaveBeenCalledWith('https://angular.io/api/common/DatePipe#custom-format-options', '_blank', 'noopener');
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
    ]);
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
    ]);
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
    ]);
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('#click on "Load Data" should import values by source column name when adopted column mappings lack skipped columns', fakeAsync(() => {

    // given
    const sceneInfo = createSceneInfos(1)[0];
    sceneInfo.columnMappings = [
      { source: { name: 'Name', dataType: DataType.TEXT, width: 10 }, target: { name: 'Name', dataType: DataType.TEXT, width: 10 } },
      { source: { name: 'Amount', dataType: DataType.NUMBER, width: 10 }, target: { name: 'Amount', dataType: DataType.NUMBER, width: 10 } }
    ];
    component.columnMappingsSource = sceneInfo;
    component.adoptColumnsFromExistingScene = true;
    initUpToDetectColumns({ columnNames: ['Name', 'Skipped', 'Amount'], tableData: [['A', 'x', '1']] });

    // when
    loadData(dataHandler => {
      dataHandler.onValues([['B', 'y', '2']]);
      dataHandler.onComplete();
    });

    // then
    expect(vi.mocked(dbService.writeEntries).mock.calls).toEqual([['data_1', [{ _id: '1000001', Name: 'B', Amount: 2 }]]]);
  }));

  it('#onColumnChanged should invalidate column mappings when target name starts with $', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    component.columnMappings[0].target.name = '$Name';

    // when
    component.onColumnChanged();

    // then
    expect(component.columnMappingsValid).toBe(false);
  }));

  it('#onColumnChanged should invalidate column mappings with target name starting with underscore', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    component.columnMappings[0].target.name = '_id';

    // when
    component.onColumnChanged();

    // then
    expect(component.columnMappingsValid).toBe(false);
  }));

  it('#onColumnChanged should invalidate column mappings with duplicate target names', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    component.columnMappings[1].target.name = component.columnMappings[0].target.name;

    // when
    component.onColumnChanged();

    // then
    expect(component.columnMappingsValid).toBe(false);
  }));

  it('#isNameInUse should report mapping whose target name is used by another mapping', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    component.columnMappings[1].target.name = component.columnMappings[0].target.name;

    // when
    const nameInUse = component.isNameInUse(component.columnMappings[0]);

    // then
    expect(nameInUse).toBe(true);
  }));

  it('#isNameInUse should not report mapping with unique target name', fakeAsync(() => {

    // given
    initUpToDetectColumns();

    // when
    const nameInUse = component.isNameInUse(component.columnMappings[0]);

    // then
    expect(nameInUse).toBe(false);
  }));

  it('#isNameInUse should ignore skipped mapping when checking duplicate names', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    component.columnMappings[1].target.name = component.columnMappings[0].target.name;
    component.deleteColumnMapping(component.columnMappings[1]);

    // when
    const nameInUse = component.isNameInUse(component.columnMappings[0]);

    // then
    expect(nameInUse).toBe(false);
    expect(component.columnMappingsValid).toBe(true);
  }));

  it('#click on cancel button while scene is being persisted should not read data', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    vi.spyOn(component.selectedReader, 'readData').mockReturnValue(undefined);
    let resolvePersist: (scene: Scene) => void;
    vi.spyOn(dbService, 'persistScene').mockReturnValue(new Promise<Scene>(resolve => resolvePersist = resolve));
    fixture.debugElement.query(By.css('#but_load_data')).nativeElement.click();
    flushMicrotasks();

    // when
    component.cancel();
    resolvePersist(component.scene);
    flush();

    // then
    expect(component.selectedReader.readData).not.toHaveBeenCalled();
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

  it('#ngOnInit should select browser default locale when OS default locale is not supported', fakeAsync(() => {

    // given
    vi.spyOn(LocaleUtils, 'supportedLocales').mockReturnValue(['de-CH', 'en-US']);
    vi.spyOn(LocaleUtils, 'osDefaultLocale').mockReturnValue('xx');
    vi.spyOn(LocaleUtils, 'browserDefaultLocale').mockReturnValue('de-CH');

    // when
    component.ngOnInit();
    flush();

    // then
    expect(component.selectedLocale).toBe('de-CH');
  }));

  it('#ngOnInit should select en-US when neither OS nor browser default locale is supported', fakeAsync(() => {

    // given
    vi.spyOn(LocaleUtils, 'supportedLocales').mockReturnValue(['de-CH', 'en-US']);
    vi.spyOn(LocaleUtils, 'osDefaultLocale').mockReturnValue('xx');
    vi.spyOn(LocaleUtils, 'browserDefaultLocale').mockReturnValue('yy');

    // when
    component.ngOnInit();
    flush();

    // then
    expect(component.selectedLocale).toBe('en-US');
  }));

  it('#ngOnInit should select en when en-US is not supported', fakeAsync(() => {

    // given
    vi.spyOn(LocaleUtils, 'supportedLocales').mockReturnValue(['de-CH', 'en']);
    vi.spyOn(LocaleUtils, 'osDefaultLocale').mockReturnValue('xx');
    vi.spyOn(LocaleUtils, 'browserDefaultLocale').mockReturnValue('yy');

    // when
    component.ngOnInit();
    flush();

    // then
    expect(component.selectedLocale).toBe('en');
  }));

  it('#ngOnInit should select first supported locale when no English locale is supported', fakeAsync(() => {

    // given
    vi.spyOn(LocaleUtils, 'supportedLocales').mockReturnValue(['de-CH', 'fr-CH']);
    vi.spyOn(LocaleUtils, 'osDefaultLocale').mockReturnValue('xx');
    vi.spyOn(LocaleUtils, 'browserDefaultLocale').mockReturnValue('yy');

    // when
    component.ngOnInit();
    flush();

    // then
    expect(component.selectedLocale).toBe('de-CH');
  }));

  it('#ngOnInit should notify error when free database name cannot be found', fakeAsync(() => {

    // given
    vi.spyOn(dbService, 'findFreeDatabaseName').mockRejectedValue('no database');

    // when
    component.ngOnInit();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'no database');
  }));

  it('#onCharacterEncodingChange should read file header again', fakeAsync(() => {

    // given
    loadSample();
    vi.mocked(readerService.readHeader).mockClear();

    // when
    component.onCharacterEncodingChange();
    flush();

    // then
    expect(readerService.readHeader).toHaveBeenCalledWith(component.file, 10_000, component.encoding);
  }));

  it('#onCharacterEncodingChange should not read file header when no file is selected', fakeAsync(() => {

    // given
    vi.spyOn(readerService, 'readHeader').mockResolvedValue('dummy');

    // when
    component.onCharacterEncodingChange();
    flush();

    // then
    expect(readerService.readHeader).not.toHaveBeenCalled();
  }));

  it('#onCharacterEncodingChange should keep scene name and short description edited by user', fakeAsync(() => {

    // given
    loadSample();
    component.scene.name = 'My Scene';
    component.scene.shortDescription = 'My Description';

    // when
    component.onCharacterEncodingChange();
    flush();

    // then
    expect(component.scene.name).toBe('My Scene');
    expect(component.scene.shortDescription).toBe('My Description');
  }));

  it('#onFileSelChange should not show binary file header', fakeAsync(() => {

    // given
    vi.spyOn(component.selectedReader, 'expectsPlainTextData').mockReturnValue(false);

    // when
    loadSample();

    // then
    expect(component.fileHeader).toBe('*** binary data cannot be displayed ***');
  }));

  it('#readSample should detect columns of sample entries', fakeAsync(() => {

    // when
    initUpToDetectColumns({ entries: [{ Name: 'A', Amount: 1 }, { Name: 'B', Amount: 2 }] });

    // then
    expect(component.columnMappings.map(cp => cp.target.name)).toEqual(['Name', 'Amount']);
    expect(component.previewData.map(mr => mr.entry)).toEqual([
      { _id: '1000001', Name: 'A', Amount: 1 },
      { _id: '1000002', Name: 'B', Amount: 2 }
    ]);
  }));

  it('#readSample should keep level column of sample', fakeAsync(() => {

    // when
    initUpToDetectColumns({ entries: [{ Level: 'INFO' }], levelColumn: 'Level' });

    // then
    expect(component.levelColumn).toBe('Level');
  }));

  it('#readSample should color preview entries by their log level', fakeAsync(() => {

    // when
    initUpToDetectColumns(levelSample);

    // then
    expect(component.previewData.map(mr => mr.entry)).toEqual([
      { _id: '1000001', Level: 'WARN', Message: 'a', bgcolor: '#fed255' },
      { _id: '1000002', Level: 'INFO', Message: 'b' }
    ]);
  }));

  it('#deleteColumnMapping of level column should remove preview colors', fakeAsync(() => {

    // given
    initUpToDetectColumns(levelSample);

    // when
    component.deleteColumnMapping(component.columnMappings.find(cp => cp.source.name === 'Level'));

    // then
    expect(component.previewData.map(mr => mr.entry)).toEqual([
      { _id: '1000001', Message: 'a' },
      { _id: '1000002', Message: 'b' }
    ]);
  }));

  it('#initContext should forget level column', fakeAsync(() => {

    // given
    initUpToDetectColumns({ entries: [{ Level: 'INFO' }], levelColumn: 'Level' });

    // when
    component.initContext();

    // then
    expect(component.levelColumn).toBeUndefined();
  }));

  it('#readSample should adopt copy of column mappings of existing scene', fakeAsync(() => {

    // given
    loadSample();
    const sceneInfo = createSceneInfos(1)[0];
    component.columnMappingsSource = sceneInfo;
    component.adoptColumnsFromExistingScene = true;
    vi.spyOn(component.selectedReader, 'readSample').mockResolvedValue({ tableData: tableData.slice(0, 4) });

    // when
    component.readSample();
    flush();

    // then
    expect(component.columnMappings).toEqual(sceneInfo.columnMappings);
    expect(component.columnMappings).not.toBe(sceneInfo.columnMappings);
    expect(component.columnMappings[0]).not.toBe(sceneInfo.columnMappings[0]);
  }));

  it('#readSample should notify error when sample cannot be read', fakeAsync(() => {

    // given
    loadSample();
    vi.spyOn(component.selectedReader, 'readSample').mockRejectedValue('corrupt file');

    // when
    fixture.debugElement.query(By.css('#but_detect_columns')).nativeElement.click();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'corrupt file');
    expect(component.readingSample).toBe(false);
  }));

  it('#click on "Load Data" should show initializing tasks progress', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    vi.spyOn(dbService, 'persistScene').mockImplementation((scene: Scene, activate: boolean, monitor: PromiseProgressMonitor) => {
      monitor.add('create database', new Promise(() => null));
      return new Promise(() => null);
    });

    // when
    fixture.debugElement.query(By.css('#but_load_data')).nativeElement.click();
    flush();

    // then
    expect(component.progressBarMode).toBe('determinate');
    expect(component.percentPersisted).toBe(0);
    expect(component.feedback).toBe('Tasks (0/1) - initializing data load...');
  }));

  it('#click on "Load Data" should show completed tasks progress', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    vi.spyOn(dbService, 'persistScene').mockImplementation((scene: Scene, activate: boolean, monitor: PromiseProgressMonitor) => {
      monitor.add('create database', Promise.resolve());
      return new Promise(() => null);
    });

    // when
    fixture.debugElement.query(By.css('#but_load_data')).nativeElement.click();
    flush();

    // then
    expect(component.percentPersisted).toBe(100);
    expect(component.feedback).toBe('Tasks (1/1) - create database completed');
  }));

  it('#click on "Load Data" should reset creation time and progress bar when scene cannot be persisted', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    vi.spyOn(dbService, 'persistScene').mockRejectedValue('conflict');

    // when
    fixture.debugElement.query(By.css('#but_load_data')).nativeElement.click();
    flush();

    // then
    expect(component.scene.creationTime).toBeUndefined();
    expect(component.progressBarMode).toBeUndefined();
  }));

  it('#click on "Load Data" should persist scene into database that is free when loading starts', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    vi.spyOn(dbService, 'findFreeDatabaseName').mockResolvedValue('data_2');
    vi.spyOn(component.selectedReader, 'readData').mockImplementation((file: File, chunkSize: number, dataHandler: DataHandler) => {
      dataHandler.onValues(tableData);
      dataHandler.onComplete();
    });
    vi.spyOn(dbService, 'persistScene').mockImplementation((scene: Scene) => Promise.resolve(scene));

    // when
    fixture.debugElement.query(By.css('#but_load_data')).nativeElement.click();
    flush();

    // then
    expect(vi.mocked(dbService.persistScene).mock.lastCall[0].database).toBe('data_2');
    expect(dbService.writeEntries).toHaveBeenCalledWith('data_2', expect.any(Array));
  }));

  it('#click on "Load Data" should notify error and reset creation time when no free database is found', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    vi.spyOn(dbService, 'findFreeDatabaseName').mockRejectedValue('no database');
    vi.spyOn(dbService, 'persistScene');

    // when
    fixture.debugElement.query(By.css('#but_load_data')).nativeElement.click();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(expect.anything(), 'no database');
    expect(dbService.persistScene).not.toHaveBeenCalled();
    expect(component.scene.creationTime).toBeUndefined();
    expect(component.progressBarMode).toBeUndefined();
  }));

  it('#click on "Load Data" should import entries provided by reader', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    const [name1, name2] = component.columnMappings.map(cp => cp.source.name);

    // when
    loadData(dataHandler => {
      dataHandler.onEntries([{ [name1]: 'D', [name2]: '4' }]);
      dataHandler.onComplete();
    });

    // then
    expect(vi.mocked(dbService.writeEntries).mock.calls).toEqual([['data_1', [{ _id: '1000001', 'Column 1': 'D', 'Column 2': 4 }]]]);
    expect(notificationService.onSuccess).toHaveBeenCalled();
  }));

  it('#click on "Load Data" should color entries by their log level', fakeAsync(() => {

    // given
    initUpToDetectColumns({ entries: [{ Level: 'INFO', Message: 'started' }], levelColumn: 'Level' });

    // when
    loadData(dataHandler => {
      dataHandler.onEntries([{ Level: 'ERROR', Message: 'a' }, { Level: 'WARN', Message: 'b' }, { Level: 'INFO', Message: 'c' }]);
      dataHandler.onComplete();
    });

    // then
    expect(vi.mocked(dbService.writeEntries).mock.calls).toEqual([['data_1', [
      { _id: '1000001', Level: 'ERROR', Message: 'a', bgcolor: '#ff785a' },
      { _id: '1000002', Level: 'WARN', Message: 'b', bgcolor: '#fed255' },
      { _id: '1000003', Level: 'INFO', Message: 'c' }
    ]]]);
  }));

  it('#click on "Load Data" should not color entries without level column', fakeAsync(() => {

    // given
    initUpToDetectColumns({ entries: [{ Level: 'INFO', Message: 'started' }] });

    // when
    loadData(dataHandler => {
      dataHandler.onEntries([{ Level: 'ERROR', Message: 'a' }]);
      dataHandler.onComplete();
    });

    // then
    expect(vi.mocked(dbService.writeEntries).mock.calls).toEqual([['data_1', [{ _id: '1000001', Level: 'ERROR', Message: 'a' }]]]);
  }));

  it('#click on "Load Data" should show number of items read', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    let handler: DataHandler;
    loadData(dataHandler => handler = dataHandler);

    // when
    handler.onValues(tableData);

    // then
    expect(component.feedback).toBe('3 items read');
  }));

  it('#click on "Load Data" should show number of items read while aborting', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    let handler: DataHandler;
    loadData(dataHandler => handler = dataHandler);
    component.canceled = true;

    // when
    handler.onValues(tableData);

    // then
    expect(component.feedback).toBe('3 items read aborting...');
  }));

  it('#click on "Load Data" should report reading canceled and ignore values after cancel', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    let handler: DataHandler;
    loadData(dataHandler => handler = dataHandler);
    const canceledBefore = handler.isCanceled();

    // when
    component.cancel();
    handler.onValues(tableData);
    flush();

    // then
    expect(canceledBefore).toBe(false);
    expect(handler.isCanceled()).toBe(true);
    expect(dbService.writeEntries).not.toHaveBeenCalled();
  }));

  it('#click on "Load Data" should warn about mapping errors', fakeAsync(() => {

    // when
    initUpToDetectColumns();
    loadData(dataHandler => {
      dataHandler.onValues([['D', 'x']]);
      dataHandler.onComplete();
    });

    // then
    expect(notificationService.onWarning).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet),
      expect.stringContaining('1 mapping errors did occur...'));
    expect(notificationService.onSuccess).not.toHaveBeenCalled();
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('#click on "Load Data" should abort on mapping error when requested', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    component.abortDataloadOnError = true;

    // when
    loadData(dataHandler => {
      dataHandler.onValues([['D', 'x']]);
      dataHandler.onValues(tableData);
      dataHandler.onComplete();
    });

    // then
    expect(dbService.writeEntries).not.toHaveBeenCalled();
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('#click on cancel button should warn that loading was canceled', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    loadData(dataHandler => dataHandler.onValues(tableData));

    // when
    component.cancel();
    flush();

    // then
    expect(notificationService.onWarning).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet),
      'Loading canceled: 0 items have been persisted in the database');
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('#click on cancel button should not write queued entries when reader completes afterwards', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    let handler: DataHandler;
    loadData(dataHandler => {
      handler = dataHandler;
      dataHandler.onValues(tableData);
    });
    component.cancel();

    // when
    handler.onComplete();
    flush();

    // then
    expect(dbService.writeEntries).not.toHaveBeenCalled();
  }));

  it('#click on "Load Data" should not complete posting again when reader fails after cancel', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    let handler: DataHandler;
    loadData(dataHandler => handler = dataHandler);
    component.cancel();
    const postingComplete = vi.spyOn(EntryPersister.prototype, 'postingComplete');

    // when
    handler.onError('read error');
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'read error');
    expect(postingComplete).not.toHaveBeenCalled();
  }));

  it('#click on "Load Data" should import number of items limited by max items', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    component.maxItemsToLoadControl.setValue(2);

    // when
    loadData(dataHandler => {
      dataHandler.onValues(tableData);
      dataHandler.onComplete();
    });

    // then
    expect(vi.mocked(dbService.writeEntries).mock.calls.flatMap(c => c[1]).length).toBe(2);
  }));

  it('#click on "Load Data" should import number of items limited by formatted max items', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    component.maxItemsToLoadControl.setValue((1_000).toLocaleString() as unknown as number);
    const rows = Array.from({ length: 1_500 }, (v, i) => ['A', String(i)]);

    // when
    loadData(dataHandler => {
      dataHandler.onValues(rows);
      dataHandler.onComplete();
    });

    // then
    expect(vi.mocked(dbService.writeEntries).mock.calls.flatMap(c => c[1]).length).toBe(1_000);
  }));

  it('#click on "Load Data" should reset progress bar and not notify success when data cannot be read', fakeAsync(() => {

    // given
    initUpToDetectColumns();

    // when
    loadData(dataHandler => dataHandler.onError('read error'));

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'read error');
    expect(notificationService.onSuccess).not.toHaveBeenCalled();
    expect(component.progressBarMode).toBeUndefined();
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('#click on "Load Data" should not notify success when entries cannot be written', fakeAsync(() => {

    // given
    initUpToDetectColumns();
    vi.spyOn(dbService, 'writeEntries').mockRejectedValue('disk full');

    // when
    loadData(dataHandler => {
      dataHandler.onValues(tableData);
      dataHandler.onComplete();
    });

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'disk full');
    expect(notificationService.onSuccess).not.toHaveBeenCalled();
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.SCENES);
  }));

  function loadData(readData: (dataHandler: DataHandler) => void): void {
    vi.spyOn(component.selectedReader, 'readData').mockImplementation((file: File, chunkSize: number, dataHandler: DataHandler) =>
      readData(dataHandler));
    vi.spyOn(dbService, 'persistScene').mockImplementation((scene: Scene) => Promise.resolve(scene));
    fixture.debugElement.query(By.css('#but_load_data')).nativeElement.click();
    flush();
  }

  describe('pattern columns', () => {

    const messages: Sample = { entries: [{ Message: 'Request r1 done', Amount: 1 }, { Message: 'Request r2 done', Amount: 2 }] };

    function message(): ColumnPair {
      return component.columnMappings.find(cp => cp.source.name === 'Message' && !cp.target.patternOf);
    }

    function pattern(): ColumnPair {
      return component.columnMappings.find(cp => !!cp.target.patternOf);
    }

    it('#canAddPattern should allow pattern of text column only', fakeAsync(() => {

      // when
      initUpToDetectColumns(messages);

      // then
      expect(component.canAddPattern(message())).toBe(true);
      expect(component.canAddPattern(component.columnMappings[1])).toBe(false);
    }));

    it('should not offer pattern of column with single token values', fakeAsync(() => {

      // when
      initUpToDetectColumns({ entries: [{ Host: 'node-1' }, { Host: 'node-2' }] });

      // then
      expect(component.columnMappings[0].target.dataType).toBe(DataType.TEXT);
      expect(fixture.debugElement.query(By.css('.but_add_pattern'))).toBeNull();
    }));

    it('#cancel on file input should offer pattern of restored sample', fakeAsync(() => {

      // given
      initUpToDetectColumns(messages);
      clickSelectFile();
      window.dispatchEvent(new Event('focus'));

      // when
      component.fileInputRef.nativeElement.dispatchEvent(new Event('cancel'));

      // then
      expect(component.canAddPattern(message())).toBe(true);
    }));

    it('#canAddPattern should not allow pattern of skipped column', fakeAsync(() => {

      // given
      initUpToDetectColumns(messages);

      // when
      component.deleteColumnMapping(message());

      // then
      expect(component.canAddPattern(message())).toBe(false);
    }));

    it('#canAddPattern should not allow second pattern nor pattern of pattern', fakeAsync(() => {

      // given
      initUpToDetectColumns(messages);

      // when
      component.addPatternColumn(message());

      // then
      expect(component.canAddPattern(message())).toBe(false);
      expect(component.canAddPattern(pattern())).toBe(false);
    }));

    it('#canAddPattern should allow pattern again when pattern column was deleted', fakeAsync(() => {

      // given
      initUpToDetectColumns(messages);
      component.addPatternColumn(message());

      // when
      component.deleteColumnMapping(pattern());

      // then
      expect(component.canAddPattern(message())).toBe(true);
    }));

    it('click on add pattern button should insert pattern column after message column and preview its values', fakeAsync(() => {

      // given
      initUpToDetectColumns(messages);

      // when
      fixture.debugElement.query(By.css('.but_add_pattern')).nativeElement.click();
      fixture.detectChanges();

      // then
      expect(component.columnMappings.map(cp => cp.target.name)).toEqual(['Message', 'Message pattern', 'Amount']);
      expect(pattern().source).toEqual(message().source);
      expect(pattern().source).not.toBe(message().source);
      expect(pattern().target).toEqual({
        name: 'Message pattern', dataType: DataType.TEXT, width: message().target.width, indexed: true, patternOf: 'Message'
      });
      expect(component.previewData.map(mr => mr.entry)).toEqual([
        { _id: '1000001', Message: 'Request r1 done', 'Message pattern': 'Request <*> done', Amount: 1 },
        { _id: '1000002', Message: 'Request r2 done', 'Message pattern': 'Request <*> done', Amount: 2 }
      ]);
    }));

    it('#addPatternColumn should number name when it is in use', fakeAsync(() => {

      // given
      initUpToDetectColumns(messages);
      component.columnMappings[1].target.name = 'Message pattern';

      // when
      component.addPatternColumn(message());

      // then
      expect(pattern().target.name).toBe('Message pattern (2)');
    }));

    it('#onColumnChanged should let pattern refer to renamed message column', fakeAsync(() => {

      // given
      initUpToDetectColumns(messages);
      component.addPatternColumn(message());
      message().target.name = 'Text';

      // when
      component.onColumnChanged();

      // then
      expect(pattern().target.patternOf).toBe('Text');
    }));

    it('#deleteColumnMapping should let pattern refer to source column of deleted message column', fakeAsync(() => {

      // given
      initUpToDetectColumns(messages);
      component.addPatternColumn(message());
      message().target.name = 'Text';
      component.onColumnChanged();

      // when
      component.deleteColumnMapping(message());
      component.columnMappings[2].target.name = 'Text';
      component.onColumnChanged();

      // then
      expect(pattern().target.patternOf).toBe('Message');
    }));

    it('#persistScene should persist pattern column referring to current message column name', fakeAsync(() => {

      // given
      initUpToDetectColumns(messages);
      component.addPatternColumn(message());
      message().target.name = 'Text';
      vi.spyOn(component.selectedReader, 'readData').mockImplementation((file: File, chunkSize: number, dataHandler: DataHandler) => {
        dataHandler.onEntries(messages.entries);
        dataHandler.onComplete();
      });
      vi.spyOn(dbService, 'persistScene').mockImplementation((scene: Scene) => Promise.resolve(scene));

      // when
      component.persistScene();
      flush();

      // then
      expect(component.scene.columns.map(c => c.patternOf)).toEqual([undefined, 'Text', undefined]);
      expect(dbService.writeEntries).toHaveBeenCalledWith('data_1', [
        expect.objectContaining({ Text: 'Request r1 done', 'Message pattern': 'Request <*> done', Amount: 1 }),
        expect.objectContaining({ Text: 'Request r2 done', 'Message pattern': 'Request <*> done', Amount: 2 })
      ]);
    }));

    it('#readSample should link adopted pattern column to message column it refers to', fakeAsync(() => {

      // given
      initUpToDetectColumns(messages);
      component.addPatternColumn(message());
      message().target.name = 'Text';
      component.onColumnChanged();
      component.columnMappingsSource = { ...createSceneInfos(1)[0], columnMappings: [...component.columnMappings].reverse() };
      component.adoptColumnsFromExistingScene = true;

      // when
      component.readSample();
      flush();
      message().target.name = 'Body';
      component.onColumnChanged();

      // then
      expect(pattern().target.patternOf).toBe('Body');
    }));

    it('#readSample should link adopted pattern column to message column of same source when referred column is missing',
      fakeAsync(() => {

        // given
        initUpToDetectColumns(messages);
        component.addPatternColumn(message());
        pattern().target.patternOf = 'Gone';
        component.columnMappingsSource = { ...createSceneInfos(1)[0], columnMappings: component.columnMappings };
        component.adoptColumnsFromExistingScene = true;

        // when
        component.readSample();
        flush();
        component.onColumnChanged();

        // then
        expect(pattern().target.patternOf).toBe('Message');
      }));

    it('#readSample should keep adopted pattern column without message column', fakeAsync(() => {

      // given
      initUpToDetectColumns(messages);
      component.addPatternColumn(message());
      pattern().target.patternOf = 'Gone';
      component.columnMappingsSource = { ...createSceneInfos(1)[0], columnMappings: [pattern()] };
      component.adoptColumnsFromExistingScene = true;

      // when
      component.readSample();
      flush();
      component.onColumnChanged();

      // then
      expect(component.columnMappings.map(cp => cp.target.patternOf)).toEqual(['Gone']);
    }));

    it('#cancel on file input should keep pattern column linked to message column', fakeAsync(() => {

      // given
      initUpToDetectColumns(messages);
      component.addPatternColumn(message());
      clickSelectFile();
      window.dispatchEvent(new Event('focus'));
      component.fileInputRef.nativeElement.dispatchEvent(new Event('cancel'));
      message().target.name = 'Text';

      // when
      component.onColumnChanged();

      // then
      expect(pattern().target.patternOf).toBe('Text');
    }));
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

  function showValueChoiceAttribute(): Attribute {
    const attr = new Attribute('Path', 'desc', DataType.TEXT, '$.a');
    attr.valueChoice = ['$.a', '$.b'];
    component.readerAttributes = [attr];
    component.fileHeader = 'x';
    fixture.detectChanges();
    return attr;
  }

  function initUpToDetectColumns(sample: Sample = { tableData: tableData.slice(0, 4) }): void {
    const fileList = createFileList('dummy data');
    vi.spyOn(readerService, 'readHeader').mockResolvedValue('dummy');
    component.onFileSelChange(fileList);
    flush();
    fixture.detectChanges();
    vi.spyOn(component.selectedReader, 'readSample').mockResolvedValue(sample);
    fixture.debugElement.query(By.css('#but_detect_columns')).nativeElement.click();
    flush();
    fixture.detectChanges();
    flush();
  }

  function createFileList(data: string): FileList {
    const file = new File([data], 'Test.csv');
    return {
      0: file,
      length: 1,
      item: () => file
    } as unknown as FileList;
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
