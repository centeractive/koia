import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConnectionDialogComponent, ConnectionDialogData } from 'app/front/connection-dialog/connection-dialog.component';
import { SceneDetailsDialogComponent } from 'app/scenes/scene-details-dialog/scene-details-dialog.component';
import { Protocol, Route } from 'app/shared/model';
import { ConfigRecord } from 'app/shared/model/view-config';
import { ComputedColumnDialogComponent, ComputedColumnDialogData } from '../component/computed-column-dialog/computed-column-dialog.component';
import { ConfigLauncherContext, ConfigLauncherDialogComponent } from '../component/config-launcher-dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { InputDialogComponent, InputDialogData } from '../component/input-dialog/input-dialog.component';
import { ManageConfigContext } from '../component/manage-view-dialog';
import { ManageViewContext, ManageViewDialogComponent } from '../component/manage-view-dialog';
import { ViewLauncherContext, ViewLauncherDialogComponent } from '../component/view-launcher-dialog';
import { SceneFactory } from '../test';
import { DialogService } from './dialog.service';

describe('DialogService', () => {

  let matDialogService: MatDialog;
  let service: DialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [MatDialog]
    });
    matDialogService = TestBed.inject(MatDialog);
    vi.spyOn(matDialogService, 'open').mockReturnValue(undefined);
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

  it('#showComputedColumnDialog should open dialog', () => {

    // given
    const dialogData = new ComputedColumnDialogData([]);

    // when
    service.showComputedColumnDialog(dialogData);

    // then
    expect(matDialogService.open).toHaveBeenCalledWith(ComputedColumnDialogComponent, { data: dialogData, panelClass: 'dialog-container' });
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
    const context = {} as ViewLauncherContext;
    service.showViewLauncherDialog(context);

    // then
    expect(matDialogService.open).toHaveBeenCalledWith(ViewLauncherDialogComponent, { data: context, panelClass: 'dialog-container' });
  });

  it('#showConfigLauncherDialog should open dialog', () => {

    // when
    const context = {} as ConfigLauncherContext;
    service.showConfigLauncherDialog(context);

    // then
    expect(matDialogService.open).toHaveBeenCalledWith(ConfigLauncherDialogComponent, { data: context, panelClass: 'dialog-container' });
  });

  it('#showManageConfigDialog should open manage view dialog with config records', () => {

    // given
    const configRecords = [{ route: Route.PIVOT, name: 'A', modifiedTime: 0, query: null, data: null }];
    const context: ManageConfigContext = { configRecords, updateConfigRecords: vi.fn() };
    service.showManageConfigDialog(context);
    const data = vi.mocked(matDialogService.open).mock.lastCall[1].data as ManageViewContext<ConfigRecord>;
    const deleted: ConfigRecord[] = [];
    const renamed = [...configRecords];

    // when
    data.updateViews(deleted, renamed);

    // then
    expect(matDialogService.open).toHaveBeenCalledWith(ManageViewDialogComponent, { data, panelClass: 'dialog-container' });
    expect(data.views).toBe(configRecords);
    expect(context.updateConfigRecords).toHaveBeenCalledWith(deleted, renamed);
  });

  it('#showManageViewDialog should open dialog', () => {

    // when
    const context = {} as ManageViewContext;
    service.showManageViewDialog(context);

    // then
    expect(matDialogService.open).toHaveBeenCalledWith(ManageViewDialogComponent, { data: context, panelClass: 'dialog-container' });
  });

});