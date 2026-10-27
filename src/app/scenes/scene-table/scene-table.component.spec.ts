import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { By } from '@angular/platform-browser';
import { Scene } from 'app/shared/model';
import { DialogService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { SceneTableComponent } from './scene-table.component';
import type { Mock } from 'vitest';

const dbService = new DBService(null, null);
const dialogService = new DialogService(null);
const notificationService = new NotificationServiceMock();

let fixture: ComponentFixture<SceneTableComponent>;
let component: SceneTableComponent;
let onActivateEmitSpy: Mock;
let onContinueEmitSpy: Mock;
let onDeleteEmitSpy: Mock;
let onEditEmitSpy: Mock;

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
    component.existingSceneNames = new Set(scenes.map(s => s.name));
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

  it('locked table should disable row actions', () => {

    // given
    component.locked = true;

    // when
    fixture.detectChanges();

    // then
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.but_more, .continueActiveScene, .activateScene'));
    expect(buttons.length).toBe(6);
    buttons.forEach(b => expect(b.disabled).toBe(true));
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
    expect(dialogService.showSceneDetailsDialog).toHaveBeenCalledWith(scenes[0], true);
  }));

  it('#selecting "Details" should notify error when scene cannot be read', fakeAsync(() => {

    // given
    vi.spyOn(dbService, 'findScene').mockRejectedValue('db error');
    vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);
    const moreButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.but_more'))[0].nativeElement;

    // when
    moreButton.click();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.menu_item_details')).nativeElement.click();
    flush();

    // then
    expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'db error');
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

  it('#selecting "Share as file" menu item should emit event', fakeAsync(() => {

    // given
    const onShareEmitSpy = vi.spyOn(component.onShare, 'emit').mockReturnValue(undefined);
    const moreButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.but_more'))[1].nativeElement;

    // when
    moreButton.click();
    fixture.detectChanges();
    const shareButton: HTMLButtonElement = fixture.debugElement.query(By.css('.menu_item_share')).nativeElement;
    shareButton.click();
    flush();

    // then
    expect(onShareEmitSpy).toHaveBeenCalledWith(scenes[1]);
  }));

  it('#selecting "Edit" menu item should show name and short description inputs of scene', fakeAsync(() => {

    // when
    startEditOf(1);

    // then
    expect(nameInput().value).toBe(scenes[1].name);
    expect(descriptionInput().value).toBe(scenes[1].shortDescription);
    expect(rows()[1].querySelector('.scene-name')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.edit_name').length).toBe(1);
  }));

  it('name input should limit input to max scene name length', fakeAsync(() => {

    // when
    startEditOf(1);

    // then
    expect(nameInput().maxLength).toBe(40);
  }));

  it('#click on save button should emit trimmed labels and end editing', fakeAsync(() => {

    // given
    startEditOf(1);
    typeInto(nameInput(), ' new name ');

    // when
    saveButton().click();
    fixture.detectChanges();

    // then
    expect(onEditEmitSpy).toHaveBeenCalledWith({ _id: '2', name: 'new name', shortDescription: scenes[1].shortDescription });
    expect(fixture.nativeElement.querySelector('.edit_name')).toBeNull();
  }));

  it('save button should be disabled when nothing changed', fakeAsync(() => {

    // when
    startEditOf(1);

    // then
    expect(saveButton().disabled).toBe(true);
  }));

  it('enter in short description input should save changes', fakeAsync(() => {

    // given
    startEditOf(1);
    typeInto(descriptionInput(), ' new desc ');

    // when
    pressKey(descriptionInput(), 'Enter');

    // then
    expect(onEditEmitSpy).toHaveBeenCalledWith({ _id: '2', name: scenes[1].name, shortDescription: 'new desc' });
    expect(fixture.nativeElement.querySelector('.edit_name')).toBeNull();
  }));

  it('enter should not emit when changes are not savable', fakeAsync(() => {

    // given
    startEditOf(1);
    typeInto(nameInput(), '');

    // when
    pressKey(nameInput(), 'Enter');

    // then
    expect(onEditEmitSpy).not.toHaveBeenCalled();
    expect(nameInput()).not.toBeNull();
  }));

  it('escape should end editing without emitting', fakeAsync(() => {

    // given
    startEditOf(1);
    typeInto(nameInput(), 'x');

    // when
    pressKey(nameInput(), 'Escape');

    // then
    expect(onEditEmitSpy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.edit_name')).toBeNull();
  }));

  it('#click on cancel button should end editing without emitting', fakeAsync(() => {

    // given
    startEditOf(1);
    typeInto(nameInput(), 'x');

    // when
    fixture.nativeElement.querySelector('.but_cancel_edit').click();
    fixture.detectChanges();

    // then
    expect(onEditEmitSpy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.edit_name')).toBeNull();
  }));

  it('active chip should be hidden while active scene is edited', fakeAsync(() => {

    // when
    startEditOf(0);

    // then
    expect(rows()[0].querySelector('.edit_name')).not.toBeNull();
    expect(rows()[0].querySelector('.active-chip')).toBeNull();
  }));

  it('should show name exists error when name of other scene is entered', fakeAsync(() => {

    // given
    startEditOf(1);

    // when
    typeInto(nameInput(), scenes[2].name);

    // then
    expect(fixture.nativeElement.querySelector('.edit_name mat-error').textContent).toBe('Scene name already exists');
    expect(saveButton().disabled).toBe(true);
  }));

  it('should show too long error when changed name exceeds max length', fakeAsync(() => {

    // given
    startEditOf(1);

    // when
    component.edit.name = 'y'.repeat(41);
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelector('.edit_name mat-error').textContent).toBe('Name must not exceed 40 characters');
  }));

  it('editing should disable more, activate and continue buttons of all rows', fakeAsync(() => {

    // when
    startEditOf(1);

    // then
    expect(actionButtons().length).toBe(6);
    expect(actionButtons().every(b => b.disabled)).toBe(true);
  }));

  it('save should enable buttons again and show active chip', fakeAsync(() => {

    // given
    startEditOf(0);
    typeInto(nameInput(), 'new name');

    // when
    saveButton().click();
    fixture.detectChanges();

    // then
    expect(actionButtons().every(b => !b.disabled)).toBe(true);
    expect(rows()[0].querySelector('.active-chip')).not.toBeNull();
  }));

  it('cancel should enable buttons again', fakeAsync(() => {

    // given
    startEditOf(1);

    // when
    fixture.nativeElement.querySelector('.but_cancel_edit').click();
    fixture.detectChanges();

    // then
    expect(actionButtons().every(b => !b.disabled)).toBe(true);
  }));

  it('#editingChange should emit true on start and false on save and cancel', fakeAsync(() => {

    // given
    const editingChangeEmitSpy = vi.spyOn(component.editingChange, 'emit');

    // when
    startEditOf(1);
    typeInto(nameInput(), '');
    pressKey(nameInput(), 'Enter');

    // then
    expect(editingChangeEmitSpy).toHaveBeenNthCalledWith(1, true);
    expect(editingChangeEmitSpy).toHaveBeenCalledTimes(1);

    // when
    typeInto(nameInput(), 'new name');
    saveButton().click();
    fixture.detectChanges();
    startEditOf(2);
    pressKey(nameInput(), 'Escape');

    // then
    expect(editingChangeEmitSpy.mock.calls).toEqual([[true], [false], [true], [false]]);
  }));

  function startEditOf(rowIndex: number): void {
    rows()[rowIndex].querySelector<HTMLButtonElement>('.but_more').click();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.menu_item_edit')).nativeElement.click();
    fixture.detectChanges();
    flush();
    fixture.detectChanges();
  }

  function typeInto(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function pressKey(input: HTMLInputElement, key: string): void {
    input.dispatchEvent(new KeyboardEvent('keydown', { key }));
    fixture.detectChanges();
  }

  function nameInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('.edit_name input');
  }

  function descriptionInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('.edit_desc input');
  }

  function saveButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.but_save_edit');
  }

  function actionButtons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.but_more, .activateScene, .continueActiveScene'));
  }

  function rows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));
  }
});

async function setup(): Promise<void> {
  await TestBed.configureTestingModule({
    declarations: [SceneTableComponent],
    imports: [MatBottomSheetModule, MatDialogModule, MatMenuModule, MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule,
      FormsModule, MatInputModule],
    providers: [Location,
      { provide: DBService, useValue: dbService },
      { provide: DialogService, useValue: dialogService },
      { provide: NotificationService, useValue: notificationService }
    ]
  }).compileComponents();

  fixture = TestBed.createComponent(SceneTableComponent);
  component = fixture.componentInstance;
  onActivateEmitSpy = vi.spyOn(component.onActivate, 'emit').mockReturnValue(undefined);
  onContinueEmitSpy = vi.spyOn(component.onContinue, 'emit').mockReturnValue(undefined);
  onDeleteEmitSpy = vi.spyOn(component.onDelete, 'emit').mockReturnValue(undefined);
  onEditEmitSpy = vi.spyOn(component.onEdit, 'emit').mockReturnValue(undefined);
}
