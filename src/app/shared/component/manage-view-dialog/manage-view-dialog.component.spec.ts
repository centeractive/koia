import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { Route } from 'app/shared/model';
import { View } from 'app/shared/model/view-config';
import { ManageViewContext } from './manage-view-context.type.';
import { ManageViewDialogComponent } from './manage-view-dialog.component';

describe('ManageViewDialogComponent', () => {

  let ctx: ManageViewContext;
  let component: ManageViewDialogComponent;
  let fixture: ComponentFixture<ManageViewDialogComponent>;
  let updateViewsSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    ctx = context();
    updateViewsSpy = spyOn(ctx, 'updateViews');
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
    fixture = TestBed.createComponent(ManageViewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize', () => {
    expect(leanItems()).toEqual([
      {
        name: 'A',
        deleted: undefined
      },
      {
        name: 'B',
        deleted: undefined
      },
      {
        name: 'C',
        deleted: undefined
      }
    ]);
    expect(button('but_ok').disabled).toBeTrue();
  });

  it('butDelete#click', () => {

    // when
    button('butDelete-1').click();

    // then
    expect(leanItems()).toEqual([
      {
        name: 'A',
        deleted: undefined
      },
      {
        name: 'B',
        deleted: true
      },
      {
        name: 'C',
        deleted: undefined
      }
    ]);
    fixture.detectChanges();
    expect(button('but_ok').disabled).toBeFalse();
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
      name: item.view.name,
      deleted: item.deleted
    }));
  }
});
