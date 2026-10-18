import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataType, Scene, TimeUnit } from 'app/shared/model';
import { SceneFactory, textsOf } from 'app/shared/test';
import { DialogCloseButtonComponent } from 'app/shared/ui/dialog-close-button/dialog-close-button.component';
import { SceneDetailsDialogComponent } from './scene-details-dialog.component';
import { MatCardModule } from '@angular/material/card';

describe('SceneDetailsDialogComponent', () => {

   let scene: Scene;
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
      TestBed.configureTestingModule({
         declarations: [SceneDetailsDialogComponent, DialogCloseButtonComponent],
         imports: [MatCardModule, MatDialogModule, MatIconModule, MatTableModule, MatTooltipModule],
         providers: [
            { provide: MatDialogRef, useValue: { close(): void { } } },
            { provide: MAT_DIALOG_DATA, useValue: scene },
         ]
      })
         .compileComponents();
   }));

   function render(): HTMLElement {
      fixture = TestBed.createComponent(SceneDetailsDialogComponent);
      fixture.detectChanges();
      return fixture.nativeElement;
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
