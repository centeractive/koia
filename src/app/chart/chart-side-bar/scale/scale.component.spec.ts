import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { KoiaFormDirective } from 'app/shared/directives/koia-form.directive';
import { ScaleConfig } from 'app/shared/model/chart';
import { ScaleComponent } from './scale.component';
import { TicksComponent } from './ticks/ticks.component';

describe('ScaleComponent', () => {
  let component: ScaleComponent;
  let fixture: ComponentFixture<ScaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScaleComponent, TicksComponent, KoiaFormDirective],
      imports: [FormsModule, MatSliderModule, MatFormFieldModule, MatInputModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ScaleComponent);
    component = fixture.componentInstance;
    component.title = 'Base Scale Labels...';
    component.scale = new ScaleConfig(() => null, { title: 'Units', ticks: {} });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('axis title field should show title of scale', async () => {

    // when
    await fixture.whenStable();

    // then
    expect(titleInput().value).toBe('Units');
  });

  it('typed axis title should be set on scale', async () => {

    // given
    await fixture.whenStable();
    const input = titleInput();

    // when
    input.value = 'Sales';
    input.dispatchEvent(new Event('input'));

    // then
    expect(component.scale.title).toBe('Sales');
  });

  it('axis title field should be outlined', () => {

    // when
    const field: HTMLElement = fixture.nativeElement.querySelector('.field_axis_title');

    // then
    expect(field.classList).toContain('mat-form-field-appearance-outline');
  });

  function titleInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('.field_axis_title input');
  }
});
