import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Status, StatusType } from 'app/shared/model';
import { SceneFileService } from 'app/shared/scene-file/scene-file.service';
import { NotificationService } from 'app/shared/services';
import { SavedViewsService } from 'app/shared/services/saved-views';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { SaveViewMenuComponent } from './save-view-menu.component';

describe('SaveViewMenuComponent', () => {

  const STATUS: Status = { type: StatusType.SUCCESS, msg: 'done' };

  let ready: boolean;
  let savedViewsService: SavedViewsService;
  let sceneFileService: SceneFileService;
  let notificationService: NotificationServiceMock;
  let fixture: ComponentFixture<SaveViewMenuComponent>;

  beforeEach(() => {
    ready = true;
    savedViewsService = {
      get ready() { return ready; },
      save: vi.fn().mockResolvedValue(STATUS)
    } as unknown as SavedViewsService;
    sceneFileService = { export: vi.fn().mockResolvedValue(undefined) } as unknown as SceneFileService;
    notificationService = new NotificationServiceMock();
    vi.spyOn(notificationService, 'showStatus').mockReturnValue(undefined);
    TestBed.configureTestingModule({
      declarations: [SaveViewMenuComponent],
      imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, MatBottomSheetModule],
      providers: [
        { provide: SavedViewsService, useValue: savedViewsService },
        { provide: SceneFileService, useValue: sceneFileService },
        { provide: NotificationService, useValue: notificationService }
      ]
    });
    fixture = TestBed.createComponent(SaveViewMenuComponent);
    fixture.componentRef.setInput('sceneId', 's1');
    fixture.componentRef.setInput('activeTabId', 'tab2');
  });

  function saveButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('#but_save_view');
  }

  function menuItem(id: string): HTMLButtonElement {
    return document.querySelector(id);
  }

  function openSaveMenu(): void {
    fixture.detectChanges();
    saveButton().click();
    fixture.detectChanges();
    flush();
  }

  it('save button should show save icon and Save view label', () => {

    // when
    fixture.detectChanges();

    // then
    expect(saveButton().querySelector('mat-icon').textContent.trim()).toBe('save');
    expect(saveButton().getAttribute('aria-label')).toBe('Save view');
    expect(saveButton().disabled).toBe(false);
  });

  it('save menu should offer share as file and save all tabs as view with their icons', fakeAsync(() => {

    // when
    openSaveMenu();

    // then
    const items = Array.from(document.querySelectorAll<HTMLElement>('.mat-mdc-menu-panel [mat-menu-item]'));
    expect(items.map(i => i.id)).toEqual(['menuItemShareScene', 'menuItemSaveView']);
    expect(items.map(i => i.querySelector('mat-icon').textContent.trim())).toEqual(['save', 'save_alt']);
    expect(items.map(i => i.querySelector('span').textContent.trim())).toEqual(['Share as file', 'Save all tabs as view']);
  }));

  it('save all tabs as view menu item should be disabled while tabs are not ready', fakeAsync(() => {

    // given
    ready = false;

    // when
    openSaveMenu();

    // then
    expect(menuItem('#menuItemSaveView').disabled).toBe(true);
  }));

  it('share as file menu item should be enabled while tabs are not ready', fakeAsync(() => {

    // given
    ready = false;

    // when
    openSaveMenu();

    // then
    expect(menuItem('#menuItemShareScene').disabled).toBe(false);
  }));

  it('#click on share as file should export scene', fakeAsync(() => {

    // given
    openSaveMenu();

    // when
    menuItem('#menuItemShareScene').click();

    // then
    expect(sceneFileService.export).toHaveBeenCalledWith('s1');
  }));

  it('#click on share as file should notify error when export fails', fakeAsync(() => {

    // given
    vi.mocked(sceneFileService.export).mockRejectedValue('disk full');
    const onErrorSpy = vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);
    openSaveMenu();

    // when
    menuItem('#menuItemShareScene').click();
    flush();

    // then
    expect(onErrorSpy.mock.calls[0][1]).toBe('disk full');
  }));

  it('#click on save all tabs as view should save view with active tab and show status', fakeAsync(() => {

    // given
    openSaveMenu();

    // when
    menuItem('#menuItemSaveView').click();
    flush();

    // then
    expect(savedViewsService.save).toHaveBeenCalledWith('tab2');
    expect(notificationService.showStatus).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), STATUS);
  }));

  it('#click on save all tabs as view should not show status when saving was canceled', fakeAsync(() => {

    // given
    vi.mocked(savedViewsService.save).mockResolvedValue(undefined);
    openSaveMenu();

    // when
    menuItem('#menuItemSaveView').click();
    flush();

    // then
    expect(notificationService.showStatus).not.toHaveBeenCalled();
  }));

  it('host should lay out button in a row', () => {

    // when
    fixture.detectChanges();

    // then
    const style = getComputedStyle(fixture.nativeElement);
    expect(style.display).toBe('flex');
    expect(style.alignItems).toBe('center');
    expect(style.flexShrink).toBe('0');
  });
});
