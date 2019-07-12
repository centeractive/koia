import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Route } from './shared/model/route.enum';
import { RawDataComponent } from './raw-data/raw-data.component';
import { GridComponent } from './grid/grid.component';
import { FlexCanvasComponent } from './flex-canvas/flex-canvas.component';
import { PivotTableComponent } from './pivot-table/pivot-table.component';
import { SceneComponent } from './scene/scene.component';
import { ScenesComponent } from './scenes/scenes.component';

const routes: Routes = [
  { path: Route.SCENES, component: ScenesComponent },
  { path: Route.SCENE, component: SceneComponent },
  { path: Route.RAWDATA, component: RawDataComponent },
  { path: Route.GRID, component: GridComponent },
  { path: Route.FLEX, component: FlexCanvasComponent },
  { path: Route.PIVOT, component: PivotTableComponent },
  { path: '', redirectTo: '/' + Route.RAWDATA, pathMatch: 'full' },
  { path: '**', redirectTo: '/' + Route.RAWDATA }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
