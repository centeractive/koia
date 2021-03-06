import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Route } from './shared/model/route.enum';
import { FrontComponent } from './front/front.component';
import { ScenesComponent } from './scenes/scenes.component';
import { SceneComponent } from './scene/scene.component';
import { RawDataViewComponent } from './raw-data/raw-data-view.component';
import { GridComponent } from './grid/grid.component';
import { FlexCanvasComponent } from './flex-canvas/flex-canvas.component';
import { PivotTableComponent } from './pivot-table/pivot-table.component';

const routes: Routes = [
  { path: Route.FRONT, component: FrontComponent },
  { path: Route.SCENES, component: ScenesComponent },
  { path: Route.SCENE, component: SceneComponent },
  { path: Route.RAWDATA, component: RawDataViewComponent },
  { path: Route.GRID, component: GridComponent },
  { path: Route.FLEX, component: FlexCanvasComponent },
  { path: Route.PIVOT, component: PivotTableComponent },
  { path: '', redirectTo: '/' + Route.FRONT, pathMatch: 'full' },
  { path: '**', redirectTo: '/' + Route.FRONT }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false, relativeLinkResolution: 'legacy' } )],
  exports: [RouterModule]
})
export class AppRoutingModule { }
