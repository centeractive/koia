import { CdkDrag, CdkDragHandle, DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { ElementContext, ExportFormat, SummaryContext } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { MatIconModuleMock } from 'app/shared/test';
import { GridLayout } from '../grid-layout';
import { ElementHeaderComponent } from './element-header.component';

@Component({
  template: `<div cdkDrag><koia-element-header [context]="context" [gridLayout]="gridLayout" [movable]="true" /></div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  @ViewChild(CdkDrag) drag: CdkDrag;
  context: ElementContext = new SummaryContext([]);
  gridLayout: GridLayout = null;
}

describe('ElementHeaderComponent', () => {

  let fixture: ComponentFixture<ElementHeaderComponent>;
  let component: ElementHeaderComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [ElementHeaderComponent, HostComponent],
      imports: [MatMenuModule, MatButtonModule, MatIconModule, DragDropModule]
    })
      .overrideModule(MatIconModule, MatIconModuleMock.override());
    fixture = TestBed.createComponent(ElementHeaderComponent);
    component = fixture.componentInstance;
  });

  function render(context: ElementContext, gridLayout: GridLayout, movable = false): void {
    component.context = context;
    component.gridLayout = gridLayout;
    component.movable = movable;
    fixture.detectChanges();
  }

  function query(selector: string): HTMLElement {
    return fixture.debugElement.query(By.css(selector))?.nativeElement;
  }

  function openMoreMenu(): void {
    query('.but_more').click();
    fixture.detectChanges();
  }

  function menuItems(selector: string): HTMLButtonElement[] {
    return Array.from(document.querySelectorAll<HTMLButtonElement>(selector));
  }

  it('should show more button when grid layout is present', () => {

    // when
    render(new GraphContext([]), new GridLayout());

    // then
    expect(query('.but_more')).toBeTruthy();
  });

  it('should show more button when element supports export formats', () => {

    // when
    render(new SummaryContext([]), null);

    // then
    expect(query('.but_more')).toBeTruthy();
  });

  it('should hide more button when neither grid layout nor export formats exist', () => {

    // when
    render(new GraphContext([]), null);

    // then
    expect(query('.but_more')).toBeFalsy();
  });

  it('should show span menu items when grid layout is present', () => {

    // given
    render(new SummaryContext([]), new GridLayout());

    // when
    openMoreMenu();

    // then
    expect(menuItems('.menu_item_column_span').length).toBe(1);
    expect(menuItems('.menu_item_row_span').length).toBe(1);
  });

  it('should hide span menu items when grid layout is missing', () => {

    // given
    render(new SummaryContext([]), null);

    // when
    openMoreMenu();

    // then
    expect(menuItems('.menu_item_column_span').length).toBe(0);
    expect(menuItems('.menu_item_save_as').length).toBe(new SummaryContext([]).getSupportedExportFormats().length);
  });

  it('should change column span when column span menu item is selected', () => {

    // given
    const context = new SummaryContext([]);
    render(context, new GridLayout());
    openMoreMenu();
    menuItems('.menu_item_column_span')[0].click();
    fixture.detectChanges();

    // when
    menuItems('.menu_item_span')[2].click();

    // then
    expect(context.gridColumnSpan).toBe(3);
  });

  it('should change row span when row span menu item is selected', () => {

    // given
    const context = new SummaryContext([]);
    render(context, new GridLayout());
    openMoreMenu();
    menuItems('.menu_item_row_span')[0].click();
    fixture.detectChanges();

    // when
    menuItems('.menu_item_span')[3].click();

    // then
    expect(context.gridRowSpan).toBe(4);
  });

  it('should offer row spans of grid layout', () => {

    // when
    render(new SummaryContext([]), new GridLayout());

    // then
    expect(component.rowSpans).toEqual(GridLayout.ROW_SPANS);
  });

  it('should emit save as when export menu item is selected', () => {

    // given
    render(new SummaryContext([]), null);
    const saveAsSpy = vi.spyOn(component.saveAs, 'emit');
    openMoreMenu();

    // when
    menuItems('.menu_item_save_as')[0].click();

    // then
    expect(saveAsSpy).toHaveBeenCalledWith(new SummaryContext([]).getSupportedExportFormats()[0] as ExportFormat);
  });

  it('should emit configure when configure button is clicked', () => {

    // given
    render(new SummaryContext([]), null);
    const configureSpy = vi.spyOn(component.configure, 'emit');

    // when
    query('#configButton').click();

    // then
    expect(configureSpy).toHaveBeenCalledWith(expect.any(MouseEvent));
  });

  it('should emit remove when delete button is clicked', () => {

    // given
    render(new SummaryContext([]), null);
    const removeSpy = vi.spyOn(component.remove, 'emit');

    // when
    query('.but_close').click();

    // then
    expect(removeSpy).toHaveBeenCalled();
  });

  it('should emit title change when title is typed', () => {

    // given
    render(new SummaryContext([]), null);
    const titleChangeSpy = vi.spyOn(component.titleChange, 'emit');
    const textarea = query('.textarea_title') as HTMLTextAreaElement;
    textarea.value = 'New Title';

    // when
    textarea.dispatchEvent(new KeyboardEvent('keyup'));

    // then
    expect(titleChangeSpy).toHaveBeenCalledWith('New Title');
  });

  it('should toggle resizable chart margin when margin button is clicked', () => {

    // given
    const context = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
    render(context, null);

    // when
    query('#marginButton').click();

    // then
    expect(context.isShowResizableMargin()).toBe(true);
  });

  it('should hide margin button when context is no chart', () => {

    // when
    render(new SummaryContext([]), null);

    // then
    expect(query('#marginButton')).toBeFalsy();
    expect(component.chartContext()).toBeUndefined();
  });

  it('should show warning when context has warning', () => {

    // given
    const context = new SummaryContext([]);
    context.warning = 'too many values';

    // when
    render(context, null);

    // then
    expect(query('.but_warning')).toBeTruthy();
  });

  it('should hide move button when element is not movable', () => {

    // when
    render(new SummaryContext([]), null, false);

    // then
    expect(query('.but_move')).toBeFalsy();
  });

  it('should register move button as drag handle of enclosing drag element', () => {

    // given
    const hostFixture = TestBed.createComponent(HostComponent);

    // when
    hostFixture.detectChanges();

    // then
    const handle = hostFixture.debugElement.query(By.directive(CdkDragHandle)).injector.get(CdkDragHandle);
    expect(handle['_parentDrag']).toBe(hostFixture.componentInstance.drag);
  });
});
