import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ScaleConfig } from 'app/shared/model/chart';
import { ScaleComponent } from './scale.component';
import { TicksComponent } from './ticks/ticks.component';

describe('ScaleComponent', () => {
  let component: ScaleComponent;
  let fixture: ComponentFixture<ScaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScaleComponent, TicksComponent],
      imports: [BrowserAnimationsModule, FormsModule, MatSliderModule, MatFormFieldModule, MatInputModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ScaleComponent);
    component = fixture.componentInstance;
    component.title = 'Base Scale Labels...';
    component.scale = new ScaleConfig(() => null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
