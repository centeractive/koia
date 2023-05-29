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
});
