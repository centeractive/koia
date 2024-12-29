import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { Edges, ResizeEvent } from 'angular-resizable-element';
import { ViewController } from 'app/shared/controller';
import { View } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { ChartMarginService } from 'app/shared/services/chart';
import { ElementContext, Route } from '../shared/model';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from '../shared/services';

@Component({
  selector: 'koia-flex-canvas',
  templateUrl: './flex-canvas.component.html',
  styleUrls: ['./flex-canvas.component.css'],
  standalone: false
})
export class FlexCanvasComponent extends ViewController {

  static readonly MIN_DIM_PX = 200;

  @ViewChildren('elementContainer') elementContainerDivsRefs: QueryList<ElementRef<HTMLDivElement>>;

  constructor(router: Router, bottomSheet: MatBottomSheet, dbService: DBService, dialogService: DialogService,
    viewPersistenceService: ViewPersistenceService, chartMarginService: ChartMarginService, notificationService: NotificationService,
    exportService: ExportService) {
    super(Route.FLEX, router, bottomSheet, dbService, dialogService, viewPersistenceService, chartMarginService, notificationService,
      exportService);
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

  onResizeEnd(context: ElementContext, resizeEvent: ResizeEvent): void {
    const rect = resizeEvent.rectangle;
    const width = rect.width;
    const height = rect.height;
    const iCtx = this.elementContexts.indexOf(context);
    const containerDivRef = this.elementContainerDivsRefs.get(iCtx);
    if (containerDivRef) {
      const style = containerDivRef.nativeElement.style;
      style.width = width + 'px';
      style.height = height + 'px';
    }
    context.setSize(width, height);
  }

  // eslint-disable-next-line
  protected onPreRestoreView(view: View): void {
    // nothing to do
  }

  // eslint-disable-next-line
  protected onPreSaveView(view: View): void {
    // nothing to do
  }
}
