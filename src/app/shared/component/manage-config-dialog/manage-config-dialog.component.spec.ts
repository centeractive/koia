import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { Route } from 'app/shared/model';
import { ConfigRecord } from 'app/shared/model/view-config';
import { ManageConfigContext } from './manage-config-context.type.';
import { ManageConfigDialogComponent } from './manage-config-dialog.component';
import type { Mock } from 'vitest';

describe('ManageConfigDialogComponent', () => {

  let ctx: ManageConfigContext;
  let component: ManageConfigDialogComponent;
  let fixture: ComponentFixture<ManageConfigDialogComponent>;
  let updateConfigRecordsSpy: Mock;

  beforeEach(waitForAsync(() => {
    ctx = context();
    updateConfigRecordsSpy = vi.spyOn(ctx, 'updateConfigRecords').mockReturnValue(undefined);
    TestBed.configureTestingModule({
      declarations: [ManageConfigDialogComponent],
      imports: [FormsModule, MatCardModule, MatButtonModule, MatIconModule],
      providers: [
        { provide: MatDialogRef, useValue: { close(): void { } } },
        { provide: MAT_DIALOG_DATA, useValue: ctx }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageConfigDialogComponent);
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
    expect(button('but_ok').disabled).toBe(true);
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
    expect(button('but_ok').disabled).toBe(false);
  });

  it('butOK#click when config record was deleted', () => {
    // given
    button('butDelete-1').click();
    fixture.detectChanges();

    // when
    button('but_ok').click();

    // then
    expect(updateConfigRecordsSpy).toHaveBeenCalledWith([component.items[1].configRecord], []);
  });

  it('butOK#click when config record was renamed', () => {

    // given
    rename(1, 'X');
    fixture.detectChanges();

    // when
    button('but_ok').click();

    // then
    expect(updateConfigRecordsSpy).toHaveBeenCalledWith([], [component.items[1].configRecord]);
    expect(component.items[1].configRecord.name).toBe('X');
  });

  it('butOK#click when config record was renamed and then deleted', () => {

    // given
    rename(1, 'X');
    button('butDelete-1').click();
    fixture.detectChanges();

    // when
    button('but_ok').click();

    // then
    expect(updateConfigRecordsSpy).toHaveBeenCalledWith([component.items[1].configRecord], []);
  });

  function rename(index: number, name: string): void {
    const input: HTMLInputElement = fixture.debugElement.queryAll(By.css('input'))[index].nativeElement;
    input.value = name;
    input.dispatchEvent(new Event('input'));
  }

  function context(): ManageConfigContext {
    return {
      configRecords: [
        configRecord('A'),
        configRecord('B'),
        configRecord('C')
      ],
      updateConfigRecords: () => null
    };
  }

  function configRecord(name: string): ConfigRecord {
    return {
      route: Route.PIVOT,
      name,
      modifiedTime: null,
      query: null,
      data: null
    };
  }

  function button(id: string): HTMLButtonElement {
    return fixture.debugElement.query(By.css('#' + id)).nativeElement;
  }

  function leanItems(): { name: string, deleted: boolean }[] {
    return component.items.map(item => ({
      name: item.configRecord.name,
      deleted: item.deleted
    }));
  }

});
