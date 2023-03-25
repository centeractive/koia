import { TestBed } from '@angular/core/testing';
import { DialogService } from './dialog.service';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ConfirmDialogData, ConfirmDialogComponent } from '../component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { InputDialogComponent, InputDialogData } from '../component/input-dialog/input-dialog.component';
import { ConnectionDialogComponent, ConnectionDialogData } from 'app/front/connection-dialog/connection-dialog.component';
import { SceneDetailsDialogComponent } from 'app/scenes/scene-details-dialog/scene-details-dialog.component';
import { SceneFactory } from '../test';
import { Protocol, SummaryContext } from 'app/shared/model';
import { GraphContext } from 'app/shared/model/graph';
import { ViewLauncherContext, ViewLauncherDialogComponent } from '../component/view-launcher-dialog';
import { View } from 'app/shared/model/view-config';
import { ChartContext } from 'app/shared/model/chart';

describe('DialogService', () => {

  let matDialogService: MatDialog;
  let service: DialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [MatDialog]
    });
    matDialogService = TestBed.inject(MatDialog);
    spyOn(matDialogService, 'open');
    service = TestBed.inject(DialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#showConfirmDialog should open dialog', () => {

    // when
    const dialogData = new ConfirmDialogData('Test', 'abc', ConfirmDialogData.YES_NO);
    service.showConfirmDialog(dialogData);

    // then
    expect(matDialogService.open).toHaveBeenCalledWith(ConfirmDialogComponent, { data: dialogData, panelClass: 'dialog-container' });
  });

  it('#showInputDialog should open dialog', () => {

    // when
    const dialogData = new InputDialogData('Test', 'Value', '', 20);
    service.showInputDialog(dialogData);

    // then
    expect(matDialogService.open).toHaveBeenCalledWith(InputDialogComponent, { data: dialogData, panelClass: 'dialog-container' });
  });

  it('#showConnectionDialog should open dialog', () => {

    // when
    const dialogData = new ConnectionDialogData({
      protocol: Protocol.HTTP,
      host: 'localhost',
      port: 5984, user: 'koia',
      password: 'secret'
    });
    service.showConnectionDialog(dialogData);

    // then
    expect(matDialogService.open).toHaveBeenCalledWith(ConnectionDialogComponent, { data: dialogData, panelClass: 'dialog-container' });
  });

  it('#showSceneDetailsDialog should open dialog', () => {

    // when
    const scene = SceneFactory.createScene('1', []);
    service.showSceneDetailsDialog(scene);

    // then
    expect(matDialogService.open).toHaveBeenCalledWith(SceneDetailsDialogComponent, { data: scene, panelClass: 'dialog-container' });
  });

  it('#showViewLauncherDialog should open dialog', () => {

    // when
    const context = new ViewController();
    service.showViewLauncherDialog(context);

    // then
    expect(matDialogService.open).toHaveBeenCalledWith(ViewLauncherDialogComponent, { data: context, panelClass: 'dialog-container' });
  });

});

class ViewController implements ViewLauncherContext {
  findViews(): View[] {
    return [];
  }

  loadView(view: View): void { }

  addSummaryTable(): SummaryContext {
    return null;
  }

  addChart(): ChartContext {
    return null;
  }

  addGraph(): GraphContext {
    return null;
  }
}
