import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { Column, ComputeOperator, DataType } from 'app/shared/model';
import { ComputedColumnService } from 'app/shared/services/computed-column.service';
import { DialogService } from 'app/shared/services/dialog.service';
import { ComputedColumnsMenuComponent } from './computed-columns-menu.component';

@Component({
  template: `
    <button [matMenuTriggerFor]="m.menu">open</button>
    <koia-computed-columns-menu #m [entriesProvider]="entriesProvider" />`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  @ViewChild(MatMenuTrigger, { static: true }) trigger: MatMenuTrigger;
  readonly entries = [{ Amount: 1, Cost: 2 }];
  readonly entriesProvider = (): object[] => this.entries;
}

describe('ComputedColumnsMenuComponent', () => {

  const share: Column = {
    name: 'Share', dataType: DataType.NUMBER, width: 70, indexed: false,
    computation: { leftColumn: 'Amount', operator: ComputeOperator.PERCENTAGE, rightColumn: 'Cost' }
  };
  const total: Column = {
    name: 'Total', dataType: DataType.NUMBER, width: 70, indexed: false,
    computation: { leftColumn: 'Amount', operator: ComputeOperator.ADD, rightColumn: 'Cost' }
  };

  let computedColumnService: { canCreate: ReturnType<typeof vi.fn>, columns: ReturnType<typeof vi.fn> };
  let dialogService: { editComputedColumn: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    computedColumnService = { canCreate: vi.fn().mockReturnValue(true), columns: vi.fn().mockReturnValue([share, total]) };
    dialogService = { editComputedColumn: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      declarations: [HostComponent, ComputedColumnsMenuComponent],
      imports: [MatMenuModule, MatIconModule, MatTooltipModule],
      providers: [
        { provide: ComputedColumnService, useValue: computedColumnService },
        { provide: DialogService, useValue: dialogService }
      ]
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  function openMenu(): void {
    fixture.detectChanges();
    host.trigger.openMenu();
    fixture.detectChanges();
  }

  function newItem(): HTMLButtonElement {
    return document.querySelector('.menu_item_new_computed_column');
  }

  function editItems(): HTMLButtonElement[] {
    return Array.from(document.querySelectorAll('.menu_item_edit_computed_column'));
  }

  function labelOf(item: HTMLButtonElement): string {
    return item.querySelector('mat-icon').textContent.trim() + '|' + item.querySelector('span').textContent.trim();
  }

  it('menu should be bound on first change detection', () => {

    // when
    fixture.detectChanges();

    // then
    const menuComponent: ComputedColumnsMenuComponent = fixture.debugElement.query(By.directive(ComputedColumnsMenuComponent)).componentInstance;
    expect(menuComponent.menu).toBeDefined();
    expect(host.trigger.menu).toBe(menuComponent.menu);
  });

  it('new item should be enabled when computed column can be created', () => {

    // when
    openMenu();

    // then
    expect(newItem().disabled).toBe(false);
    expect(labelOf(newItem())).toBe('add|New Computed Column…');
  });

  it('new item should be disabled when computed column cannot be created', () => {

    // given
    computedColumnService.canCreate.mockReturnValue(false);

    // when
    openMenu();

    // then
    expect(newItem().disabled).toBe(true);
  });

  it('should show one item with formula tooltip per computed column', () => {

    // when
    openMenu();

    // then
    expect(editItems().map(labelOf)).toEqual(['functions|Share', 'functions|Total']);
    const tooltips = fixture.debugElement.queryAll(By.css('.menu_item_edit_computed_column')).map(d => d.injector.get(MatTooltip).message);
    expect(tooltips).toEqual(['Amount as % of Cost', 'Amount + Cost']);
  });

  it('should show no edit item when there is no computed column', () => {

    // given
    computedColumnService.columns.mockReturnValue([]);

    // when
    openMenu();

    // then
    expect(editItems()).toEqual([]);
    expect(newItem()).not.toBeNull();
  });

  it('click on new item should open dialog to create computed column', () => {

    // given
    openMenu();

    // when
    newItem().click();

    // then
    expect(dialogService.editComputedColumn).toHaveBeenCalledWith(host.entries, undefined);
  });

  it('click on edit item should open dialog to edit computed column', () => {

    // given
    openMenu();

    // when
    editItems()[1].click();

    // then
    expect(dialogService.editComputedColumn).toHaveBeenCalledWith(host.entries, total);
  });
});
