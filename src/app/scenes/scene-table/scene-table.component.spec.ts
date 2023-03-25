import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SceneTableComponent } from './scene-table.component';

describe('SceneTableComponent', () => {
  let component: SceneTableComponent;
  let fixture: ComponentFixture<SceneTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SceneTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SceneTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
