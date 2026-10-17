import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { By } from '@angular/platform-browser';
import { Scene } from 'app/shared/model';
import { DialogService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { SceneFactory } from 'app/shared/test';
import { SceneTableComponent } from './scene-table.component';
import type { Mock } from 'vitest';

const dbService = new DBService(null);
const dialogService = new DialogService(null);

let fixture: ComponentFixture<SceneTableComponent>;
let component: SceneTableComponent;
let onActivateEmitSpy: Mock;
let onContinueEmitSpy: Mock;
let onDeleteEmitSpy: Mock;

describe('SceneTableComponent', () => {

  let scenes: Scene[];

  beforeAll(() => {
    const scene1 = SceneFactory.createScene('1', []);
    const scene2 = SceneFactory.createScene('2', []);
    const scene3 = SceneFactory.createScene('3', []);
    scenes = [scene1, scene2, scene3];
  });

  beforeEach(async () => {
    await setup();
    vi.spyOn(dbService, 'findScene').mockResolvedValue(scenes[0]);
    component.sceneInfos = scenes;
    component.activeScene = scenes[0];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(rows().length).toBe(3);
  });

  it('should mark active scene row', () => {

    // when
    const row = rows()[0];

    // then
    expect(row.classList).toContain('active-scene');
    expect(row.querySelector('.active-chip').textContent).toBe('Active');
    expect(getComputedStyle(row.querySelector('.scene-name')).fontWeight).toBe('600');
  });

  it('should not mark other scene rows', () => {

    // when
    const otherRows = rows().slice(1);

    // then
    otherRows.forEach(r => {
      expect(r.classList).not.toContain('active-scene');
      expect(r.querySelector('.active-chip')).toBeNull();
    });
  });

  it('should mark no row when no scene is active', () => {

    // given
    component.activeScene = undefined;

    // when
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelectorAll('tr.active-scene').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.continueActiveScene').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.activateScene').length).toBe(3);
  });

  it('active scene row should have green tint and left bar', () => {

    // when
    const cells: HTMLElement[] = Array.from(rows()[0].querySelectorAll('td'));

    // then
    cells.forEach(c => expect(getComputedStyle(c).backgroundColor).toBe('rgba(56, 142, 60, 0.12)'));
    expect(getComputedStyle(cells[0]).boxShadow).toContain('rgb(56, 142, 60)');
    expect(getComputedStyle(cells[1]).boxShadow).toBe('none');
  });

  it('active chip should be green pill', () => {

    // when
    const style = getComputedStyle(rows()[0].querySelector('.active-chip'));

    // then
    expect(style.backgroundColor).toBe('rgb(56, 142, 60)');
    expect(style.color).toBe('rgb(255, 255, 255)');
    expect(style.borderRadius).toBe('10px');
  });

  it('#click on continue button should emit continue event', () => {

    // given
    const continueButtons: HTMLButtonElement[] = Array.from(rows()[0].querySelectorAll('.continueActiveScene'));

    // when
    continueButtons[0].click();

    // then
    expect(continueButtons.length).toBe(1);
    expect(rows()[0].querySelector('.activateScene')).toBeNull();
    expect(onContinueEmitSpy).toHaveBeenCalledWith(scenes[0]);
    expect(onActivateEmitSpy).not.toHaveBeenCalled();
  });

  it('#click on activate button should emit activate event', () => {

    // given
    const activateButton: HTMLButtonElement = rows()[1].querySelector('.activateScene');

    // when
    activateButton.click();

    // then
    expect(rows()[1].querySelector('.continueActiveScene')).toBeNull();
    expect(onActivateEmitSpy).toHaveBeenCalledWith(scenes[1]);
    expect(onContinueEmitSpy).not.toHaveBeenCalled();
  });

  it('#selecting "Details" menu item should show scene details', fakeAsync(() => {

    // given
    vi.spyOn(dialogService, 'showSceneDetailsDialog').mockReturnValue(undefined);
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

  function rows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));
  }
});

async function setup(): Promise<void> {
  await TestBed.configureTestingModule({
    declarations: [SceneTableComponent],
    imports: [MatDialogModule, MatMenuModule, MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule],
    providers: [Location,
      { provide: DBService, useValue: dbService },
      { provide: DialogService, useValue: dialogService }
    ]
  }).compileComponents();

  fixture = TestBed.createComponent(SceneTableComponent);
  component = fixture.componentInstance;
  onActivateEmitSpy = vi.spyOn(component.onActivate, 'emit').mockReturnValue(undefined);
  onContinueEmitSpy = vi.spyOn(component.onContinue, 'emit').mockReturnValue(undefined);
  onDeleteEmitSpy = vi.spyOn(component.onDelete, 'emit').mockReturnValue(undefined);
}
