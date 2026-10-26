import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NotificationService } from 'app/shared/services/notification.service';
import { PatternColumnService } from 'app/shared/services/pattern-column.service';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { Column, ComputeOperator, DataType, Scene, TimeUnit } from 'app/shared/model';
import { SceneFactory, textsOf } from 'app/shared/test';
import { DialogCloseButtonComponent } from 'app/shared/ui/dialog-close-button/dialog-close-button.component';
import { SceneDetailsDialogComponent, SceneDetailsDialogData } from './scene-details-dialog.component';
import { MatCardModule } from '@angular/material/card';

describe('SceneDetailsDialogComponent', () => {

   let scene: Scene;
   let data: SceneDetailsDialogData;
   let dialogRef: { close(): void, disableClose: boolean };
   let patternColumnService: { add: ReturnType<typeof vi.fn>, suitableColumnNames: ReturnType<typeof vi.fn> };
   let notificationService: NotificationServiceMock;
   let fixture: ComponentFixture<SceneDetailsDialogComponent>;

   beforeEach(waitForAsync(() => {
      const columns = [
         { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
         { name: 'Path', dataType: DataType.TEXT, width: 200, indexed: true },
         { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true },
         { name: 'Time', dataType: DataType.TIME, width: 100, indexed: true, groupingTimeUnit: TimeUnit.MONTH }
      ];
      scene = SceneFactory.createScene('1', columns);
      scene.context = [{ name: 'Data Sources', value: 'a.log\nb.log' }];
      data = { scene, editable: false };
      dialogRef = { close(): void { }, disableClose: false };
      patternColumnService = { add: vi.fn(), suitableColumnNames: vi.fn().mockResolvedValue(new Set(['Level', 'Path'])) };
      notificationService = new NotificationServiceMock();
      vi.spyOn(notificationService, 'onSuccess').mockReturnValue(undefined);
      vi.spyOn(notificationService, 'onError').mockReturnValue(undefined);
      TestBed.configureTestingModule({
         declarations: [SceneDetailsDialogComponent, DialogCloseButtonComponent],
         imports: [MatCardModule, MatDialogModule, MatIconModule, MatTableModule, MatTooltipModule, MatButtonModule, MatProgressBarModule,
            MatBottomSheetModule],
         providers: [
            { provide: MatDialogRef, useValue: dialogRef },
            { provide: MAT_DIALOG_DATA, useValue: data },
            { provide: PatternColumnService, useValue: patternColumnService },
            { provide: NotificationService, useValue: notificationService }
         ]
      })
         .compileComponents();
   }));

   function render(): HTMLElement {
      fixture = TestBed.createComponent(SceneDetailsDialogComponent);
      fixture.detectChanges();
      return fixture.nativeElement;
   }

   async function renderWithSample(): Promise<HTMLElement> {
      const host = render();
      await fixture.whenStable();
      fixture.detectChanges();
      return host;
   }

   it('should show scene name as card title', () => {

      // when
      const host = render();

      // then
      expect(textsOf(host, 'mat-card-title')).toEqual([scene.name]);
   });

   it('should show short description as card subtitle', () => {

      // when
      const host = render();

      // then
      expect(textsOf(host, 'mat-card-subtitle')).toEqual([scene.shortDescription]);
   });

   it('should omit card subtitle when scene has no short description', () => {

      // given
      scene.shortDescription = '';

      // when
      const host = render();

      // then
      expect(host.querySelector('mat-card-subtitle')).toBeNull();
   });

   it('should show source context as name value rows keeping line breaks', () => {

      // when
      const host = render();

      // then
      expect(textsOf(host, '.section-title')).toEqual(['Source Context', 'Columns']);
      expect(textsOf(host, '#context_table .ctx-name')).toEqual(['Data Sources']);
      const value = host.querySelector<HTMLElement>('#context_table .ctx-value');
      expect(value.textContent).toBe('a.log\nb.log');
      expect(getComputedStyle(value).whiteSpace).toBe('pre-wrap');
      expect(host.querySelector('#context_table .mat-mdc-header-row')).toBeNull();
   });

   it('should omit source context when scene has none', () => {

      // given
      scene.context = [];

      // when
      const host = render();

      // then
      expect(textsOf(host, '.section-title')).toEqual(['Columns']);
      expect(host.querySelector('#context_table')).toBeNull();
   });

   it('should show one row per column below translated headers', () => {

      // when
      const host = render();

      // then
      expect(textsOf(host, '#columns_table .mat-mdc-header-cell')).toEqual(['Name', 'Type', 'Format', 'Group By', 'Width (pixel)']);
      expect(textsOf(host, '#columns_table .column-name')).toEqual(['Level', 'Path', 'Amount', 'Time']);
   });

   it('should show functions icon with formula tooltip for computed column only', () => {

      // given
      scene.columns.push({
         name: 'Share', dataType: DataType.NUMBER, width: 10, indexed: false,
         computation: { leftColumn: 'Amount', operator: ComputeOperator.PERCENTAGE, rightColumn: 'Amount' }
      });

      // when
      const host = render();

      // then
      const icons = fixture.debugElement.queryAll(By.css('.icon_computed_column'));
      expect(icons.length).toBe(1);
      expect(icons[0].nativeElement.closest('.column-name').firstChild.textContent).toBe('Share');
      expect(icons[0].nativeElement.textContent).toBe('functions');
      expect(icons[0].injector.get(MatTooltip).message).toBe('Amount as % of Amount');
      expect(textsOf(host, '#columns_table .column-name').slice(0, 4)).toEqual(['Level', 'Path', 'Amount', 'Time']);
   });

   it('should show semi-bold column names and right aligned widths', () => {

      // when
      const host = render();

      // then
      expect(getComputedStyle(host.querySelector('#columns_table .column-name')).fontWeight).toBe('600');
      expect(getComputedStyle(host.querySelector('#columns_table th.mat-column-width')).textAlign).toBe('right');
      expect(getComputedStyle(host.querySelector('#columns_table td.mat-column-width')).textAlign).toBe('right');
   });

   it('should show columns table like summary table', () => {

      // when
      const host = render();

      // then
      const header = getComputedStyle(host.querySelector('#columns_table .mat-mdc-header-cell'));
      expect(header.fontWeight).toBe('600');
      expect(header.backgroundColor).toBe('rgb(245, 246, 248)');
      expect(header.borderBottomWidth).toBe('1px');
      expect(header.borderBottomColor).toBe('rgb(224, 224, 224)');
      const cell = getComputedStyle(host.querySelector('#columns_table tr.mat-mdc-row td'));
      expect(cell.fontSize).toBe('12px');
      expect(cell.lineHeight).toBe('16px');
      expect(cell.paddingTop).toBe('3px');
      const rows: HTMLElement[] = Array.from(host.querySelectorAll('#columns_table tr.mat-mdc-row'));
      expect(rows.slice(0, 2).map(r => getComputedStyle(r.querySelector('td')).backgroundColor))
         .toEqual(['rgb(239, 239, 239)', 'rgba(0, 0, 0, 0)']);
      expect(rows[1].offsetHeight).toBe(23);
      expect(getComputedStyle(rows[0].querySelector('td')).borderBottomStyle).toBe('none');
      const lastCell = getComputedStyle(rows[rows.length - 1].querySelector('td'));
      expect(lastCell.borderBottomWidth).toBe('1px');
      expect(lastCell.borderBottomColor).toBe('rgb(224, 224, 224)');
   });

   it('should center single line context name and value within row', () => {

      // given
      scene.context = [{ name: 'Source', value: 'Koia sample data' }];

      // when
      const host = render();

      // then
      const row = host.querySelector<HTMLElement>('#context_table tr.mat-mdc-row').getBoundingClientRect();
      const name = textRectOf(host.querySelector('#context_table .ctx-name'));
      const value = textRectOf(host.querySelector('#context_table .ctx-value'));
      expect(value.top).toBe(name.top);
      expect(Math.abs((name.top + name.bottom) / 2 - (row.top + row.bottom) / 2)).toBeLessThanOrEqual(1);
   });

   it('should keep context name on first line of multi line value', () => {

      // when
      const host = render();

      // then
      const name = textRectOf(host.querySelector('#context_table .ctx-name'));
      const value = textRectOf(host.querySelector('#context_table .ctx-value'));
      expect(value.top).toBe(name.top);
      expect(value.height).toBeGreaterThan(name.height);
   });

   it('should show translated grouping time unit', () => {

      // when
      const cell = groupingTimeUnitCell('Time');

      // then
      expect(cell.textContent.trim()).toBe('per month');
   });

   it('should show empty grouping time unit when column has none', () => {

      // when
      const cell = groupingTimeUnitCell('Amount');

      // then
      expect(cell.textContent.trim()).toBe('');
   });

   describe('pattern columns', () => {

      const levelPattern: Column = { name: 'Level pattern', dataType: DataType.TEXT, width: 60, indexed: true, patternOf: 'Level' };

      function addPatternButtonColumns(host: HTMLElement): string[] {
         return Array.from(host.querySelectorAll('#columns_table tr.mat-mdc-row'))
            .filter(r => r.querySelector('.but_add_pattern'))
            .map(r => r.querySelector('.column-name').firstChild.textContent);
      }

      it('should not offer adding pattern columns when not editable', () => {

         // when
         const host = render();

         // then
         expect(host.querySelector('#columns_table .mat-column-actions')).toBeNull();
         expect(host.querySelector('.but_add_pattern')).toBeNull();
         expect(patternColumnService.suitableColumnNames).not.toHaveBeenCalled();
      });

      it('should offer adding pattern column to free text columns without pattern column when editable', async () => {

         // given
         data.editable = true;
         scene.columns.push(levelPattern);

         // when
         const host = await renderWithSample();

         // then
         expect(patternColumnService.suitableColumnNames).toHaveBeenCalledWith(scene);
         expect(addPatternButtonColumns(host)).toEqual(['Path']);
      });

      it('should show pattern icon with tooltip for pattern column only', () => {

         // given
         scene.columns.push(levelPattern);

         // when
         render();

         // then
         const icons = fixture.debugElement.queryAll(By.css('.icon_pattern_column'));
         expect(icons.length).toBe(1);
         expect(icons[0].nativeElement.closest('.column-name').firstChild.textContent).toBe('Level pattern');
         expect(icons[0].nativeElement.textContent).toBe('subdirectory_arrow_right');
         expect(icons[0].injector.get(MatTooltip).message).toBe('Pattern of Level');
      });

      it('click on add pattern button should show progress and prevent closing until pattern column is added', async () => {

         // given
         data.editable = true;
         let complete: (c: Column) => void;
         patternColumnService.add.mockImplementation((id: string, name: string, onProgress: (count: number) => void) => {
            onProgress(5);
            return new Promise<Column>(resolve => complete = resolve);
         });
         const host = await renderWithSample();
         const columns = scene.columns;

         // when
         host.querySelector<HTMLButtonElement>('.but_add_pattern').click();
         fixture.detectChanges();

         // then
         expect(patternColumnService.add).toHaveBeenCalledWith('1', 'Level', expect.any(Function));
         expect(textsOf(host, '.pattern-progress')).toEqual(['5 rows processed']);
         expect(host.querySelector('mat-progress-bar')).not.toBeNull();
         expect(host.querySelector('koia-dialog-close-button')).toBeNull();
         expect(Array.from(host.querySelectorAll<HTMLButtonElement>('.but_add_pattern')).every(b => b.disabled)).toBe(true);
         expect(dialogRef.disableClose).toBe(true);

         // when
         complete(levelPattern);
         await fixture.whenStable();
         fixture.detectChanges();

         // then
         expect(scene.columns).not.toBe(columns);
         expect(scene.columns.map(c => c.name)).toEqual(['Level', 'Path', 'Amount', 'Time', 'Level pattern']);
         expect(Array.from(host.querySelectorAll('#columns_table .column-name')).map(c => c.firstChild.textContent)).toContain('Level pattern');
         expect(notificationService.onSuccess).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'Pattern column "Level pattern" added');
         expect(host.querySelector('.pattern-progress')).toBeNull();
         expect(host.querySelector('koia-dialog-close-button')).not.toBeNull();
         expect(dialogRef.disableClose).toBe(false);
         expect(addPatternButtonColumns(host)).toEqual(['Path']);
      });

      it('click on add pattern button should notify error and allow closing when pattern column cannot be added', async () => {

         // given
         data.editable = true;
         patternColumnService.add.mockRejectedValue('write failed');
         const host = await renderWithSample();

         // when
         host.querySelector<HTMLButtonElement>('.but_add_pattern').click();
         await fixture.whenStable();
         fixture.detectChanges();

         // then
         expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'write failed');
         expect(scene.columns.map(c => c.name)).toEqual(['Level', 'Path', 'Amount', 'Time']);
         expect(host.querySelector('koia-dialog-close-button')).not.toBeNull();
         expect(dialogRef.disableClose).toBe(false);
         expect(addPatternButtonColumns(host)).toEqual(['Level', 'Path']);
      });

      it('should not offer adding pattern columns while sample is read', () => {

         // given
         data.editable = true;
         patternColumnService.suitableColumnNames.mockReturnValue(new Promise(() => null));

         // when
         const host = render();

         // then
         expect(host.querySelector('.but_add_pattern')).toBeNull();
      });

      it('should notify error and not offer adding pattern columns when sample cannot be read', async () => {

         // given
         data.editable = true;
         patternColumnService.suitableColumnNames.mockRejectedValue('read failed');

         // when
         const host = await renderWithSample();

         // then
         expect(notificationService.onError).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), 'read failed');
         expect(host.querySelector('.but_add_pattern')).toBeNull();
      });

      it('should not fail when closed before sample is read', async () => {

         // given
         data.editable = true;
         let resolve: (names: Set<string>) => void;
         patternColumnService.suitableColumnNames.mockReturnValue(new Promise(r => resolve = r));
         render();

         // when
         fixture.destroy();
         resolve(new Set(['Path']));
         await fixture.whenStable();

         // then
         expect(fixture.componentInstance.suitableColumns).toEqual(new Set(['Path']));
         expect(notificationService.onError).not.toHaveBeenCalled();
      });

      it('should vertically center column cells', () => {

         // when
         const host = render();

         // then
         const cells = Array.from(host.querySelectorAll<HTMLElement>('#columns_table td'));
         expect(cells.map(c => getComputedStyle(c).verticalAlign)).toEqual(cells.map(() => 'middle'));
      });

      it('should keep row height of rows with add pattern button and column icons', async () => {

         // given
         data.editable = true;
         scene.columns.push({
            name: 'Share', dataType: DataType.NUMBER, width: 10, indexed: false,
            computation: { leftColumn: 'Amount', operator: ComputeOperator.PERCENTAGE, rightColumn: 'Amount' }
         }, levelPattern);

         // when
         const host = await renderWithSample();

         // then
         const rows = new Map(Array.from(host.querySelectorAll<HTMLElement>('#columns_table tr.mat-mdc-row'))
            .map(r => [r.querySelector('.column-name').firstChild.textContent, r]));
         expect(rows.get('Path').querySelector('.but_add_pattern')).not.toBeNull();
         expect(['Path', 'Amount', 'Share'].map(name => rows.get(name).offsetHeight)).toEqual([23, 23, 23]);
         expect(rows.get('Level pattern').offsetHeight).toBe(24);
      });

      it('should center icon in add pattern button', async () => {

         // given
         data.editable = true;

         // when
         const host = await renderWithSample();

         // then
         const button = host.querySelector('.but_add_pattern').getBoundingClientRect();
         const icon = host.querySelector('.but_add_pattern mat-icon').getBoundingClientRect();
         expect(Math.abs((icon.top + icon.height / 2) - (button.top + button.height / 2))).toBeLessThanOrEqual(1);
         expect(Math.abs((icon.left + icon.width / 2) - (button.left + button.width / 2))).toBeLessThanOrEqual(1);
      });
   });

   function textRectOf(cell: HTMLElement): DOMRect {
      const range = document.createRange();
      range.selectNodeContents(cell);
      return range.getBoundingClientRect();
   }

   function groupingTimeUnitCell(columnName: string): HTMLElement {
      const rows: HTMLElement[] = Array.from(render().querySelectorAll('#columns_table tr.mat-mdc-row'));
      const row = rows.find(r => r.querySelector('.column-name').textContent === columnName);
      return row.querySelector('.mat-column-groupBy');
   }
});
