import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { InputDialogData } from 'app/shared/component/input-dialog/input-dialog.component';
import { ViewController } from 'app/shared/controller';
import { Route } from 'app/shared/model';
import { TabDef, ViewType } from 'app/shared/model/view-config';
import { DialogService } from 'app/shared/services';
import { hasContent, iconOf, tabUrl, ViewTabsService } from 'app/shared/services/view-tabs';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'koia-view-tab-bar',
  templateUrl: './view-tab-bar.component.html',
  styleUrls: ['./view-tab-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ViewTabBarComponent {

  @Input() currUrl: string;

  readonly urlRawdata = '/' + Route.RAWDATA;
  readonly pivotType = ViewType.PIVOT;
  readonly dashboardType = ViewType.DASHBOARD;

  constructor(public viewTabsService: ViewTabsService, private dialogService: DialogService) { }

  urlOf(tab: TabDef): string {
    return tabUrl(tab.id);
  }

  iconFor(tab: TabDef): string {
    return iconOf(tab, this.viewTabsService.layoutOf(tab));
  }

  addTab(type: ViewType): void {
    this.viewTabsService.addTab(type);
  }

  rename(tab: TabDef): void {
    const dialogData = new InputDialogData('Rename Tab', 'Tab Name', tab.title, ViewController.VIEW_NAME_MAX_LENGTH);
    firstValueFrom(this.dialogService.showInputDialog(dialogData).afterClosed())
      .then(() => {
        if (dialogData.closedWithOK) {
          this.viewTabsService.renameTab(tab, dialogData.input);
        }
      });
  }

  close(event: MouseEvent, tab: TabDef): void {
    event.stopPropagation();
    event.preventDefault();
    if (hasContent(this.viewTabsService.currentTab(tab))) {
      const data = new ConfirmDialogData('Close Tab', '<p>Do you really want to close "' + tab.title + '"?</p>', ConfirmDialogData.YES_NO);
      firstValueFrom(this.dialogService.showConfirmDialog(data).afterClosed())
        .then(() => {
          if (data.closedWithButtonIndex === 0) {
            this.viewTabsService.closeTab(tab, this.currUrl);
          }
        });
    } else {
      this.viewTabsService.closeTab(tab, this.currUrl);
    }
  }
}
