import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { By } from '@angular/platform-browser';
import { Router, RouteReuseStrategy, RouterModule, UrlTree } from '@angular/router';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { ConfirmDialogComponent, ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { Route, Scene } from 'app/shared/model';
import { DialogService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { Observable, of } from 'rxjs';
import { SceneTableComponent } from './scene-table/scene-table.component';
import { ScenesComponent } from './scenes.component';

@Component({
  template: '',
  standalone: false
})
class RawDataComponent { }

describe('ScenesComponent', () => {

  const appRouteReuseStrategy = new AppRouteReuseStrategy();
  let scenes: Scene[];
  const dbService = new DBService(null);
  const dialogService = new DialogService(null);
  const notificationService = new NotificationServiceMock();
  let navigateByUrlSpy: jasmine.Spy;
  let isBackendInitializedSpy: jasmine.Spy;
  let getActiveSceneSpy: jasmine.Spy;
  let findSceneInfosSpy: jasmine.Spy;
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
      declarations: [ScenesComponent, RawDataComponent, SceneTableComponent],
      imports: [MatBottomSheetModule, MatDialogModule, MatCardModule,
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
    navigateByUrlSpy = spyOn(router, 'navigateByUrl');

    spyOn(appRouteReuseStrategy, 'clear');
    spyOn(notificationService, 'onSuccess');
    spyOn(notificationService, 'onError');
    isBackendInitializedSpy = spyOn(dbService, 'isBackendInitialized').and.returnValue(true);
    spyOn(dbService, 'initBackend').and.resolveTo();
    getActiveSceneSpy = spyOn(dbService, 'getActiveScene').and.returnValue(scenes[0]);
    findSceneInfosSpy = spyOn(dbService, 'findSceneInfos').and.resolveTo(scenes);
    spyOn(dbService, 'findScene').and.resolveTo(scenes[0]);
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
    isBackendInitializedSpy.and.returnValue(false);

    // when
    component.ngOnInit();

    // then
    expect(navigateByUrlSpy).toHaveBeenCalledWith(Route.FRONT);
  });


  it('butHome#click should navigate to front component', () => {

    // given
    const butHome: HTMLButtonElement = fixture.debugElement.query(By.css('#butHome')).nativeElement;

    // when
    butHome.click();

    // then
    const urlTree: UrlTree = navigateByUrlSpy.calls.mostRecent().args[0];
    expect(urlTree.toString()).toBe('/' + Route.FRONT);
  });


  it('butScene#click should navigate to scene component', () => {

    // given
    const butScene: HTMLButtonElement = fixture.debugElement.query(By.css('#butScene')).nativeElement;

    // when
    butScene.click();

    // then
    const urlTree: UrlTree = navigateByUrlSpy.calls.mostRecent().args[0];
    expect(urlTree.toString()).toBe('/' + Route.SCENE);
  });

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

  it('#click on "Delete all" button should not delete scenes when not confiremd by user', fakeAsync(() => {

    // given
    getActiveSceneSpy.and.returnValue(null);
    findSceneInfosSpy.and.resolveTo([]);
    spyOnConfirmDialogAndPressNo();
    spyOn(dbService, 'deleteScene').and.resolveTo(null);
    const deleteButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_delete_scenes')).nativeElement;

    // when
    deleteButton.click();
    flush();

    // then
    expect(dbService.deleteScene).not.toHaveBeenCalled();
  }));

  it('#click on "Delete all" button should delete all scenes', fakeAsync(() => {

    // given
    getActiveSceneSpy.and.returnValue(null);
    findSceneInfosSpy.and.resolveTo([]);
    spyOnConfirmDialogAndPressYes();
    spyOn(dbService, 'deleteScene').and.resolveTo(null);
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
    getActiveSceneSpy.and.returnValue(null);
    findSceneInfosSpy.and.resolveTo(null);
    spyOnConfirmDialogAndPressYes();
    spyOn(dbService, 'deleteScene').and.resolveTo(null);
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
    spyOn(dbService, 'deleteScene').and.rejectWith('error');
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
    spyOn(dbService, 'deleteScene').and.resolveTo(null);
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
    spyOn(dbService, 'deleteScene').and.resolveTo(null);
    getActiveSceneSpy.calls.reset();
    findSceneInfosSpy.calls.reset();
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
  }));

  it('#selecting delete menu item should delete scene', fakeAsync(() => {

    // given
    const scene = scenes[0];
    spyOn(dbService, 'deleteScene').and.resolveTo(null);
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
    spyOn(dbService, 'deleteScene').and.rejectWith('cannot delete scene');
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
    spyOn(dbService, 'activateScene').and.resolveTo(scenes[1]);
    const htmlButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.activateScene'))[1].nativeElement;

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
    spyOn(dbService, 'activateScene').and.rejectWith('cannot activate scene');
    const htmlButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.activateScene'))[1].nativeElement;

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

  it('#click on cancel button should navigate to previous page', () => {

    // given
    const location = TestBed.inject(Location);
    spyOn(location, 'back');
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_cancel')).nativeElement;

    // when
    htmlButton.click();

    // then
    expect(location.back).toHaveBeenCalled();
  });

  function spyOnConfirmDialogAndPressYes(): void {
    spyOnConfirmDialogAndPress(0);
  }

  function spyOnConfirmDialogAndPressNo(): void {
    spyOnConfirmDialogAndPress(1);
  }

  function spyOnConfirmDialogAndPress(buttonIndex: number): void {
    const dialogRef = createConfirmDialogRef();
    spyOn(dialogService, 'showConfirmDialog').and.callFake((data: ConfirmDialogData) => {
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
