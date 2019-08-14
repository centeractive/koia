import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material';
import { StatusComponent } from './status.component';
import { StatusType, Status } from '../../model';

describe('StatusComponent', () => {

  const status: Status = { type: StatusType.SUCCESS, msg: 'work done' };

  let fixture: ComponentFixture<StatusComponent>;
  let component: StatusComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StatusComponent],
      providers: [
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: { status: status }}
      ]
    })
    fixture = TestBed.createComponent(StatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should retain status', () => {
    expect(component.status).toEqual(status);
  });

  it('should display status message', () => {
    const div: HTMLDivElement = fixture.nativeElement.querySelector('div')
    expect(div).toBeDefined();
    expect(div.innerText).toEqual(status.msg);
  });
});
