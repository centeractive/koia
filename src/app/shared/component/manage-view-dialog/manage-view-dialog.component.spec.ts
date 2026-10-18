import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { Route } from 'app/shared/model';
import { View } from 'app/shared/model/view-config';
import { ManageViewContext } from './manage-view-context.type';
import { ManageViewDialogComponent } from './manage-view-dialog.component';
import type { Mock } from 'vitest';

describe('ManageViewDialogComponent', () => {

  let ctx: ManageViewContext;
  let component: ManageViewDialogComponent;
  let fixture: ComponentFixture<ManageViewDialogComponent>;
  let updateViewsSpy: Mock;
  let closeSpy: Mock;

  beforeEach(waitForAsync(() => {
    ctx = context();
    updateViewsSpy = vi.spyOn(ctx, 'updateViews').mockReturnValue(undefined);
    TestBed.configureTestingModule({
      declarations: [ManageViewDialogComponent],
      imports: [FormsModule, MatCardModule, MatButtonModule, MatIconModule],
      providers: [
        { provide: MatDialogRef, useValue: { close(): void { } } },
        { provide: MAT_DIALOG_DATA, useValue: ctx }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<ManageViewDialogComponent>(ManageViewDialogComponent);
    component = fixture.componentInstance;
    closeSpy = vi.spyOn(component.dialogRef, 'close');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize', () => {
    expect(leanItems()).toEqual([
      {
        name: 'A',
        deleted: false
      },
      {
        name: 'B',
        deleted: false
      },
      {
        name: 'C',
        deleted: false
      }
    ]);
    expect(button('but_ok').disabled).toBe(true);
  });

  it('butDelete#click', () => {

    // when
    button('butDelete-1').click();

    // then
    expect(leanItems()).toEqual([
      {
        name: 'A',
        deleted: false
      },
      {
        name: 'B',
        deleted: true
      },
      {
        name: 'C',
        deleted: false
      }
    ]);
    fixture.detectChanges();
    expect(button('but_ok').disabled).toBe(false);
  });

  it('butOK#click when view was deleted', () => {
    // given
    button('butDelete-1').click();
    fixture.detectChanges();

    // when
    button('but_ok').click();

    // then
    expect(updateViewsSpy).toHaveBeenCalledWith([component.items[1].view], []);
  });

  it('butOK#click when view was renamed', () => {

    // given
    rename(1, 'X');
    fixture.detectChanges();

    // when
    button('but_ok').click();

    // then
    expect(updateViewsSpy).toHaveBeenCalledWith([], [component.items[1].view]);
    expect(component.items[1].view.name).toBe('X');
  });

  it('butOK#click should not rename view when view was renamed and then deleted', () => {

    // given
    rename(1, 'X');
    button('butDelete-1').click();
    fixture.detectChanges();

    // when
    button('but_ok').click();

    // then
    expect(updateViewsSpy).toHaveBeenCalledWith([ctx.views[1]], []);
    expect(ctx.views[1].name).toBe('B');
  });

  it('butOK#click should apply trimmed name when view was renamed', () => {

    // given
    rename(1, '  X  ');
    fixture.detectChanges();

    // when
    button('but_ok').click();

    // then
    expect(updateViewsSpy).toHaveBeenCalledWith([], [ctx.views[1]]);
    expect(ctx.views[1].name).toBe('X');
  });

  it('butOK#click should allow name of deleted view to be reused', () => {

    // given
    rename(1, 'A');
    button('butDelete-0').click();
    fixture.detectChanges();

    // when
    button('but_ok').click();

    // then
    const [viewA, viewB] = ctx.views;
    expect(updateViewsSpy).toHaveBeenCalledWith([viewA], [viewB]);
    expect(viewB.name).toBe('A');
  });

  it('butCancel#click should keep view names when view was renamed', () => {

    // given
    rename(1, 'X');
    fixture.detectChanges();

    // when
    button('but_cancel').click();

    // then
    expect(updateViewsSpy).not.toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
    expect(ctx.views.map(v => v.name)).toEqual(['A', 'B', 'C']);
  });

  it('should disable OK when name is blank', () => {

    // when
    rename(1, '  ');
    fixture.detectChanges();

    // then
    expect(component.changed).toBe(true);
    expect(button('but_ok').disabled).toBe(true);
  });

  it('should disable OK when names are duplicate', () => {

    // when
    rename(1, 'A ');
    fixture.detectChanges();

    // then
    expect(component.changed).toBe(true);
    expect(button('but_ok').disabled).toBe(true);
  });

  function rename(index: number, name: string): void {
    const input: HTMLInputElement = fixture.debugElement.queryAll(By.css('input'))[index].nativeElement;
    input.value = name;
    input.dispatchEvent(new Event('input'));
  }

  function context(): ManageViewContext {
    return {
      views: [
        view('A'),
        view('B'),
        view('C')
      ],
      updateViews: () => null
    }
  }

  function view(name: string): View {
    return {
      route: Route.FLEX,
      name,
      modifiedTime: Date.now(),
      query: null,
      gridColumns: null,
      gridCellRatio: null,
      elements: []
    };
  }

  function button(id: string): HTMLButtonElement {
    return fixture.debugElement.query(By.css('#' + id)).nativeElement;
  }

  function leanItems(): { name: string, deleted: boolean }[] {
    return component.items.map(item => ({
      name: item.name,
      deleted: item.deleted
    }));
  }
});
