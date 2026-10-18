import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SavedViewListComponent } from './saved-view-list.component';

describe('SavedViewListComponent', () => {

  const views = [{ name: 'A', modifiedTime: 1 }, { name: 'B', modifiedTime: 2 }];

  let component: SavedViewListComponent;
  let fixture: ComponentFixture<SavedViewListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SavedViewListComponent],
      imports: [MatButtonModule, MatIconModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SavedViewListComponent);
    component = fixture.componentInstance;
    component.views = views;
    fixture.detectChanges();
  });

  it('should show views', () => {

    // when
    const names = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('#div_saved_views .div_row > span'))
      .map(span => span.firstChild.textContent.trim());

    // then
    expect(names).toEqual(['A', 'B']);
  });

  it('#click on view button should emit selected view', () => {

    // given
    const viewSelectedSpy = vi.spyOn(component.viewSelected, 'emit');
    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('#div_saved_views button');

    // when
    buttons[1].click();

    // then
    expect(viewSelectedSpy).toHaveBeenCalledWith(views[1]);
  });
});
