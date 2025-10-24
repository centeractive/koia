import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { TicksConfig } from 'app/shared/model/chart';
import { TicksComponent } from './ticks.component';

describe('TicksConfigComponent', () => {

  let component: TicksComponent;
  let fixture: ComponentFixture<TicksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TicksComponent],
      imports: [FormsModule, MatSliderModule, MatFormFieldModule, MatInputModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TicksComponent);
    component = fixture.componentInstance;
    component.ticks = new TicksConfig(() => null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
