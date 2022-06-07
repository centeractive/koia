import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CategoricalColorScheme, SequentialColorScheme } from 'app/shared/color';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ColorSchemeSelectionComponent } from './color-scheme-selection.component';

fdescribe('ColorSchemeSelectionComponent', () => {
  let component: ColorSchemeSelectionComponent;
  let fixture: ComponentFixture<ColorSchemeSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ColorSchemeSelectionComponent],
      imports: [MatSlideToggleModule, MatFormFieldModule, BrowserAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorSchemeSelectionComponent);
    component = fixture.componentInstance;
    component.context = new ChartContext([], ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize categorical color schemes', () => {
    expect(component.categoricalSchemes).toEqual([
      CategoricalColorScheme.ACCENT,
      CategoricalColorScheme.CATEGORY_10,
      CategoricalColorScheme.DARK_2,
      CategoricalColorScheme.PAIRED,
      CategoricalColorScheme.PASTEL_1,
      CategoricalColorScheme.PASTEL_2,
      CategoricalColorScheme.SET_1,
      CategoricalColorScheme.SET_2,
      CategoricalColorScheme.SET_3,
      CategoricalColorScheme.TABLEAU_10
    ]);
  });

  it('should initialize sequential color schemes', () => {
    expect(component.sequentialSchemes).toEqual([
      SequentialColorScheme.COOL,
      SequentialColorScheme.INFERNO,
      SequentialColorScheme.PLASMA,
      SequentialColorScheme.RAINBOW,
      SequentialColorScheme.SINEBOW,
      SequentialColorScheme.SPECTRAL,
      SequentialColorScheme.TURBO,
      SequentialColorScheme.VIRIDIS,
      SequentialColorScheme.WARM
    ]);
  });
});
