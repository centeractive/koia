import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { SavedView } from 'app/shared/model/view-config';
import { NotificationService } from 'app/shared/services';
import { SavedViewsService } from 'app/shared/services/saved-views';

@Component({
  selector: 'koia-saved-view-buttons',
  templateUrl: './saved-view-buttons.component.html',
  styleUrls: ['./saved-view-buttons.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class SavedViewButtonsComponent extends AbstractComponent {

  @Input() activeTabId: string;

  constructor(private savedViewsService: SavedViewsService, bottomSheet: MatBottomSheet, notificationService: NotificationService) {
    super(bottomSheet, notificationService);
  }

  get ready(): boolean {
    return this.savedViewsService.ready;
  }

  get savedViews(): SavedView[] {
    return this.savedViewsService.findAll();
  }

  save(): void {
    this.savedViewsService.save(this.activeTabId).then(status => {
      if (status) {
        this.showStatus(status);
      }
    });
  }

  restore(view: SavedView): void {
    this.savedViewsService.restore(view);
  }

  manage(): void {
    this.savedViewsService.manage(status => this.showStatus(status));
  }
}
