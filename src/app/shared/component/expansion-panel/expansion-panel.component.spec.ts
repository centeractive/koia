import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExpansionPanelComponent } from './expansion-panel.component';

describe('ExpansionPanelComponent', () => {

  let component: ExpansionPanelComponent;
  let fixture: ComponentFixture<ExpansionPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExpansionPanelComponent],
      imports: [MatExpansionModule, MatButtonModule, MatIconModule, MatTooltipModule]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpansionPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function deleteButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.but_delete_panel');
  }

  function panelExpanded(): boolean {
    return fixture.nativeElement.querySelector('mat-expansion-panel').classList.contains('mat-expanded');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#click on delete button should emit delete without toggling panel', () => {

    // given
    component.deletable = true;
    fixture.detectChanges();
    const deleteSpy = vi.spyOn(component.delete, 'emit');

    // when
    deleteButton().click();
    fixture.detectChanges();

    // then
    expect(deleteSpy).toHaveBeenCalled();
    expect(panelExpanded()).toBe(false);
  });

  it('#keydown enter on delete button should not toggle panel', () => {

    // given
    component.deletable = true;
    fixture.detectChanges();

    // when
    deleteButton().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    // then
    expect(panelExpanded()).toBe(false);
  });
});
