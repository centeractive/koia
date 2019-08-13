import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { MatBottomSheet } from '@angular/material';
import { ResizeEvent, Edges } from 'angular-resizable-element';
import { ElementContext, Route, View } from '../shared/model';
import { NotificationService, ChartMarginService, ViewPersistenceService, ExportService } from '../shared/services';
import { ViewController } from 'app/shared/controller';
import { Router } from '@angular/router';
import { DBService } from 'app/shared/services/backend';

@Component({
  selector: 'koia-flex-canvas',
  templateUrl: './flex-canvas.component.html',
  styleUrls: ['./flex-canvas.component.css']
})
export class FlexCanvasComponent extends ViewController {

  static readonly MIN_DIM_PX = 200;

  @ViewChildren('elementHeader') elementHeaderDivsRefs: QueryList<ElementRef<HTMLDivElement>>;

  readonly route = Route.FLEX;
  private resizeStartWidth: number;

  constructor(router: Router, bottomSheet: MatBottomSheet, dbService: DBService, configService: ViewPersistenceService,
    chartMarginService: ChartMarginService, notificationService: NotificationService, exportService: ExportService) {
    super(Route.FLEX, router, bottomSheet, dbService, configService, chartMarginService, notificationService, exportService);
  }

  resizableEdgesOf(context: ElementContext): Edges {
    const resizable = !this.isShowResizableMargin(context);
    return { bottom: resizable, right: resizable, top: false, left: false };
  }

  validateElementResize(event: ResizeEvent): boolean {
    if (event.rectangle.width && event.rectangle.height &&
      (event.rectangle.width < FlexCanvasComponent.MIN_DIM_PX || event.rectangle.height < FlexCanvasComponent.MIN_DIM_PX)) {
      return false;
    }
    return true;
  }

  onResizeStart(resizeEvent: ResizeEvent): void {
    this.resizeStartWidth = resizeEvent.rectangle.width;
  }

  onResizeEnd(context: ElementContext, resizeEvent: ResizeEvent): void {
    const rect = resizeEvent.rectangle;
    const width = this.resizeStartWidth === rect.width ? context.width : rect.width;
    const htmlDiv = this.elementHeaderDivsRefs.toArray()[0].nativeElement;
    context.setSize(width, rect.height - htmlDiv.offsetHeight);
  }

  protected onPreRestoreView(view: View): void {
    // nothing to do
  }

  protected onPreSaveView(view: View): void {
    // nothing to do
  }
}
