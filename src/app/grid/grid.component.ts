import { AfterViewChecked, Component, ElementRef, Inject } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { ViewController } from 'app/shared/controller';
import { View } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { ChartMarginService } from 'app/shared/services/chart';
import { ElementContext, Route } from '../shared/model';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from '../shared/services';
import { computeAspectRatio } from './aspect-ratio';

@Component({
  selector: 'koia-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.css'],
  standalone: false
})
export class GridComponent extends ViewController implements AfterViewChecked {

  gridColumns = 3;
  gridCellRatio = '1:1';
  private windowResizedWhileHidden: boolean;

  constructor(@Inject(ElementRef) public cmpElementRef: ElementRef, router: Router, bottomSheet: MatBottomSheet,
    dbService: DBService, dialogService: DialogService, viewPersistenceService: ViewPersistenceService,
    chartMarginService: ChartMarginService, notificationService: NotificationService, exportService: ExportService) {
    super(Route.GRID, router, bottomSheet, dbService, dialogService, viewPersistenceService, chartMarginService, notificationService,
      exportService);
    window.addEventListener('resize', () => this.windowResizedWhileHidden = !this.cmpElementRef.nativeElement.parentElement);
  }

  ngAfterViewChecked() {
    if (this.windowResizedWhileHidden) {
      this.windowResizedWhileHidden = false;
      this.elementContexts
        .filter(c => this.isChartContext(c))
        .forEach(c => c.fireSizeChanged());
    }
  }

  gridStyle(): object {
    return {
      display: 'grid',
      'grid-template-columns': 'repeat(' + this.gridColumns + ', minmax(0, 1fr))',
      'gap': '10px'
    };
  }

  cellStyle(context: ElementContext): object {
    return {
      'aspect-ratio': computeAspectRatio(this.gridCellRatio, context),
      'grid-column': 'auto / span ' + context.gridColumnSpan,
      'grid-row': 'auto / span ' + context.gridRowSpan
    };
  }

  setGridColumns(gridColumns: number): void {
    const largerElementContexts = this.elementContexts.filter(c => c.gridColumnSpan > gridColumns);
    if (largerElementContexts.length === 0 || confirm('Larger elements will be resized to fit the new setting')) {
      largerElementContexts.forEach(c => c.gridColumnSpan = gridColumns);
      this.gridColumns = gridColumns;
      this.elementContexts
        .filter(c => !largerElementContexts.includes(c))
        .forEach(c => c.fireSizeChanged());
    }
  }

  setGridCellRatio(gridCellRatio: string): void {
    this.gridCellRatio = gridCellRatio;
    this.elementContexts.forEach(c => c.fireSizeChanged());
  }

  protected onPreRestoreView(view: View): void {
    this.gridColumns = view.gridColumns;
    this.gridCellRatio = view.gridCellRatio;
  }

  protected onPreSaveView(view: View): void {
    view.gridColumns = this.gridColumns;
    view.gridCellRatio = this.gridCellRatio;
  }
}
