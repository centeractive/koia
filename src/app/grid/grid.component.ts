import { Component, ElementRef, Inject, AfterViewChecked } from '@angular/core';
import { MatBottomSheet } from '@angular/material';
import { Route } from '../shared/model';
import { View } from '../shared/config';
import { NotificationService, ChartMarginService, ConfigService, ExportService } from '../shared/services';
import { ViewController } from 'app/shared/controller';
import { Router } from '@angular/router';
import { DBService } from 'app/shared/services/backend';

@Component({
  selector: 'retro-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.css']
})
export class GridComponent extends ViewController implements AfterViewChecked {

  readonly route = Route.GRID;
  gridColumns = 3;
  gridCellRatio = '1:1';
  private windowResizedWhileHidden: boolean;

  constructor(@Inject(ElementRef) public cmpElementRef: ElementRef, router: Router, bottomSheet: MatBottomSheet, dbService: DBService,
    configService: ConfigService, chartMarginService: ChartMarginService, notificationService: NotificationService,
    exportService: ExportService) {
    super(Route.GRID, router, bottomSheet, dbService, configService, chartMarginService, notificationService, exportService);
    window.addEventListener('resize', e => this.windowResizedWhileHidden = !this.cmpElementRef.nativeElement.parentElement);
  }

  ngAfterViewChecked() {
    if (this.windowResizedWhileHidden) {
      this.windowResizedWhileHidden = false;
      this.elementContexts
        .filter(c => this.isChartContext(c))
        .forEach(c => c.fireSizeChanged());
    }
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
