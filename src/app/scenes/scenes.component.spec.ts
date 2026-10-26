import { Location } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { By } from '@angular/platform-browser';
import { Router, RouteReuseStrategy, RouterModule } from '@angular/router';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { ConfirmDialogComponent, ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { Route, Scene } from 'app/shared/model';
import { DialogService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { KoiaFormDirective } from 'app/shared/directives/koia-form.directive';
import { LanguageSelectComponent } from 'app/shared/ui/language-select/language-select.component';
import { NavButtonsComponent } from 'app/shared/ui/nav-buttons/nav-buttons.component';
import { PageFrameComponent } from 'app/shared/ui/page-frame/page-frame.component';
import { SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { Observable, of } from 'rxjs';
import { SceneTableComponent } from './scene-table/scene-table.component';
import { ScenesComponent } from './scenes.component';
import type { Mock } from 'vitest';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class RawDataComponent { }

describe('ScenesComponent', () => {

  const appRouteReuseStrategy = new AppRouteReuseStrategy();
  let scenes: Scene[];
  const dbService = new DBService(null, null);
  const dialogService = new DialogService(null);
  const notificationService = new NotificationServiceMock();
  let navigateByUrlSpy: Mock;
  let isBackendInitializedSpy: Mock;
  let getActiveSceneSpy: Mock;
  let findSceneInfosSpy: Mock;
  let findSceneActivationTimesSpy: Mock;
  let component: ScenesComponent;
  let fixture: ComponentFixture<ScenesComponent>;

  beforeAll(() => {
    const scene1 = SceneFactory.createScene('1', []);
    const scene2 = SceneFactory.createScene('2', []);
    const scene3 = SceneFactory.createScene('3', []);
    scenes = [scene1, scene2, scene3];
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ScenesComponent, RawDataComponent, SceneTableComponent, KoiaFormDirective, LanguageSelectComponent, PageFrameComponent,
        NavButtonsComponent],
      imports: [MatBottomSheetModule, MatDialogModule, MatCardModule, MatTooltipModule,
        MatMenuModule, FormsModule, MatInputModule, MatButtonModule, MatIconModule, MatTableModule,
        RouterModule.forRoot([{ path: '**', component: RawDataComponent }], {})],
      providers: [Location, MatBottomSheet,
        { provide: DBService, useValue: dbService },
        { provide: DialogService, useValue: dialogService },
        { provide: NotificationService, useValue: notificationService },
        { provide: RouteReuseStrategy, useValue: appRouteReuseStrategy },
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigateByUrlSpy = vi.spyOn(router, 'navigateByUrl').mockReturnValue(undefined);

    vi.spyOn(appRouteReuseStrategy, 'clear').mockReturnValue(undefined);
    vi.spyOn(notificationService, 'onSuccess').mockReturnValue(undefined);
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);
    isBackendInitializedSpy = vi.spyOn(dbService, 'isBackendInitialized').mockReturnValue(true);
    vi.spyOn(dbService, 'initBackend').mockResolvedValue(undefined);
    getActiveSceneSpy = vi.spyOn(dbService, 'getActiveScene').mockReturnValue(scenes[0]);
    findSceneInfosSpy = vi.spyOn(dbService, 'findSceneInfos').mockResolvedValue(scenes);
    findSceneActivationTimesSpy = vi.spyOn(dbService, 'findSceneActivationTimes').mockResolvedValue(new Map([['2', Date.now() + 1000], ['3', Date.now() + 2000]]));
    vi.spyOn(dbService, 'findScene').mockResolvedValue(scenes[0]);
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(ScenesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flush();
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should find active scene', () => {
    expect(component.activeScene).toBe(scenes[0]);
  });

  it('should read scene infos', () => {
    expect(component.filteredSceneInfos).toBeDefined();
    expect(component.filteredSceneInfos.length).toBe(3);
  });

  it('#ngOnInit should navigate to front page when backend is not initialized', () => {

    // given
    isBackendInitializedSpy.mockReturnValue(false);

    // when
    component.ngOnInit();

    // then
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.FRONT);
  });

  it('#ngOnInit should notify error when scene infos cannot be read', fakeAsync(() => {

    // given
    findSceneInfosSpy.mockRejectedValue('db error');

    // when
    component.ngOnInit();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'db error');
  }));

  it('#onFilterChange should not filter scene infos when filter is blank', () => {

    // when
    component.filter = '';
    component.onFilterChange();

    // then
    expect(component.filteredSceneInfos.length).toBe(scenes.length);
  });

  it('#onFilterChange should filter scene infos when filter matches name', () => {

    // when
    component.filter = 'e 1';
    component.onFilterChange();

    // then
    expect(component.filteredSceneInfos.length).toBe(1);
  });

  it('#onFilterChange should filter scene infos when filter matches short description', () => {

    // when
    component.filter = '2 s';
    component.onFilterChange();

    // then
    expect(component.filteredSceneInfos.length).toBe(1);
  });

  it('filter field should be outlined form field with search icon', () => {

    // when
    const formField: HTMLElement = fixture.nativeElement.querySelector('#div_filter mat-form-field');

    // then
    expect(formField.classList).toContain('mat-form-field-appearance-outline');
    expect(formField.querySelector('mat-icon[matprefix]').textContent).toBe('search');
  });

  it('typing into filter field should filter scene infos', () => {

    // given
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#div_filter input');

    // when
    input.value = 'e 1';
    input.dispatchEvent(new Event('input'));

    // then
    expect(component.filteredSceneInfos.length).toBe(1);
  });

  it('page title should be "Scenes"', () => {

    // when
    const title: HTMLElement = fixture.nativeElement.querySelector('koia-page-frame .page_title');

    // then
    expect(title.textContent).toBe('Scenes');
    expect(fixture.nativeElement.querySelectorAll('mat-card').length).toBe(1);
  });

  it('should frame page as scenes page', () => {

    // when
    const frame: PageFrameComponent = fixture.debugElement.query(By.directive(PageFrameComponent)).componentInstance;

    // then
    expect(frame.active).toBe(Route.SCENES);
    expect(frame.scenesExist).toBe(true);
  });

  it('should list active scene on top, others by activation time', () => {

    // when
    const names = rowNames();

    // then
    expect(names).toEqual(['Scene 1', 'Scene 3', 'Scene 2']);
    expect(fixture.nativeElement.querySelector('tr.mat-mdc-row').classList).toContain('active-scene');
  });

  it('should mark no scene when none is active', fakeAsync(() => {

    // given
    getActiveSceneSpy.mockReturnValue(undefined);

    // when
    component.ngOnInit();
    flush();
    fixture.detectChanges();

    // then
    expect(rowNames()).toEqual(['Scene 3', 'Scene 2', 'Scene 1']);
    expect(fixture.nativeElement.querySelectorAll('tr.active-scene').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.continueActiveScene').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.activateScene').length).toBe(3);
  }));

  it('scene table header should have row background with semi-bold labels and bottom line', () => {

    // when
    const headerStyle = getComputedStyle(fixture.nativeElement.querySelector('.mat-mdc-header-cell'));
    const cellStyle = getComputedStyle(fixture.nativeElement.querySelector('tr.mat-mdc-row:not(.active-scene) .mat-mdc-cell'));

    // then
    expect(headerStyle.fontWeight).toBe('600');
    expect(headerStyle.borderBottomWidth).toBe('2px');
    expect(headerStyle.borderBottomColor).toBe('rgb(212, 212, 212)');
    expect(headerStyle.backgroundColor).toBe(cellStyle.backgroundColor);
  });

  it('#click on "Delete all" button should not delete scenes when not confiremd by user', fakeAsync(() => {

    // given
    getActiveSceneSpy.mockReturnValue(null);
    findSceneInfosSpy.mockResolvedValue([]);
    spyOnConfirmDialogAndPressNo();
    vi.spyOn(dbService, 'deleteScene').mockResolvedValue(null);
    const deleteButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_delete_scenes')).nativeElement;

    // when
    deleteButton.click();
    flush();

    // then
    expect(dbService.deleteScene).not.toHaveBeenCalled();
  }));

  it('#click on "Delete all" button should delete all scenes', fakeAsync(() => {

    // given
    getActiveSceneSpy.mockReturnValue(null);
    findSceneInfosSpy.mockResolvedValue([]);
    spyOnConfirmDialogAndPressYes();
    vi.spyOn(dbService, 'deleteScene').mockResolvedValue(null);
    const deleteButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_delete_scenes')).nativeElement;

    // when
    deleteButton.click();
    flush();

    // then
    expect(dbService.deleteScene).toHaveBeenCalledTimes(scenes.length);
    scenes.forEach(s => expect(dbService.deleteScene).toHaveBeenCalledWith(s));
    expect(notificationService.onSuccess).toHaveBeenCalledTimes(1);
  }));

  it('#click on "Delete all" button should navigate to scene component', fakeAsync(() => {

    // given
    getActiveSceneSpy.mockReturnValue(null);
    findSceneInfosSpy.mockResolvedValue(null);
    spyOnConfirmDialogAndPressYes();
    vi.spyOn(dbService, 'deleteScene').mockResolvedValue(null);
    const deleteButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_delete_scenes')).nativeElement;

    // when
    deleteButton.click();
    flush();

    // then
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.SCENE);
  }));

  it('#click on "Delete all" button should notify error when error occurs', fakeAsync(() => {

    // given
    spyOnConfirmDialogAndPressYes();
    vi.spyOn(dbService, 'deleteScene').mockRejectedValue('error');
    const deleteButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_delete_scenes')).nativeElement;

    // when
    deleteButton.click();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledTimes(1);
  }));

  it('#click on "Delete filtered" button should delete filtered scenes', fakeAsync(() => {

    // given
    component.filter = '1';
    component.onFilterChange();
    spyOnConfirmDialogAndPressYes();
    vi.spyOn(dbService, 'deleteScene').mockResolvedValue(null);
    const deleteButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_delete_scenes')).nativeElement;

    // when
    deleteButton.click();
    flush();

    // then
    expect(dbService.deleteScene).toHaveBeenCalledTimes(1);
    expect(dbService.deleteScene).toHaveBeenCalledWith(scenes[0]);
    expect(notificationService.onSuccess).toHaveBeenCalledTimes(1);
  }));

  it('#click on "Delete filtered" button should reload data', fakeAsync(() => {

    // given
    vi.spyOn(dbService, 'deleteScene').mockResolvedValue(null);
    vi.mocked(getActiveSceneSpy).mockClear();
    vi.mocked(findSceneInfosSpy).mockClear();
    vi.mocked(findSceneActivationTimesSpy).mockClear();
    component.filter = '1';
    component.onFilterChange();
    spyOnConfirmDialogAndPressYes();
    const deleteButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_delete_scenes')).nativeElement;

    // when
    deleteButton.click();
    flush();

    // then
    expect(dbService.getActiveScene).toHaveBeenCalledTimes(1);
    expect(dbService.findSceneInfos).toHaveBeenCalledTimes(1);
    expect(dbService.findSceneActivationTimes).toHaveBeenCalledTimes(1);
  }));

  it('#selecting delete menu item should delete scene', fakeAsync(() => {

    // given
    const scene = scenes[0];
    vi.spyOn(dbService, 'deleteScene').mockResolvedValue(null);
    const moreButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.but_more'))[0].nativeElement;

    // when
    moreButton.click();
    fixture.detectChanges();
    const deleteButton: HTMLButtonElement = fixture.debugElement.query(By.css('.menu_item_delete')).nativeElement;
    deleteButton.click();
    flush();

    // then
    expect(dbService.deleteScene).toHaveBeenCalledWith(scene);
    expect(notificationService.onSuccess).toHaveBeenCalledTimes(1);
  }));

  it('#selecting delete menu item should notify error when error occurs', fakeAsync(() => {

    // given
    const scene = scenes[0];
    vi.spyOn(dbService, 'deleteScene').mockRejectedValue('cannot delete scene');
    const moreButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.but_more'))[0].nativeElement;

    // when
    moreButton.click();
    fixture.detectChanges();
    const deleteButton: HTMLButtonElement = fixture.debugElement.query(By.css('.menu_item_delete')).nativeElement;
    deleteButton.click();
    flush();

    // then
    expect(dbService.deleteScene).toHaveBeenCalledWith(scene);
    expect(notificationService.onError).toHaveBeenCalledTimes(1);
  }));


  it('#click on activate scene button should activate scene and switch to raw data component', fakeAsync(() => {

    // given
    vi.spyOn(dbService, 'activateScene').mockResolvedValue(scenes[1]);
    const htmlButton = activateButtonOf(scenes[1]);

    // when
    htmlButton.click();
    flush();

    // then
    expect(dbService.activateScene).toHaveBeenCalledWith(scenes[1]._id);
    expect(appRouteReuseStrategy.clear).toHaveBeenCalledTimes(1);
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.RAWDATA);
  }));

  it('#click on activate scene button should notify error when error occurs', fakeAsync(() => {

    // given
    vi.spyOn(dbService, 'activateScene').mockRejectedValue('cannot activate scene');
    const htmlButton = activateButtonOf(scenes[1]);

    // when
    htmlButton.click();
    flush();

    // then
    expect(dbService.activateScene).toHaveBeenCalledWith(scenes[1]._id);
    expect(appRouteReuseStrategy.clear).toHaveBeenCalledTimes(0);
    expect(notificationService.onError).toHaveBeenCalledTimes(1);
  }));

  it('#click on continue button should switch to raw data component', () => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('.continueActiveScene')).nativeElement;

    // when
    htmlButton.click();

    // then
    expect(appRouteReuseStrategy.clear).toHaveBeenCalledTimes(0);
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.RAWDATA);
  });

  it('should pass names of all scenes to scene table when filtered', () => {

    // given
    component.filter = '1';
    component.onFilterChange();

    // when
    fixture.detectChanges();

    // then
    expect(sceneTable().existingSceneNames).toEqual(new Set(['Scene 1', 'Scene 2', 'Scene 3']));
  });

  it('#onEdit of scene table should update scene labels, reload data and notify success', fakeAsync(() => {

    // given
    const labels = { _id: '2', name: 'new name', shortDescription: 'new description' };
    vi.spyOn(dbService, 'updateSceneLabels').mockResolvedValue(undefined);
    vi.mocked(findSceneInfosSpy).mockClear();

    // when
    sceneTable().onEdit.emit(labels);
    flush();

    // then
    expect(dbService.updateSceneLabels).toHaveBeenCalledWith(labels);
    expect(dbService.findSceneInfos).toHaveBeenCalledTimes(1);
    expect(notificationService.onSuccess).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'Scene has been updated');
  }));

  it('#onEdit of scene table should notify error and reload data when update fails', fakeAsync(() => {

    // given
    vi.spyOn(dbService, 'updateSceneLabels').mockRejectedValue('conflict');
    vi.mocked(findSceneInfosSpy).mockClear();

    // when
    sceneTable().onEdit.emit({ _id: '2', name: 'new name', shortDescription: 'new description' });
    flush();

    // then
    expect(dbService.findSceneInfos).toHaveBeenCalledTimes(1);
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'conflict');
  }));

  it('editing in scene table should disable filter, delete and cancel buttons', fakeAsync(() => {

    // when
    sceneTable().editingChange.emit(true);
    fixture.detectChanges();
    flush();
    fixture.detectChanges();

    // then
    expect(editLockedControls().map(c => c.disabled)).toEqual([true, true, true]);
  }));

  it('end of editing should enable filter, delete and cancel buttons', fakeAsync(() => {

    // given
    sceneTable().editingChange.emit(true);
    fixture.detectChanges();
    flush();

    // when
    sceneTable().editingChange.emit(false);
    fixture.detectChanges();
    flush();
    fixture.detectChanges();

    // then
    expect(editLockedControls().map(c => c.disabled)).toEqual([false, false, false]);
  }));

  function editLockedControls(): (HTMLInputElement | HTMLButtonElement)[] {
    return ['#div_filter input', '#but_delete_scenes', '#but_cancel'].map(selector => fixture.nativeElement.querySelector(selector));
  }

  it('#click on cancel button should navigate to previous page', () => {

    // given
    const location = TestBed.inject(Location);
    vi.spyOn(location, 'back').mockReturnValue(undefined);
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_cancel')).nativeElement;

    // when
    htmlButton.click();

    // then
    expect(location.back).toHaveBeenCalled();
  });

  function sceneTable(): SceneTableComponent {
    return fixture.debugElement.query(By.directive(SceneTableComponent)).componentInstance;
  }

  function rowNames(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row .scene-name'))
      .map((e: HTMLElement) => e.textContent);
  }

  function activateButtonOf(scene: Scene): HTMLButtonElement {
    return fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'))
      .find(r => r.nativeElement.textContent.includes(scene.name))
      .query(By.css('.activateScene')).nativeElement;
  }

  function spyOnConfirmDialogAndPressYes(): void {
    spyOnConfirmDialogAndPress(0);
  }

  function spyOnConfirmDialogAndPressNo(): void {
    spyOnConfirmDialogAndPress(1);
  }

  function spyOnConfirmDialogAndPress(buttonIndex: number): void {
    const dialogRef = createConfirmDialogRef();
    vi.spyOn(dialogService, 'showConfirmDialog').mockImplementation((data: ConfirmDialogData) => {
      data.closedWithButtonIndex = buttonIndex;
      data.closedWithButtonName = ConfirmDialogData.YES_NO[buttonIndex];
      return dialogRef;
    });
  }

  function createConfirmDialogRef(): MatDialogRef<ConfirmDialogComponent> {
    return <MatDialogRef<ConfirmDialogComponent>>{
      afterClosed(): Observable<boolean> {
        return of(true);
      }
    };
  }
});
