import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DraggableColumnComponent } from './draggable-column.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { Column, DataType, ElementContext, TimeUnit } from 'app/shared/model';
import { GraphContext } from 'app/shared/model/graph';

describe('DraggableColumnComponent', () => {
  let component: DraggableColumnComponent;
  let fixture: ComponentFixture<DraggableColumnComponent>;
  let column: Column;
  let context: ElementContext;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DraggableColumnComponent],
      imports: [MatIconModule, MatMenuModule]
    });
    fixture = TestBed.createComponent(DraggableColumnComponent);
    component = fixture.componentInstance;
    column = { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE, indexed: true };
    context = context = new GraphContext([column]);
    component.column = column;
    component.context = context;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it.each([TimeUnit.DAY, undefined])('#groupingTimeUnitChanged should set time unit %s and fire structure change', timeUnit => {

    // given
    vi.spyOn(context, 'fireStructureChanged');

    // when
    component.groupingTimeUnitChanged(timeUnit);

    // then
    expect(column.groupingTimeUnit).toBe(timeUnit);
    expect(context.fireStructureChanged).toHaveBeenCalled();
  });

  it('#groupingTimeUnitKey should return per key for time unit', () => {

    // when
    const key = component.groupingTimeUnitKey(TimeUnit.HOUR);

    // then
    expect(key).toBe('ui.per.hour');
  });

  it('menu item for undefined time unit should show not grouped', () => {

    // given
    const trigger: HTMLElement = fixture.nativeElement.querySelector('.select_time_unit > span');

    // when
    trigger.click();
    fixture.detectChanges();

    // then
    const menuItems = Array.from(document.querySelectorAll<HTMLButtonElement>('button[mat-menu-item]'));
    expect(menuItems.length).toBe(component.selectableTimeUnits.length);
    expect(menuItems[0].textContent.trim()).toBe('not grouped');
  });
});
