import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';
import { CategoricalColorScheme, ColorSchemeType, SequentialColorScheme } from 'app/shared/color';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ColorSchemeSelectionComponent } from './color-scheme-selection.component';

describe('ColorSchemeSelectionComponent', () => {

  let context: ChartContext;
  let component: ColorSchemeSelectionComponent;
  let fixture: ComponentFixture<ColorSchemeSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ColorSchemeSelectionComponent],
      imports: [MatSliderModule, MatFormFieldModule, FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorSchemeSelectionComponent);
    component = fixture.componentInstance;
    context = new ChartContext([], ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
    fixture.componentRef.setInput('context', context);
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

  it('#ngOnChanges should copy color options of context', () => {
    expect(component.colorOptions).toEqual(context.colorProvider.options);
    expect(component.colorOptions).not.toBe(context.colorProvider.options);
  });

  it('#selectCategoricalScheme should change color provider and keep opacities', () => {

    // given
    component.colorOptions.bgColorOpacity = 0.5;
    component.colorOptions.borderColorOpacity = 0.25;

    // when
    component.selectCategoricalScheme(CategoricalColorScheme.SET_1);

    // then
    expect(context.colorProvider.options).toEqual({
      type: ColorSchemeType.CATEGORICAL,
      scheme: CategoricalColorScheme.SET_1,
      bgColorOpacity: 0.5,
      borderColorOpacity: 0.25
    });
  });

  it('#selectSequentialScheme should change color provider and keep opacities', () => {

    // given
    component.colorOptions.bgColorOpacity = 0.5;
    component.colorOptions.borderColorOpacity = 0.25;

    // when
    component.selectSequentialScheme(SequentialColorScheme.VIRIDIS);

    // then
    expect(context.colorProvider.options).toEqual({
      type: ColorSchemeType.SEQUENTIAL,
      scheme: SequentialColorScheme.VIRIDIS,
      bgColorOpacity: 0.5,
      borderColorOpacity: 0.25
    });
  });

  it('#changeColorProvider should change color provider and keep scheme', () => {

    // given
    const options = context.colorProvider.options;
    component.colorOptions.bgColorOpacity = 0.3;
    component.colorOptions.borderColorOpacity = 0.6;

    // when
    component.changeColorProvider();

    // then
    expect(context.colorProvider.options).toEqual({
      type: options.type,
      scheme: options.scheme,
      bgColorOpacity: 0.3,
      borderColorOpacity: 0.6
    });
  });
});
