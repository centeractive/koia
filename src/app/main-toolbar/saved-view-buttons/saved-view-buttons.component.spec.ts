import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Status, StatusType } from 'app/shared/model';
import { SavedView } from 'app/shared/model/view-config';
import { NotificationService } from 'app/shared/services';
import { SavedViewsService } from 'app/shared/services/saved-views';
import { createDefaultRawDataState } from 'app/shared/services/view-persistence/raw-data-state-factory';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { SavedViewButtonsComponent } from './saved-view-buttons.component';

describe('SavedViewButtonsComponent', () => {

  const STATUS: Status = { type: StatusType.SUCCESS, msg: 'done' };

  let ready: boolean;
  let savedViews: SavedView[];
  let savedViewsService: SavedViewsService;
  let notificationService: NotificationServiceMock;
  let fixture: ComponentFixture<SavedViewButtonsComponent>;

  beforeEach(() => {
    ready = true;
    savedViews = [];
    savedViewsService = {
      get ready() { return ready; },
      findAll: () => savedViews,
      save: vi.fn().mockResolvedValue(STATUS),
      restore: vi.fn(),
      manage: vi.fn()
    } as unknown as SavedViewsService;
    notificationService = new NotificationServiceMock();
    vi.spyOn(notificationService, 'showStatus').mockReturnValue(undefined);
    TestBed.configureTestingModule({
      declarations: [SavedViewButtonsComponent],
      imports: [MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule, MatTooltipModule, MatBottomSheetModule],
      providers: [
        { provide: SavedViewsService, useValue: savedViewsService },
        { provide: NotificationService, useValue: notificationService }
      ]
    });
    fixture = TestBed.createComponent(SavedViewButtonsComponent);
  });

  function button(selector: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(selector);
  }

  function openRestoreMenu(): void {
    fixture.detectChanges();
    button('#but_restore_view').click();
    fixture.detectChanges();
    flush();
  }

  function view(name: string, modifiedTime: number): SavedView {
    return { name, modifiedTime, tabs: [], rawData: createDefaultRawDataState() };
  }

  it('save and restore buttons should be disabled while tabs are not ready', () => {

    // given
    ready = false;
    savedViews = [view('a', 1)];

    // when
    fixture.detectChanges();

    // then
    expect(button('#but_save_view').disabled).toBe(true);
    expect(button('#but_restore_view').disabled).toBe(true);
  });

  it('restore button should be disabled when no views are saved', () => {

    // when
    fixture.detectChanges();

    // then
    expect(button('#but_save_view').disabled).toBe(false);
    expect(button('#but_restore_view').disabled).toBe(true);
  });

  it('should show number of saved views as badge', () => {

    // given
    savedViews = [view('a', 1), view('b', 2)];

    // when
    fixture.detectChanges();

    // then
    expect(fixture.nativeElement.querySelector('#but_restore_view .mat-badge-content').textContent).toBe('2');
    expect(button('#but_restore_view').disabled).toBe(false);
  });

  it('restore menu should list saved views with name and modified time', fakeAsync(() => {

    // given
    savedViews = [view('a', 1), view('b', 2)];

    // when
    openRestoreMenu();

    // then
    const items = Array.from(document.querySelectorAll<HTMLElement>('.menu_item_details'));
    expect(items.map(i => i.querySelector('var').parentElement.firstChild.textContent.trim())).toEqual(['a', 'b']);
    expect(items.every(i => !!i.querySelector('var').textContent)).toBe(true);
    expect(document.querySelector('#menuItemManageViews').textContent).toContain('Manage Views');
  }));

  it('#click on save button should save view with active tab and show status', fakeAsync(() => {

    // given
    fixture.componentRef.setInput('activeTabId', 'tab2');
    fixture.detectChanges();

    // when
    button('#but_save_view').click();
    flush();

    // then
    expect(savedViewsService.save).toHaveBeenCalledWith('tab2');
    expect(notificationService.showStatus).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), STATUS);
  }));

  it('#click on save button should not show status when saving was canceled', fakeAsync(() => {

    // given
    vi.mocked(savedViewsService.save).mockResolvedValue(undefined);
    fixture.detectChanges();

    // when
    button('#but_save_view').click();
    flush();

    // then
    expect(notificationService.showStatus).not.toHaveBeenCalled();
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

  it('host should lay out buttons in a row', () => {

    // when
    fixture.detectChanges();

    // then
    const style = getComputedStyle(fixture.nativeElement);
    expect(style.display).toBe('flex');
    expect(style.alignItems).toBe('center');
    expect(style.flexShrink).toBe('0');
    expect(button('#but_restore_view').getBoundingClientRect().top).toBe(button('#but_save_view').getBoundingClientRect().top);
  });
});
