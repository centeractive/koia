import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Scene } from 'app/shared/model';
import { DialogService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { SceneFactory } from 'app/shared/test';
import { SceneTableComponent } from './scene-table.component';

const dbService = new DBService(null);
const dialogService = new DialogService(null);

let fixture: ComponentFixture<SceneTableComponent>;
let component: SceneTableComponent;
let onActivateEmitSpy: jasmine.Spy;
let onDeleteEmitSpy: jasmine.Spy;

describe('SceneTableComponent (all scenes)', () => {

  let scenes: Scene[];

  beforeAll(() => {
    const scene1 = SceneFactory.createScene('1', []);
    const scene2 = SceneFactory.createScene('2', []);
    const scene3 = SceneFactory.createScene('3', []);
    scenes = [scene1, scene2, scene3];
  });

  beforeEach(async () => {
    await setup();
    spyOn(dbService, 'findScene').and.resolveTo(scenes[0]);
    component.sceneInfos = scenes;
    component.ngOnChanges(null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.tableData.length).toBe(3);
  });

  it('#click on activate button should emit event', () => {

    // given
    const activateButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.activateScene'))[1].nativeElement;

    // when
    activateButton.click();

    // then
    expect(onActivateEmitSpy).toHaveBeenCalledWith(scenes[1]);
  });

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

  it('#selecting "Delete" menu item should emit event', fakeAsync(() => {

    // given
    const moreButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.but_more'))[2].nativeElement;

    // when
    moreButton.click();
    fixture.detectChanges();
    const detailsButton: HTMLButtonElement = fixture.debugElement.query(By.css('.menu_item_delete')).nativeElement;
    detailsButton.click();
    flush();

    // then
    expect(onDeleteEmitSpy).toHaveBeenCalledWith(scenes[2]);
  }));
});

describe('SceneTableComponent (active scene)', () => {

  let activeScene: Scene;

  beforeEach(async () => {
    await setup();
    activeScene = SceneFactory.createScene('1', []);
    component.activeScene = activeScene;
    component.ngOnChanges(null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.tableData.length).toBe(1);
  });

  it('#click on continue button should emit event', () => {

    // given
    const continueButton: HTMLButtonElement = fixture.debugElement.query(By.css('.continueActiveScene')).nativeElement;

    // when
    continueButton.click();

    // then
    expect(onActivateEmitSpy).toHaveBeenCalledWith(activeScene);
  });

});

async function setup(): Promise<void> {
  await TestBed.configureTestingModule({
    declarations: [SceneTableComponent],
    imports: [BrowserAnimationsModule, MatDialogModule, MatMenuModule, MatButtonModule, MatIconModule, MatTableModule],
    providers: [Location,
      { provide: DBService, useValue: dbService },
      { provide: DialogService, useValue: dialogService }
    ]
  }).compileComponents();

  fixture = TestBed.createComponent(SceneTableComponent);
  component = fixture.componentInstance;
  onActivateEmitSpy = spyOn(component.onActivate, 'emit');
  onDeleteEmitSpy = spyOn(component.onDelete, 'emit');
}
