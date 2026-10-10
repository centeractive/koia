import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FrontComponent } from './front/front.component';
import { RawDataViewComponent } from './raw-data/raw-data-view.component';
import { SceneComponent } from './scene/scene.component';
import { ScenesComponent } from './scenes/scenes.component';
import { Route } from './shared/model/route.enum';
import { TrialComponent } from './testing/trial/trial.component';
import { ViewTabComponent } from './view-tab/view-tab.component';

export const routes: Routes = [
  { path: Route.FRONT, component: FrontComponent },
  { path: Route.SCENES, component: ScenesComponent },
  { path: Route.SCENE, component: SceneComponent },
  { path: Route.RAWDATA, component: RawDataViewComponent },
  { path: Route.VIEW + '/:id', component: ViewTabComponent },
  { path: Route.TRIAL, component: TrialComponent },
  { path: '', redirectTo: '/' + Route.FRONT, pathMatch: 'full' },
  { path: '**', redirectTo: '/' + Route.FRONT }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
