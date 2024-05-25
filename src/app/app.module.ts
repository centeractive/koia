import { DragDropModule } from '@angular/cdk/drag-drop';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';
import { ResizableModule } from 'angular-resizable-element';
import 'd3';
import { AppRouteReuseStrategy } from './app-route-reuse-strategy';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChartSideBarComponent } from './chart/chart-side-bar/chart-side-bar.component';
import { ChartComponent } from './chart/chart.component';
import { FlexCanvasComponent } from './flex-canvas/flex-canvas.component';
import { ConnectionDialogComponent } from './front/connection-dialog/connection-dialog.component';
import { FrontComponent } from './front/front.component';
import { GraphSideBarComponent } from './graph/graph-side-bar/graph-side-bar.component';
import { GraphComponent } from './graph/graph.component';
import { GridComponent } from './grid/grid.component';
import { MainToolbarComponent } from './main-toolbar/main-toolbar.component';
import { RangeFilterComponent } from './main-toolbar/range-filter/range-filter.component';
import { ValueFilterComponent } from './main-toolbar/value-filter/value-filter.component';
import { NgxSliderModule } from './ngx-slider/slider.module';
import { PivotTableSideBarComponent } from './pivot-table/pivot-table-side-bar/pivot-table-side-bar.component';
import { PivotTableComponent } from './pivot-table/pivot-table.component';
import { RawDataDialogComponent } from './raw-data/raw-data-dialog.component';
import { RawDataViewComponent } from './raw-data/raw-data-view.component';
import { RawDataComponent } from './raw-data/raw-data.component';
import { ColumnMappingComponent } from './scene/column-mapping/column-mapping.component';
import { SceneComponent } from './scene/scene.component';
import { SceneDetailsDialogComponent } from './scenes/scene-details-dialog/scene-details-dialog.component';
import { SceneTableComponent } from './scenes/scene-table/scene-table.component';
import { ScenesComponent } from './scenes/scenes.component';
import { ColorSchemeSelectionComponent } from './shared/component/color-scheme-selection/color-scheme-selection.component';
import { ConfigLauncherDialogComponent } from './shared/component/config-launcher-dialog';
import { ConfirmDialogComponent } from './shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { DraggableColumnComponent } from './shared/component/draggable-column/draggable-column.component';
import { ExpansionPanelComponent } from './shared/component/expansion-panel/expansion-panel.component';
import { InputDialogComponent } from './shared/component/input-dialog/input-dialog.component';
import { ManageConfigDialogComponent } from './shared/component/manage-config-dialog';
import { ManageViewDialogComponent } from './shared/component/manage-view-dialog';
import { StatusComponent } from './shared/component/status/status.component';
import { ViewLauncherDialogComponent } from './shared/component/view-launcher-dialog/view-launcher-dialog.component';
import { FormattedFloatDirective } from './shared/directives/formatted-float.directive';
import { FormattedIntegerDirective } from './shared/directives/formatted-integer.directive';
import { TextareaMaxRowsDirective } from './shared/directives/textarea-max-rows.directive';
import { AggregationService, NotificationService, RawDataRevealService, TimeGroupingService, ViewPersistenceService } from './shared/services';
import { DBService } from './shared/services/backend';
import { CouchDBService } from './shared/services/backend/couchdb/couchdb.service';
import { DialogService } from './shared/services/dialog.service';
import { ReaderService } from './shared/services/reader';
import { MatIconModuleMock } from './shared/test';
import { ValueRangeGroupingService } from './shared/value-range';
import { SummaryTableSideBarComponent } from './summary-table/summary-table-side-bar/summary-table-side-bar.component';
import { SummaryTableComponent } from './summary-table/summary-table.component';
import { TrialComponent } from './testing/trial/trial.component';

@NgModule({ declarations: [
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
        MatIconModuleMock,
        TextareaMaxRowsDirective,
        FormattedFloatDirective,
        FormattedIntegerDirective,
        ConnectionDialogComponent,
        FrontComponent,
        InputDialogComponent,
        ConfirmDialogComponent,
        ValueFilterComponent,
        RangeFilterComponent,
        ColumnMappingComponent,
        ViewLauncherDialogComponent,
        ConfigLauncherDialogComponent,
        ManageConfigDialogComponent,
        ManageViewDialogComponent,
        ColorSchemeSelectionComponent,
        ExpansionPanelComponent,
        SceneTableComponent,
        DraggableColumnComponent,
        TrialComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        FormsModule,
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
        MatTabsModule,
        MatBottomSheetModule,
        DragDropModule,
        ResizableModule,
        AppRoutingModule,
        MatDialogModule,
        MatStepperModule,
        MatSnackBarModule,
        ReactiveFormsModule,
        NgxSliderModule], providers: [
        { provide: RouteReuseStrategy, useClass: AppRouteReuseStrategy },
        { provide: STEPPER_GLOBAL_OPTIONS, useValue: { displayDefaultIndicatorType: false } },
        ReaderService,
        CouchDBService,
        DBService,
        MatDialog,
        RawDataRevealService,
        ViewPersistenceService,
        TimeGroupingService,
        ValueRangeGroupingService,
        AggregationService,
        NotificationService,
        DialogService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
