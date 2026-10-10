import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { Route } from 'app/shared/model';
import { TabDef, ViewType } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { SceneFactory } from 'app/shared/test';
import { ViewTabComponent } from './view-tab.component';

@Component({ selector: 'koia-pivot-table', template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
class PivotTableComponent {
  @Input() tab: TabDef;
}

@Component({ selector: 'koia-dashboard', template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
class DashboardComponent {
  @Input() tab: TabDef;
}

describe('ViewTabComponent', () => {

  const dbService = new DBService(null);
  let viewTabsService: ViewTabsService;
  let router: Router;
  let fixture: ComponentFixture<ViewTabComponent>;

  beforeEach(() => {
    viewTabsService = { findTab: vi.fn(), evict: vi.fn() } as unknown as ViewTabsService;
    router = { navigateByUrl: vi.fn().mockResolvedValue(true) } as unknown as Router;
    vi.spyOn(dbService, 'getActiveScene').mockReturnValue(SceneFactory.createScene('1', []));
    TestBed.configureTestingModule({
      declarations: [ViewTabComponent, PivotTableComponent, DashboardComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'tab1' }) } } },
        { provide: Router, useValue: router },
        { provide: DBService, useValue: dbService },
        { provide: ViewTabsService, useValue: viewTabsService }
      ]
    });
    fixture = TestBed.createComponent(ViewTabComponent);
  });

  it('should navigate to scenes when no scene is active', () => {

    // given
    vi.mocked(dbService.getActiveScene).mockReturnValue(undefined);

    // when
    fixture.detectChanges();

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(Route.SCENES);
    expect(viewTabsService.findTab).not.toHaveBeenCalled();
  });

  it('should navigate to raw data and evict itself when tab does not exist', async () => {

    // given
    vi.mocked(viewTabsService.findTab).mockReturnValue(undefined);

    // when
    fixture.detectChanges();
    await fixture.whenStable();

    // then
    expect(viewTabsService.findTab).toHaveBeenCalledWith('tab1');
    expect(router.navigateByUrl).toHaveBeenCalledWith(Route.RAWDATA);
    expect(viewTabsService.evict).toHaveBeenCalledWith('tab1');
  });

  it('should show pivot table when tab is of type pivot', () => {

    // given
    const tab: TabDef = { id: 'tab1', type: ViewType.PIVOT, title: 'Pivot Table 1' };
    vi.mocked(viewTabsService.findTab).mockReturnValue(tab);

    // when
    fixture.detectChanges();

    // then
    const pivotTable = fixture.debugElement.query(By.directive(PivotTableComponent));
    expect(pivotTable.componentInstance.tab).toBe(tab);
    expect(fixture.debugElement.query(By.directive(DashboardComponent))).toBeNull();
  });

  it('should show dashboard when tab is of type dashboard', () => {

    // given
    const tab: TabDef = { id: 'tab1', type: ViewType.DASHBOARD, title: 'Dashboard 1' };
    vi.mocked(viewTabsService.findTab).mockReturnValue(tab);

    // when
    fixture.detectChanges();

    // then
    const dashboard = fixture.debugElement.query(By.directive(DashboardComponent));
    expect(dashboard.componentInstance.tab).toBe(tab);
    expect(fixture.debugElement.query(By.directive(PivotTableComponent))).toBeNull();
  });
});
