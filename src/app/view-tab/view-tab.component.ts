import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Route } from 'app/shared/model';
import { TabDef, ViewType } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { ViewTabsService } from 'app/shared/services/view-tabs';

@Component({
  selector: 'koia-view-tab',
  template: `@if (tab) {
               @switch (tab.type) {
                 @case (pivotType) {
                   <koia-pivot-table [tab]="tab" />
                 }
                 @case (dashboardType) {
                   <koia-dashboard [tab]="tab" />
                 }
               }
             }`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ViewTabComponent implements OnInit {

  readonly pivotType = ViewType.PIVOT;
  readonly dashboardType = ViewType.DASHBOARD;

  tab: TabDef;

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private dbService: DBService,
    private viewTabsService: ViewTabsService) { }

  ngOnInit(): void {
    if (!this.dbService.getActiveScene()) {
      this.router.navigateByUrl(Route.SCENES);
    } else {
      const id = this.activatedRoute.snapshot.paramMap.get('id');
      this.tab = this.viewTabsService.findTab(id);
      if (!this.tab) {
        this.router.navigateByUrl(Route.RAWDATA)
          .then(() => this.viewTabsService.evict(id));
      }
    }
  }
}
