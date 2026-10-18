import { ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { InputDialogData } from 'app/shared/component/input-dialog/input-dialog.component';
import { Route } from 'app/shared/model';
import { TabDef, View, ViewType } from 'app/shared/model/view-config';
import { DialogService } from 'app/shared/services';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { MatIconModuleMock } from 'app/shared/test';
import { of } from 'rxjs';
import { page, userEvent } from 'vitest/browser';
import { ViewTabBarComponent } from './view-tab-bar.component';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
class DummyComponent { }

describe('ViewTabBarComponent', () => {

  let pivotTab: TabDef;
  let dashboardTab: TabDef;
  let viewTabsService: ViewTabsService;
  let dialogService: DialogService;
  let fixture: ComponentFixture<ViewTabBarComponent>;
  let component: ViewTabBarComponent;

  beforeEach(() => {
    pivotTab = { id: 'tab1', type: ViewType.PIVOT, title: 'Pivot Table 1' };
    dashboardTab = { id: 'tab2', type: ViewType.DASHBOARD, title: 'Dashboard 2' };
    viewTabsService = {
      tabs: [pivotTab, dashboardTab],
      ready: true,
      layoutOf: vi.fn().mockReturnValue(undefined),
      currentTab: vi.fn().mockImplementation((tab: TabDef) => tab),
      addTab: vi.fn().mockResolvedValue(true),
      renameTab: vi.fn(),
      closeTab: vi.fn().mockResolvedValue(undefined)
    } as unknown as ViewTabsService;
    dialogService = { showInputDialog: vi.fn(), showConfirmDialog: vi.fn() } as unknown as DialogService;
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [ViewTabBarComponent, DummyComponent],
      imports: [MatTabsModule, MatMenuModule, MatButtonModule, MatIconModule, MatTooltipModule,
        RouterModule.forRoot([{ path: '**', component: DummyComponent }])],
      providers: [
        { provide: ViewTabsService, useValue: viewTabsService },
        { provide: DialogService, useValue: dialogService }
      ]
    })
      .overrideModule(MatIconModule, MatIconModuleMock.override());
    fixture = TestBed.createComponent(ViewTabBarComponent);
    component = fixture.componentInstance;
    component.currUrl = '/view/tab2';
    fixture.detectChanges();
  });

  function element(selector: string): HTMLElement {
    return fixture.debugElement.query(By.css(selector))?.nativeElement;
  }

  function dialogRef(): MatDialogRef<unknown> {
    return { afterClosed: () => of(true) } as MatDialogRef<unknown>;
  }

  it('raw data tab should point to raw data view', () => {

    // when
    const link = element('#tabRawData').getAttribute('href');

    // then
    expect(link).toBe('/' + Route.RAWDATA);
  });

  it('should show link for each tab', () => {

    // when
    const pivotLink = element('#tab-tab1');
    const dashboardLink = element('#tab-tab2');

    // then
    expect(pivotLink.getAttribute('href')).toBe('/view/tab1');
    expect(pivotLink.textContent).toContain('Pivot Table 1');
    expect(dashboardLink.getAttribute('href')).toBe('/view/tab2');
    expect(dashboardLink.textContent).toContain('Dashboard 2');
  });

  it('should mark tab of current url as active', () => {

    // when
    const activeLinks = fixture.debugElement.queryAll(By.css('.mdc-tab--active'));

    // then
    expect(activeLinks.map(l => l.nativeElement.id)).toEqual(['tab-tab2']);
  });

  it('active tab should be marked by rounded primary underline', () => {

    // when
    const underline = element('#tab-tab2 .mdc-tab-indicator__content--underline');

    // then
    const style = getComputedStyle(underline);
    expect(element('#tab-tab2').classList).toContain('mdc-tab-indicator--active');
    expect(style.borderTopWidth).toBe('3px');
    expect(style.borderTopColor).toBe('rgb(48, 63, 159)');
    expect(style.borderTopLeftRadius).toBe('3px');
    expect(style.borderBottomLeftRadius).toBe('0px');
    expect(style.opacity).toBe('1');
  });

  it('inactive tab should not show underline', () => {

    // when
    const underline = element('#tab-tab1 .mdc-tab-indicator__content--underline');

    // then
    expect(getComputedStyle(underline).opacity).toBe('0');
  });

  it('tab titles should not be padded by non-breaking spaces', () => {

    // when
    const label = element('#tab-tab1 .tab_label');

    // then
    expect(element('#tabRawData').textContent).not.toContain('\u00A0');
    expect(element('#tab-tab1').textContent).not.toContain('\u00A0');
    expect(getComputedStyle(label).columnGap).toBe('6px');
  });

  it('close icon should be visible on active tab only', () => {

    // when
    const activeCloseIcon = element('#tab-tab2 .icon_close_tab');
    const inactiveCloseIcon = element('#tab-tab1 .icon_close_tab');

    // then
    expect(getComputedStyle(activeCloseIcon).visibility).toBe('visible');
    expect(getComputedStyle(inactiveCloseIcon).visibility).toBe('hidden');
  });

  describe('hovering', () => {

    beforeAll(() => page.viewport(1280, 800));

    afterAll(() => page.viewport(414, 896));

    afterEach(() => userEvent.unhover(element('#tab-tab1')));

    it('hovered tab should be tinted and show close icon', async () => {

      // when
      await userEvent.hover(element('#tab-tab1'));

      // then
      expect(getComputedStyle(element('#tab-tab1')).backgroundColor).toBe('rgba(48, 63, 159, 0.1)');
      expect(getComputedStyle(element('#tab-tab1 .icon_close_tab')).visibility).toBe('visible');
    });
  });

  it('#urlOf should return url of tab', () => {

    // when
    const url = component.urlOf(pivotTab);

    // then
    expect(url).toBe('/view/tab1');
  });

  it('#iconFor should consider current layout of tab', () => {

    // given
    vi.mocked(viewTabsService.layoutOf).mockReturnValue(Route.FLEX);

    // when
    const icon = component.iconFor(dashboardTab);

    // then
    expect(icon).toBe('flex_view');
    expect(viewTabsService.layoutOf).toHaveBeenCalledWith(dashboardTab);
  });

  it('add tab button should be disabled when tabs are not ready', () => {

    // given
    Object.defineProperty(viewTabsService, 'ready', { value: false });

    // when
    fixture.detectChanges();

    // then
    expect((element('#butAddTab') as HTMLButtonElement).disabled).toBe(true);
  });

  it('selecting "New Pivot Table" menu item should add pivot tab', fakeAsync(() => {

    // given
    element('#butAddTab').click();
    fixture.detectChanges();
    flush();

    // when
    (document.querySelector('#menuItemNewPivotTable') as HTMLButtonElement).click();

    // then
    expect(viewTabsService.addTab).toHaveBeenCalledWith(ViewType.PIVOT);
  }));

  it('selecting "New Dashboard" menu item should add dashboard tab', fakeAsync(() => {

    // given
    element('#butAddTab').click();
    fixture.detectChanges();
    flush();

    // when
    (document.querySelector('#menuItemNewDashboard') as HTMLButtonElement).click();

    // then
    expect(viewTabsService.addTab).toHaveBeenCalledWith(ViewType.DASHBOARD);
  }));

  it('double click on tab should rename tab when dialog is confirmed', fakeAsync(() => {

    // given
    vi.mocked(dialogService.showInputDialog).mockImplementation((data: InputDialogData) => {
      data.input = 'Sales';
      data.closedWithOK = true;
      return dialogRef() as never;
    });

    // when
    element('#tab-tab1').dispatchEvent(new MouseEvent('dblclick'));
    flush();

    // then
    const dialogData: InputDialogData = vi.mocked(dialogService.showInputDialog).mock.lastCall[0];
    expect(dialogData.title).toBe('Rename Tab');
    expect(viewTabsService.renameTab).toHaveBeenCalledWith(pivotTab, 'Sales');
  }));

  it('double click on tab should not rename tab when dialog is canceled', fakeAsync(() => {

    // given
    vi.mocked(dialogService.showInputDialog).mockReturnValue(dialogRef() as never);

    // when
    component.rename(pivotTab);
    flush();

    // then
    expect(viewTabsService.renameTab).not.toHaveBeenCalled();
  }));

  it('#keydown F2 on tab should open rename dialog', fakeAsync(() => {

    // given
    vi.mocked(dialogService.showInputDialog).mockReturnValue(dialogRef() as never);

    // when
    element('#tab-tab1').dispatchEvent(new KeyboardEvent('keydown', { key: 'F2' }));
    flush();

    // then
    const dialogData: InputDialogData = vi.mocked(dialogService.showInputDialog).mock.lastCall[0];
    expect(dialogData.title).toBe('Rename Tab');
    expect(dialogData.input).toBe('Pivot Table 1');
  }));

  it('#keydown Delete on tab should close tab', fakeAsync(() => {

    // given
    const event = new KeyboardEvent('keydown', { key: 'Delete', cancelable: true });

    // when
    element('#tab-tab1').dispatchEvent(event);
    flush();

    // then
    expect(viewTabsService.closeTab).toHaveBeenCalledWith(pivotTab, '/view/tab2');
    expect(event.defaultPrevented).toBe(true);
  }));

  it('click on close icon should close tab without content and without navigating to it', fakeAsync(() => {

    // given
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl');
    const closeIcon = fixture.debugElement.queryAll(By.css('.icon_close_tab'))[0].nativeElement;

    // when
    closeIcon.click();
    flush();

    // then
    expect(dialogService.showConfirmDialog).not.toHaveBeenCalled();
    expect(viewTabsService.closeTab).toHaveBeenCalledWith(pivotTab, '/view/tab2');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  }));

  it('#close should close tab with content when user confirms', fakeAsync(() => {

    // given
    vi.mocked(viewTabsService.currentTab).mockReturnValue({ ...dashboardTab, view: viewWithElement() });
    vi.mocked(dialogService.showConfirmDialog).mockImplementation((data: ConfirmDialogData) => {
      data.closedWithButtonIndex = 0;
      return dialogRef() as never;
    });

    // when
    component.close(new MouseEvent('click'), dashboardTab);
    flush();

    // then
    const dialogData: ConfirmDialogData = vi.mocked(dialogService.showConfirmDialog).mock.lastCall[0];
    expect(dialogData.title).toBe('Close Tab');
    expect(dialogData.htmlContent).toContain('Dashboard 2');
    expect(viewTabsService.closeTab).toHaveBeenCalledWith(dashboardTab, '/view/tab2');
  }));

  it('#close should show markup of tab title as text', fakeAsync(() => {

    // given
    const tab = { ...dashboardTab, title: '<b>Sales</b>' };
    vi.mocked(viewTabsService.currentTab).mockReturnValue({ ...tab, view: viewWithElement() });
    vi.mocked(dialogService.showConfirmDialog).mockReturnValue(dialogRef() as never);

    // when
    component.close(new MouseEvent('click'), tab);
    flush();

    // then
    const dialogData: ConfirmDialogData = vi.mocked(dialogService.showConfirmDialog).mock.lastCall[0];
    expect(dialogData.htmlContent).toContain('&lt;b&gt;Sales&lt;/b&gt;');
    expect(dialogData.htmlContent).not.toContain('<b>');
  }));

  it('#close should keep tab with content when user declines', fakeAsync(() => {

    // given
    vi.mocked(viewTabsService.currentTab).mockReturnValue({ ...dashboardTab, view: viewWithElement() });
    vi.mocked(dialogService.showConfirmDialog).mockImplementation((data: ConfirmDialogData) => {
      data.closedWithButtonIndex = 1;
      return dialogRef() as never;
    });

    // when
    component.close(new MouseEvent('click'), dashboardTab);
    flush();

    // then
    expect(viewTabsService.closeTab).not.toHaveBeenCalled();
  }));

  function viewWithElement(): View {
    return { route: Route.GRID, name: '', modifiedTime: 0, query: null, gridColumns: 3, gridCellRatio: '1:1', elements: [null] };
  }
});
