import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogConfig, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ConnectionDialogComponent, ConnectionDialogData } from 'app/front/connection-dialog/connection-dialog.component';
import { SceneDetailsDialogComponent } from 'app/scenes/scene-details-dialog/scene-details-dialog.component';
import { Column, DataType, Protocol } from 'app/shared/model';
import { of } from 'rxjs';
import { ComputedColumnDialogComponent, ComputedColumnDialogData } from '../component/computed-column-dialog/computed-column-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { InputDialogComponent, InputDialogData } from '../component/input-dialog/input-dialog.component';
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

  it('#editComputedColumn should open dialog and resolve saved column', async () => {

    // given
    const entries = [{ Amount: 1 }];
    const column: Column = { name: 'Share', dataType: DataType.NUMBER, width: 70, indexed: false };
    const savedColumn: Column = { ...column, name: 'Ratio' };
    vi.spyOn(matDialogService, 'open').mockImplementation((_component, config: MatDialogConfig<ComputedColumnDialogData>) => {
      config.data.savedColumn = savedColumn;
      return { afterClosed: () => of(undefined) } as MatDialogRef<unknown>;
    });

    // when
    const result = await service.editComputedColumn(entries, column);

    // then
    expect(result).toBe(savedColumn);
    expect(matDialogService.open).toHaveBeenCalledWith(ComputedColumnDialogComponent,
      { data: expect.objectContaining({ entries, column }), panelClass: 'dialog-container' });
  });

  it('#editComputedColumn should resolve undefined when dialog was cancelled', async () => {

    // given
    vi.spyOn(matDialogService, 'open').mockReturnValue({ afterClosed: () => of(undefined) } as MatDialogRef<unknown>);

    // when
    const result = await service.editComputedColumn([]);

    // then
    expect(result).toBeUndefined();
    expect(matDialogService.open).toHaveBeenCalledWith(ComputedColumnDialogComponent,
      { data: expect.objectContaining({ entries: [], column: undefined }), panelClass: 'dialog-container' });
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
    expect(matDialogService.open).toHaveBeenCalledWith(SceneDetailsDialogComponent,
      { data: { scene, editable: false }, panelClass: 'dialog-container', closeOnNavigation: true });
  });

  it('#showSceneDetailsDialog should open editable dialog that is not closed on navigation', () => {

    // given
    const scene = SceneFactory.createScene('1', []);
    vi.spyOn(matDialogService, 'open').mockReturnValue(undefined);

    // when
    service.showSceneDetailsDialog(scene, true);

    // then
    expect(matDialogService.open).toHaveBeenCalledWith(SceneDetailsDialogComponent,
      { data: { scene, editable: true }, panelClass: 'dialog-container', closeOnNavigation: false });
  });

  it('#showViewLauncherDialog should open dialog', () => {

    // when
    const context = {} as ViewLauncherContext;
    service.showViewLauncherDialog(context);

    // then
    expect(matDialogService.open).toHaveBeenCalledWith(ViewLauncherDialogComponent, { data: context, panelClass: 'dialog-container' });
  });

  it('#showManageViewDialog should open dialog', () => {

    // when
    const context = {} as ManageViewContext;
    service.showManageViewDialog(context);

    // then
    expect(matDialogService.open).toHaveBeenCalledWith(ManageViewDialogComponent, { data: context, panelClass: 'dialog-container' });
  });

});