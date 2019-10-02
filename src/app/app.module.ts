import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { RouteReuseStrategy } from '@angular/router/';
import { AppRouteReuseStrategy } from './app-route-reuse-strategy';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatButtonModule, MatCheckboxModule, MatRadioModule, MatExpansionModule, MatCardModule,
  MatSelectModule, MatMenuModule, MatIconModule, MatProgressBarModule, MatInputModule,
  MatSidenavModule, MatBadgeModule, MatTableModule, MatSortModule, MatPaginatorModule,
  MatSlideToggleModule, MatSliderModule, MatBottomSheetModule, MatToolbarModule, MatDialog,
  MatDialogModule, MatStepperModule
} from '@angular/material';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatGridListModule } from '@angular/material/grid-list';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ResizableModule } from 'angular-resizable-element';

import { ChartsModule } from 'ng2-charts';
import { NvD3Module } from 'ng2-nvd3';
import 'd3';
import 'nvd3';
import { Ng5SliderModule } from 'ng5-slider';
import {
  NotificationService, AggregationService, TimeGroupingService, ViewPersistenceService,
  RawDataRevealService
} from './shared/services';
import { MainToolbarComponent } from './main-toolbar/main-toolbar.component';
import { ScenesComponent } from './scenes/scenes.component';
import { SceneComponent } from './scene/scene.component';
import { RawDataComponent } from './raw-data/raw-data.component';
import { GridComponent } from './grid/grid.component';
import { FlexCanvasComponent } from './flex-canvas/flex-canvas.component';
import { ChartComponent } from './chart/chart.component';
import { ChartSideBarComponent } from './chart/chart-side-bar/chart-side-bar.component';
import { SummaryTableComponent } from './summary-table/summary-table.component';
import { SummaryTableSideBarComponent } from './summary-table/summary-table-side-bar/summary-table-side-bar.component';
import { GraphComponent } from './graph/graph.component';
import { GraphSideBarComponent } from './graph/graph-side-bar/graph-side-bar.component';
import { PivotTableComponent } from './pivot-table/pivot-table.component';
import { PivotTableSideBarComponent } from './pivot-table/pivot-table-side-bar/pivot-table-side-bar.component';
import { StatusComponent } from './shared/component/status/status.component';
import { ChartjsComponent } from './chartjs/chartjs.component';
import { JSONServerService } from './shared/services/backend/jsonserver';
import { ReaderService } from './shared/services/reader';
import { CouchDBService } from './shared/services/backend/couchdb/couchdb.service';
import { DBService } from './shared/services/backend';
import { MatIconModuleMock } from './shared/test';
import { TextareaMaxRowsDirective } from './shared/directives/textarea-max-rows.directive';
import { RawDataDialogComponent } from './raw-data/raw-data-dialog.component';
import { RawDataViewComponent } from './raw-data/raw-data-view.component';
import { SceneDetailsDialogComponent } from './scenes/scene-details-dialog.component';
import { DialogService } from './shared/services/dialog.service';
import { FrontComponent } from './front/front.component';
import { ConnectionDialogComponent } from './front/connection-dialog/connection-dialog.component';
import { MAT_STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { InputDialogComponent } from './shared/component/input-dialog/input-dialog.component';
import { ValueRangeGroupingService } from './shared/value-range';
import { ConfirmDialogComponent } from './shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    MainToolbarComponent,
    ScenesComponent,
    SceneDetailsDialogComponent,
    SceneComponent,
    GridComponent,
    FlexCanvasComponent,
    RawDataComponent,
    RawDataViewComponent,
    RawDataDialogComponent,
    ChartComponent,
    ChartSideBarComponent,
    GraphComponent,
    GraphSideBarComponent,
    SummaryTableComponent,
    SummaryTableSideBarComponent,
    PivotTableComponent,
    PivotTableSideBarComponent,
    StatusComponent,
    ChartjsComponent,
    MatIconModuleMock,
    TextareaMaxRowsDirective,
    ConnectionDialogComponent,
    FrontComponent,
    InputDialogComponent,
    ConfirmDialogComponent
  ],
  entryComponents: [
    ConfirmDialogComponent,
    InputDialogComponent,
    ConnectionDialogComponent,
    StatusComponent,
    RawDataDialogComponent,
    SceneDetailsDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatBadgeModule,
    MatCheckboxModule,
    MatRadioModule,
    MatExpansionModule,
    MatCardModule,
    MatSelectModule,
    MatMenuModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatGridListModule,
    MatSidenavModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatBottomSheetModule,
    DragDropModule,
    ResizableModule,
    ChartsModule,
    NvD3Module,
    Ng5SliderModule,
    AppRoutingModule,
    MatDialogModule,
    MatStepperModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: AppRouteReuseStrategy },
    { provide: MAT_STEPPER_GLOBAL_OPTIONS, useValue: { displayDefaultIndicatorType: false } },
    ReaderService,
    CouchDBService,
    DBService,
    MatDialog,
    JSONServerService,
    RawDataRevealService,
    ViewPersistenceService,
    TimeGroupingService,
    ValueRangeGroupingService,
    AggregationService,
    NotificationService,
    DialogService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
