import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TicksConfig } from 'app/shared/model/chart';
import { TicksConfigComponent } from './ticks-config.component';

describe('TicksConfigComponent', () => {

  let component: TicksConfigComponent;
  let fixture: ComponentFixture<TicksConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TicksConfigComponent],
      imports: [BrowserAnimationsModule, FormsModule, MatSliderModule, MatFormFieldModule, MatInputModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TicksConfigComponent);
    component = fixture.componentInstance;
    component.title = 'Base Labels...';
    component.ticksConfig = new TicksConfig(() => null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
