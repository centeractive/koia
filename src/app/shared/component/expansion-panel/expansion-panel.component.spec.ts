import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatExpansionModule } from '@angular/material/expansion';
import { ExpansionPanelComponent } from './expansion-panel.component';

describe('ExpansionPanelComponent', () => {

  let component: ExpansionPanelComponent;
  let fixture: ComponentFixture<ExpansionPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExpansionPanelComponent],
      imports: [MatExpansionModule]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpansionPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
