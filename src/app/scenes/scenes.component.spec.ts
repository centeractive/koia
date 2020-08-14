import { async, ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';

import { ScenesComponent } from './scenes.component';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { DBService } from 'app/shared/services/backend';
import { Scene, Route } from 'app/shared/model';
import { NotificationService, DialogService } from 'app/shared/services';
import { RouterModule, RouteReuseStrategy } from '@angular/router';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { Location } from '@angular/common';
import { SceneFactory } from 'app/shared/test';
import { ConfirmDialogComponent, ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { Observable, of } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBottomSheetModule, MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({ template: '' })
class RawDataComponent { }

describe('ScenesComponent', () => {

  const appRouteReuseStrategy = new AppRouteReuseStrategy();
  let scenes: Scene[];
  const dbService = new DBService(null);
  const dialogService = new DialogService(null);
  const notificationService = new NotificationServiceMock();
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

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ScenesComponent, RawDataComponent],
      imports: [BrowserAnimationsModule, RouterTestingModule, MatBottomSheetModule, MatDialogModule, MatCardModule,
        MatMenuModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
        RouterModule.forRoot([{ path: '**', component: RawDataComponent }])],
      providers: [Location, MatBottomSheet,
        { provide: DBService, useValue: dbService },
        { provide: DialogService, useValue: dialogService },
        { provide: NotificationService, useValue: notificationService },
        { provide: RouteReuseStrategy, useValue: appRouteReuseStrategy },
      ]
    }).compileComponents();
    spyOn(appRouteReuseStrategy, 'clear');
    spyOn(notificationService, 'onSuccess');
    spyOn(notificationService, 'onError');
    isBackendInitializedSpy = spyOn(dbService, 'isBackendInitialized').and.returnValue(true);
    spyOn(dbService, 'initBackend').and.returnValue(Promise.resolve());
    getActiveSceneSpy = spyOn(dbService, 'getActiveScene').and.returnValue(scenes[0]);
    findSceneInfosSpy = spyOn(dbService, 'findSceneInfos').and.returnValue(Promise.resolve(scenes));
    spyOn(dbService, 'findScene').and.returnValue(Promise.resolve(scenes[0]));
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
    spyOn(component.router, 'navigateByUrl');

    // when
    component.ngOnInit();

    // then
    expect(component.router.navigateByUrl).toHaveBeenCalledWith(Route.FRONT);
  });

  it('home button should point to front component', () => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#butHome')).nativeElement;

    // when
    const link = htmlButton.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.FRONT);
  });

  it('"Add Scene" button should point to scene component', () => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#butScene')).nativeElement;

    // when
    const link = htmlButton.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.SCENE);
  });

  it('#onFilterChange should not filter scene infos when filter is null', () => {

    // when
    component.onFilterChange(null);

    // then
    expect(component.filteredSceneInfos.length).toBe(scenes.length);
  });

  it('#onFilterChange should filter scene infos when filter matches name', () => {

    // when
    component.onFilterChange('e 1');

    // then
    expect(component.filteredSceneInfos.length).toBe(1);
  });

  it('#onFilterChange should filter scene infos when filter matches short description', () => {

    // when
    component.onFilterChange('2 s');

    // then
    expect(component.filteredSceneInfos.length).toBe(1);
  });

  it('#click on "Delete all" button should not delete scenes when not confiremd by user', fakeAsync(() => {

    // given
    getActiveSceneSpy.and.returnValue(null);
    findSceneInfosSpy.and.returnValue(Promise.resolve([]));
    spyOnConfirmDialogAndPressNo();
    spyOn(dbService, 'deleteScene').and.returnValue(Promise.resolve(null));
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
    findSceneInfosSpy.and.returnValue(Promise.resolve([]));
    spyOnConfirmDialogAndPressYes();
    spyOn(dbService, 'deleteScene').and.returnValue(Promise.resolve(null));
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
    findSceneInfosSpy.and.returnValue(Promise.resolve(null));
    spyOn(component.router, 'navigateByUrl');
    spyOnConfirmDialogAndPressYes();
    spyOn(dbService, 'deleteScene').and.returnValue(Promise.resolve(null));
    const deleteButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_delete_scenes')).nativeElement;

    // when
    deleteButton.click();
    flush();

    // then
    expect(component.router.navigateByUrl).toHaveBeenCalledWith(Route.SCENE);
  }));

  it('#click on "Delete all" button should notify error when error occurs', fakeAsync(() => {

    // given
    spyOnConfirmDialogAndPressYes();
    spyOn(dbService, 'deleteScene').and.returnValue(Promise.reject('error'));
    const deleteButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_delete_scenes')).nativeElement;

    // when
    deleteButton.click();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledTimes(1);
  }));

  it('#click on "Delete filtered" button should delete filtered scenes', fakeAsync(() => {

    // given
    component.onFilterChange('1');
    spyOnConfirmDialogAndPressYes();
    spyOn(dbService, 'deleteScene').and.returnValue(Promise.resolve(null));
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
    spyOn(dbService, 'deleteScene').and.returnValue(Promise.resolve(null));
    getActiveSceneSpy.calls.reset();
    findSceneInfosSpy.calls.reset();
    component.onFilterChange('1');
    spyOnConfirmDialogAndPressYes();
    const deleteButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_delete_scenes')).nativeElement;

    // when
    deleteButton.click();
    flush();

    // then
    expect(dbService.getActiveScene).toHaveBeenCalledTimes(1);
    expect(dbService.findSceneInfos).toHaveBeenCalledTimes(1);
  }));

  it('#selecting "Details" menu item should show scene details', fakeAsync(() => {

    // given
    spyOn(dialogService, 'showSceneDetailsDialog');
    const moreButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.but_more'))[0].nativeElement;

    // when
    moreButton.click();
    fixture.detectChanges();
    const detailsButton: HTMLButtonElement = fixture.debugElement.query(By.css('.menu_item_details')).nativeElement;
    detailsButton.click();
    flush();

    // then
    expect(dialogService.showSceneDetailsDialog).toHaveBeenCalledWith(scenes[0]);
  }));

  it('#selecting delete menu item should delete scene', fakeAsync(() => {

    // given
    const scene = scenes[0];
    spyOn(dbService, 'deleteScene').and.returnValue(Promise.resolve(null));
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
    spyOn(dbService, 'deleteScene').and.returnValue(Promise.reject('cannot delete scene'));
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
    spyOn(dbService, 'activateScene').and.returnValue(Promise.resolve(scenes[1]));
    spyOn(component.router, 'navigateByUrl');
    const htmlButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.but_activate_scene'))[1].nativeElement;

    // when
    htmlButton.click();
    flush();

    // then
    expect(dbService.activateScene).toHaveBeenCalledWith(scenes[1]._id);
    expect(appRouteReuseStrategy.clear).toHaveBeenCalledTimes(1);
    expect(component.router.navigateByUrl).toHaveBeenCalledWith(Route.RAWDATA);
  }));

  it('#click on activate scene button should notify error when error occurs', fakeAsync(() => {

    // given
    spyOn(dbService, 'activateScene').and.returnValue(Promise.reject('cannot activate scene'));
    const htmlButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.but_activate_scene'))[1].nativeElement;

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
    spyOn(component.router, 'navigateByUrl');
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_continue')).nativeElement;

    // when
    htmlButton.click();

    // then
    expect(appRouteReuseStrategy.clear).toHaveBeenCalledTimes(0);
    expect(component.router.navigateByUrl).toHaveBeenCalledWith(Route.RAWDATA);
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
