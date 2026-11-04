import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { Status, StatusType } from 'app/shared/model';
import { SavedView } from 'app/shared/model/view-config';
import { SceneFileService } from 'app/shared/scene-file/scene-file.service';
import { NotificationService } from 'app/shared/services';
import { SavedViewsService } from 'app/shared/services/saved-views';
import { createDefaultRawDataState } from 'app/shared/services/view-persistence/raw-data-state-factory';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { RestoreViewMenuComponent } from './restore-view-menu.component';

describe('RestoreViewMenuComponent', () => {

  const STATUS: Status = { type: StatusType.SUCCESS, msg: 'done' };

  let ready: boolean;
  let savedViews: SavedView[];
  let savedViewsService: SavedViewsService;
  let notificationService: NotificationServiceMock;
  let component: RestoreViewMenuComponent;
  let fixture: ComponentFixture<RestoreViewMenuComponent>;

  beforeEach(() => {
    ready = true;
    savedViews = [];
    savedViewsService = {
      get ready() { return ready; },
      findAll: () => savedViews,
      restore: vi.fn(),
      manage: vi.fn()
    } as unknown as SavedViewsService;
    notificationService = new NotificationServiceMock();
    vi.spyOn(notificationService, 'showStatus').mockReturnValue(undefined);
    TestBed.configureTestingModule({
      declarations: [RestoreViewMenuComponent],
      imports: [MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule, MatTooltipModule, MatBottomSheetModule, MatDividerModule,
        RouterModule.forRoot([])],
      providers: [
        { provide: SavedViewsService, useValue: savedViewsService },
        { provide: SceneFileService, useValue: {} },
        { provide: NotificationService, useValue: notificationService }
      ]
    });
    fixture = TestBed.createComponent(RestoreViewMenuComponent);
    component = fixture.componentInstance;
  });

  function restoreButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('#but_restore_view');
  }

  function icon(): HTMLElement {
    return restoreButton().querySelector('mat-icon');
  }

  function menuPanel(): HTMLElement {
    return document.querySelector('.mat-mdc-menu-panel');
  }

  function clickRestoreButton(): void {
    restoreButton().click();
    fixture.detectChanges();
    flush();
  }

  function openRestoreMenu(): void {
    fixture.detectChanges();
    clickRestoreButton();
  }

  function importing(cancelable: boolean): void {
    component.sceneFileOpener.importing = true;
    vi.spyOn(component.sceneFileOpener, 'cancelable', 'get').mockReturnValue(cancelable);
    fixture.detectChanges();
  }

  function view(name: string, modifiedTime: number): SavedView {
    return { name, modifiedTime, tabs: [], rawData: createDefaultRawDataState() };
  }

  it('restore button should show restore icon and Restore view label without saved views', () => {

    // when
    fixture.detectChanges();

    // then
    expect(icon().textContent.startsWith('open_in_browser')).toBe(true);
    expect(icon().classList).toContain('mat-badge-hidden');
    expect(icon().classList).not.toContain('koia-spin');
    expect(restoreButton().getAttribute('aria-busy')).toBe('false');
    expect(restoreButton().getAttribute('aria-label')).toBe('Restore view');
    expect(restoreButton().disabled).toBe(false);
  });

  it('restore button should show number of saved views as badge', () => {

    // given
    savedViews = [view('a', 1), view('b', 2)];

    // when
    fixture.detectChanges();

    // then
    expect(restoreButton().querySelector('.mat-badge-content').textContent).toBe('2');
    expect(icon().classList).not.toContain('mat-badge-hidden');
  });

  it('restore menu should only offer open a shared scene when no views are saved', fakeAsync(() => {

    // when
    openRestoreMenu();

    // then
    const items = Array.from(menuPanel().querySelectorAll<HTMLElement>('[mat-menu-item]'));
    expect(items.map(i => i.id)).toEqual(['menuItemOpenSceneFile']);
    expect(items[0].querySelector('mat-icon').textContent.trim()).toBe('folder_open');
    expect(items[0].textContent).toContain('Open a shared scene');
    expect(menuPanel().querySelector('mat-divider')).toBeNull();
  }));

  it('restore menu should list saved views with name and modified time below open a shared scene', fakeAsync(() => {

    // given
    savedViews = [view('a', 1), view('b', 2)];

    // when
    openRestoreMenu();

    // then
    const children = Array.from(menuPanel().querySelector('.mat-mdc-menu-content').children);
    expect(children.map(c => c.id || c.tagName)).toEqual(['menuItemOpenSceneFile', 'MAT-DIVIDER', 'BUTTON', 'BUTTON', 'menuItemManageViews']);
    const items = Array.from(document.querySelectorAll<HTMLElement>('.menu_item_details'));
    expect(items).toEqual([children[2], children[3]]);
    expect(items.map(i => i.querySelector('var').parentElement.firstChild.textContent.trim())).toEqual(['a', 'b']);
    expect(items.every(i => !!i.querySelector('var').textContent)).toBe(true);
    expect(items.map(i => i.querySelector('mat-icon').textContent.trim())).toEqual(['monitor', 'monitor']);
    expect(document.querySelector('#menuItemManageViews').textContent).toContain('Manage Views');
  }));

  it('saved view and manage menu items should be disabled while tabs are not ready', fakeAsync(() => {

    // given
    ready = false;
    savedViews = [view('a', 1)];

    // when
    openRestoreMenu();

    // then
    expect(document.querySelector<HTMLButtonElement>('.menu_item_details').disabled).toBe(true);
    expect(document.querySelector<HTMLButtonElement>('#menuItemManageViews').disabled).toBe(true);
    expect(document.querySelector<HTMLButtonElement>('#menuItemOpenSceneFile').disabled).toBe(false);
  }));

  it('selecting saved view should restore it', fakeAsync(() => {

    // given
    savedViews = [view('a', 1), view('b', 2)];
    openRestoreMenu();

    // when
    document.querySelectorAll<HTMLButtonElement>('.menu_item_details')[1].click();

    // then
    expect(savedViewsService.restore).toHaveBeenCalledWith(savedViews[1]);
  }));

  it('selecting Manage Views should open manage dialog and show status of update', fakeAsync(() => {

    // given
    savedViews = [view('a', 1)];
    openRestoreMenu();

    // when
    document.querySelector<HTMLButtonElement>('#menuItemManageViews').click();
    const onUpdated: (status: Status) => void = vi.mocked(savedViewsService.manage).mock.lastCall[0];
    onUpdated(STATUS);

    // then
    expect(notificationService.showStatus).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), STATUS);
  }));

  it('selecting open a shared scene should select file', fakeAsync(() => {

    // given
    const selectSpy = vi.spyOn(component.sceneFileOpener, 'select').mockReturnValue(undefined);
    openRestoreMenu();

    // when
    document.querySelector<HTMLButtonElement>('#menuItemOpenSceneFile').click();

    // then
    expect(selectSpy).toHaveBeenCalledWith(fixture.nativeElement.querySelector('#toolbarSceneFileInput'));
  }));

  it('#change of scene file input should open selected file', () => {

    // given
    const openSpy = vi.spyOn(component.sceneFileOpener, 'open').mockReturnValue(undefined);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#toolbarSceneFileInput');

    // when
    input.dispatchEvent(new Event('change'));

    // then
    expect(openSpy).toHaveBeenCalledWith(input);
  });

  it('restore button should spin and offer cancel while import is cancelable', () => {

    // given
    savedViews = [view('a', 1)];

    // when
    importing(true);

    // then
    expect(icon().textContent.startsWith('autorenew')).toBe(true);
    expect(icon().classList).toContain('koia-spin');
    expect(icon().classList).toContain('mat-badge-hidden');
    expect(restoreButton().getAttribute('aria-busy')).toBe('true');
    expect(restoreButton().getAttribute('aria-label')).toBe('Cancel');
  });

  it('restore button should show opening label once import is canceled', () => {

    // when
    importing(false);

    // then
    expect(restoreButton().getAttribute('aria-label')).toBe('Opening shared scene…');
  });

  it('#click on restore button should cancel running import without opening menu', fakeAsync(() => {

    // given
    const cancelSpy = vi.spyOn(component.sceneFileOpener, 'cancel').mockReturnValue(undefined);
    importing(true);

    // when
    clickRestoreButton();

    // then
    expect(cancelSpy).toHaveBeenCalled();
    expect(menuPanel()).toBeNull();
  }));

  it('#click on restore button should not cancel when import is no longer cancelable', fakeAsync(() => {

    // given
    const cancelSpy = vi.spyOn(component.sceneFileOpener, 'cancel').mockReturnValue(undefined);
    importing(false);

    // when
    clickRestoreButton();

    // then
    expect(cancelSpy).not.toHaveBeenCalled();
    expect(menuPanel()).toBeNull();
  }));

  it('#click on restore button should open menu without canceling when no import runs', fakeAsync(() => {

    // given
    const cancelSpy = vi.spyOn(component.sceneFileOpener, 'cancel').mockReturnValue(undefined);
    fixture.detectChanges();

    // when
    clickRestoreButton();

    // then
    expect(cancelSpy).not.toHaveBeenCalled();
    expect(menuPanel()).toBeTruthy();
  }));

  it('#ngOnDestroy should destroy scene file opener', () => {

    // given
    const destroySpy = vi.spyOn(component.sceneFileOpener, 'destroy');

    // when
    component.ngOnDestroy();

    // then
    expect(destroySpy).toHaveBeenCalled();
  });

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
