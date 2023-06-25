import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { FormattedFloatDirective } from 'app/shared/directives/formatted-float.directive';
import { FormattedIntegerDirective } from 'app/shared/directives/formatted-integer.directive';
import { TextareaMaxRowsDirective } from 'app/shared/directives/textarea-max-rows.directive';
import { TrialComponent } from './trial.component';

xdescribe('TrialComponent', () => {
  let component: TrialComponent;
  let fixture: ComponentFixture<TrialComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TrialComponent, FormattedIntegerDirective, FormattedFloatDirective, TextareaMaxRowsDirective],
      imports: [MatCardModule]
    });
    fixture = TestBed.createComponent(TrialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
