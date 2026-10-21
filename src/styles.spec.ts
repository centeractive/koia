import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSidenavModule } from '@angular/material/sidenav';
import { KoiaFormDirective } from 'app/shared/directives/koia-form.directive';
import { findPageRule, findStyleRule } from 'app/shared/test';
import { TABLE_FONT_FAMILY, TABLE_FONT_SIZE } from 'app/shared/ui/table-fit/table-font';
import { DEFAULT_BORDER_COLOR } from 'app/text-box/text-box-style';

@Component({
  template: `
    <mat-sidenav-container style="height: 200px; width: 300px">
      <mat-sidenav-content>
        <div class="div_header"><div style="margin-top: 2px; height: 40px">h</div></div>
        <div class="div_content"><div style="width: 600px; height: 1000px"></div></div>
      </mat-sidenav-content>
    </mat-sidenav-container>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class SidenavHostComponent { }

@Component({
  template: `
    <div koiaForm style="--mat-app-elevation-shadow-level-1: rgb(1, 2, 3) 0px 1px 3px 0px"><mat-accordion multi="true">
      <mat-expansion-panel id="panel_a" expanded="true"><mat-expansion-panel-header><mat-panel-title><h4>A</h4></mat-panel-title></mat-expansion-panel-header>a</mat-expansion-panel>
      <mat-expansion-panel id="panel_b" expanded="true"><mat-expansion-panel-header><mat-panel-title><h4>B</h4></mat-panel-title></mat-expansion-panel-header><div class="field-row">b</div></mat-expansion-panel>
    </mat-accordion></div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class PanelHostComponent { }

@Component({
  template: `
    <div koiaForm>
      <div id="narrow_row" class="field-row" style="width: 400px"><div style="flex: 0 0 300px">1</div><div style="flex: 0 0 300px">2</div></div>
      <div id="wide_row" class="field-row" style="width: 700px"><div style="flex: 0 0 300px">1</div><div style="flex: 0 0 300px">2</div></div>
      <span class="step">1</span>
    </div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class FieldRowHostComponent { }

@Component({
  template: `
    <div>
      <button id="toggle" mat-icon-button class="koia-toggle-active">x</button>
      <span id="separator" class="koia-toolbar-separator"></span>
      <span id="trigger" class="span_menu_trigger">a</span>
      <span id="outside" class="span_outside_range_menu_trigger">b</span>
    </div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class ToggleHostComponent { }

@Component({
  template: `
    <div class="div_column_list cdk-drop-list-dragging">
      <div id="item_a" class="div_column_item">a</div>
      <div id="item_b" class="div_column_item">b</div>
    </div>
    <div id="preview" class="div_group_value cdk-drag-preview">p</div>
    <div id="placeholder" class="div_column_item cdk-drag-placeholder">h</div>`,
  styles: ['.div_column_item { border-bottom: 1px solid red; }'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class DragHostComponent { }

describe('global styles', () => {

  async function createSidenavHost(): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      declarations: [SidenavHostComponent],
      imports: [MatSidenavModule]
    });
    const fixture = TestBed.createComponent(SidenavHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('mat-sidenav-content should stack header above content without scrolling itself', async () => {

    // when
    const content: HTMLElement = (await createSidenavHost()).querySelector('mat-sidenav-content');

    // then
    const style = getComputedStyle(content);
    expect(style.display).toBe('flex');
    expect(style.flexDirection).toBe('column');
    expect(style.overflowX).toBe('hidden');
    expect(style.overflowY).toBe('hidden');
    expect(content.scrollHeight).toBe(content.clientHeight);
    expect(content.scrollWidth).toBe(content.clientWidth);
  });

  it('mat-sidenav-content should be grey canvas', async () => {

    // when
    const host = await createSidenavHost();

    // then
    expect(getComputedStyle(host.querySelector('mat-sidenav-content')).backgroundColor).toBe('rgb(236, 239, 241)');
  });

  it('header should be tinted surface above content with shadow and bottom line', async () => {

    // when
    const host = await createSidenavHost();

    // then
    const style = getComputedStyle(host.querySelector('.div_header'));
    expect(style.position).toBe('relative');
    expect(style.zIndex).toBe('2');
    expect(style.backgroundColor).toBe('rgb(232, 234, 246)');
    expect(style.boxShadow).toBe('rgba(0, 0, 0, 0.2) 0px 2px 4px 0px');
    expect(style.borderBottomWidth).toBe('1px');
    expect(style.borderBottomColor).toBe('rgb(197, 202, 233)');
  });

  it('header should start at top of sidenav content despite child margin', async () => {

    // when
    const host = await createSidenavHost();

    // then
    const content: HTMLElement = host.querySelector('mat-sidenav-content');
    const header: HTMLElement = host.querySelector('.div_header');
    expect(header.getBoundingClientRect().top).toBe(content.getBoundingClientRect().top);
  });

  it('content should fill sidenav content below header and scroll', async () => {

    // when
    const host = await createSidenavHost();

    // then
    const sidenavContent: HTMLElement = host.querySelector('mat-sidenav-content');
    const header: HTMLElement = host.querySelector('.div_header');
    const divContent: HTMLElement = host.querySelector('.div_content');
    expect(divContent.getBoundingClientRect().top).toBe(header.getBoundingClientRect().bottom);
    expect(divContent.offsetHeight).toBe(sidenavContent.clientHeight - header.offsetHeight);
    expect(divContent.scrollHeight).toBeGreaterThan(divContent.clientHeight);
  });

  it('header should stay at top when content is scrolled', async () => {

    // given
    const host = await createSidenavHost();
    const sidenavContent: HTMLElement = host.querySelector('mat-sidenav-content');
    const header: HTMLElement = host.querySelector('.div_header');
    const divContent: HTMLElement = host.querySelector('.div_content');

    // when
    divContent.scrollTop = 300;

    // then
    expect(divContent.scrollTop).toBe(300);
    expect(sidenavContent.scrollTop).toBe(0);
    expect(header.getBoundingClientRect().top).toBe(sidenavContent.getBoundingClientRect().top);
  });

  it('print styles should lay out sidenav content as block', () => {

    // when
    const rule = findStyleRule(Array.from(document.styleSheets), 'mat-sidenav-content.mat-drawer-content', 'print');

    // then
    expect(rule).toBeDefined();
    expect(rule.style.display).toBe('block');
    expect(rule.style.getPropertyPriority('display')).toBe('important');
  });

  it('print styles should keep dashboard tiles on one page', () => {

    // when
    const rule = findStyleRule(Array.from(document.styleSheets), '.div_element', 'print');

    // then
    expect(rule).toBeDefined();
    expect(rule.style.breakInside).toBe('avoid');
    expect(rule.style.getPropertyPriority('break-inside')).toBe('important');
  });

  it('print styles should print canvas as wide as its print width, unshifted', () => {

    // when
    const rule = findStyleRule(Array.from(document.styleSheets), '.div_canvas_pages', 'print');

    // then
    expect(rule.style.maxWidth).toBe('calc(var(--koia-print-width) / var(--koia-print-zoom, 1))');
    expect(rule.style.width).toBe('auto');
    expect(rule.style.margin).toBe('0px');
    expect(['max-width', 'width', 'margin-left', 'margin-top'].map(p => rule.style.getPropertyPriority(p))).toEqual(['important', 'important', 'important', 'important']);
  });

  it('print styles should cut canvas page content at page bottom and print sheets without gap and shadow', () => {

    // when
    const rule = findStyleRule(Array.from(document.styleSheets), '.div_canvas_page', 'print');

    // then
    expect(rule.style.overflow).toBe('hidden');
    expect(rule.style.margin).toBe('0px');
    expect(rule.style.boxShadow).toBe('none');
    expect(['overflow', 'margin-bottom', 'box-shadow'].map(p => rule.style.getPropertyPriority(p))).toEqual(['important', 'important', 'important']);
  });

  it('print styles should print each canvas page on a new sheet', () => {

    // when
    const rule = findStyleRule(Array.from(document.styleSheets), '.div_canvas_page + .div_canvas_page', 'print');

    // then
    expect(rule.style.breakBefore).toBe('page');
    expect(rule.style.borderTop).toBe('');
  });

  it('print styles should hide spare page', () => {

    // when
    const rule = findStyleRule(Array.from(document.styleSheets), '.div_canvas_page_spare', 'print');

    // then
    expect(rule.style.display).toBe('none');
    expect(rule.style.getPropertyPriority('display')).toBe('important');
  });

  it('print styles should hide view heading of canvas sheets carrying their own heading', () => {

    // when
    const rule = findStyleRule(Array.from(document.styleSheets), 'koia-print-heading.koia-print-heading-in-sheets', 'print');

    // then
    expect(rule.style.display).toBe('none');
    expect(rule.style.getPropertyPriority('display')).toBe('important');
  });

  it.each([
    { orientation: 'landscape', size: 'a4 landscape' },
    { orientation: 'portrait', size: 'a4' }
  ])('print styles should print $orientation sheets on A4 paper without page margins', ({ orientation, size }) => {

    // when
    const pageRule = findPageRule(Array.from(document.styleSheets), 'print', 'koia-sheet-' + orientation);
    const bodyRule = findStyleRule(Array.from(document.styleSheets), 'html.koia-print-sheet-' + orientation + ' body', 'print');

    // then
    expect(pageRule.style.getPropertyValue('size')).toBe(size);
    expect(pageRule.style.getPropertyValue('margin')).toBe('0px');
    expect(bodyRule.style.getPropertyValue('page')).toBe('koia-sheet-' + orientation);
  });

  it('print styles should hide resize handles', () => {

    // when
    const rule = findStyleRule(Array.from(document.styleSheets), 'koia-resize-handles', 'print');

    // then
    expect(rule.style.getPropertyValue('display')).toBe('none');
    expect(rule.style.getPropertyPriority('display')).toBe('important');
  });

  it('print styles should hide selection outline', () => {

    // when
    const rule = findStyleRule(Array.from(document.styleSheets), '.div_tile_selected', 'print');

    // then
    expect(rule.style.getPropertyValue('outline')).toBe('none');
    expect(rule.style.getPropertyPriority('outline')).toBe('important');
  });

  it('print styles should print canvas sheets without desk', () => {

    // when
    const rule = findStyleRule(Array.from(document.styleSheets), '#div_canvas.div_canvas_desk', 'print');

    // then
    expect(rule.style.getPropertyValue('padding')).toBe('0px');
    expect(rule.style.getPropertyPriority('padding')).toBe('important');
    expect(rule.style.getPropertyValue('background')).toBe('none');
    expect(rule.style.getPropertyPriority('background')).toBe('important');
  });

  it.each([
    { selector: '.div_canvas_sheet_header', property: 'gap', value: 'calc(14 * var(--koia-pu))' },
    { selector: '.div_canvas_sheet_header', property: 'padding-bottom', value: 'calc(8 * var(--koia-pu))' },
    { selector: '.div_canvas_sheet_header img', property: 'height', value: 'calc(40 * var(--koia-pu))' },
    { selector: '.div_canvas_sheet_header .span_print_title', property: 'font-size', value: 'calc(26 * var(--koia-pu))' },
    { selector: '.div_canvas_sheet_header .span_print_details', property: 'font-size', value: 'calc(16 * var(--koia-pu))' },
    { selector: '.div_canvas_sheet_footer', property: 'font-size', value: 'calc(16 * var(--koia-pu))' },
    { selector: '.div_canvas_sheet_footer', property: 'justify-content', value: 'flex-end' }
  ])('$selector should define $property as printed', ({ selector, property, value }) => {

    // when
    const rule = findStyleRule(Array.from(document.styleSheets), selector);

    // then
    expect(rule.style.getPropertyValue(property)).toBe(value);
  });

  function createPanelHost(): HTMLElement {
    TestBed.configureTestingModule({
      declarations: [KoiaFormDirective, PanelHostComponent],
      imports: [MatExpansionModule]
    });
    const fixture = TestBed.createComponent(PanelHostComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function createFieldRowHost(): HTMLElement {
    TestBed.configureTestingModule({
      declarations: [KoiaFormDirective, FieldRowHostComponent]
    });
    const fixture = TestBed.createComponent(FieldRowHostComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function childRectsOf(row: HTMLElement): DOMRect[] {
    return Array.from(row.children).map(c => c.getBoundingClientRect());
  }

  it('expansion panels inside koia-form should be white with rounded tile border', () => {

    // when
    const style = getComputedStyle(createPanelHost().querySelector('#panel_a'));

    // then
    expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(style.borderTopLeftRadius).toBe('10px');
    expect(style.borderTopWidth).toBe('1px');
    expect(style.borderTopColor).toBe('rgb(224, 224, 224)');
  });

  it('expansion panels inside koia-form should have dashboard tile shadow', () => {

    // when
    const style = getComputedStyle(createPanelHost().querySelector('#panel_a'));

    // then
    expect(style.boxShadow).toBe('rgb(1, 2, 3) 0px 1px 3px 0px');
  });

  it('expansion panels inside koia-form should be separated by gap', () => {

    // given
    const host = createPanelHost();
    const panelA: HTMLElement = host.querySelector('#panel_a');
    const panelB: HTMLElement = host.querySelector('#panel_b');

    // when
    const gap = panelB.getBoundingClientRect().top - panelA.getBoundingClientRect().bottom;

    // then
    expect(panelA.classList).toContain('mat-expansion-panel-spacing');
    expect(panelB.classList).toContain('mat-expansion-panel-spacing');
    expect(gap).toBeCloseTo(12, 0);
  });

  it('last field row in panel body inside koia-form should have no bottom margin', () => {

    // when
    const style = getComputedStyle(createPanelHost().querySelector('#panel_b .field-row'));

    // then
    expect(style.marginTop).toBe('12px');
    expect(style.marginBottom).toBe('0px');
  });

  it('expanded panel header inside koia-form should be compact', () => {

    // when
    const panel: HTMLElement = createPanelHost().querySelector('#panel_a');

    // then
    expect(panel.querySelector<HTMLElement>('.mat-expansion-panel-header').offsetHeight).toBe(56);
    expect(getComputedStyle(panel.querySelector('h4')).marginTop).toBe('0px');
  });

  it('field row inside koia-form should wrap children that do not fit', () => {

    // given
    const row: HTMLElement = createFieldRowHost().querySelector('#narrow_row');

    // when
    const [first, second] = childRectsOf(row);

    // then
    expect(second.top).toBeGreaterThan(first.bottom);
    expect(getComputedStyle(row).marginTop).toBe('12px');
  });

  it('field row inside koia-form should separate fitting children by gap', () => {

    // when
    const [first, second] = childRectsOf(createFieldRowHost().querySelector('#wide_row'));

    // then
    expect(second.top).toBe(first.top);
    expect(second.left - first.right).toBeCloseTo(16, 0);
  });

  it('step inside koia-form should be round primary badge', () => {

    // when
    const step: HTMLElement = createFieldRowHost().querySelector('.step');

    // then
    const style = getComputedStyle(step);
    expect(step.offsetWidth).toBe(22);
    expect(step.offsetHeight).toBe(22);
    expect(style.borderTopLeftRadius).toBe('50%');
    expect(style.backgroundColor).toBe('rgb(48, 63, 159)');
  });

  function createToggleHost(): HTMLElement {
    TestBed.configureTestingModule({
      declarations: [ToggleHostComponent],
      imports: [MatButtonModule]
    });
    const fixture = TestBed.createComponent(ToggleHostComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function createDragHost(): HTMLElement {
    TestBed.configureTestingModule({
      declarations: [DragHostComponent]
    });
    const fixture = TestBed.createComponent(DragHostComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function styleOf(host: HTMLElement, selector: string): CSSStyleDeclaration {
    return getComputedStyle(host.querySelector(selector));
  }

  it('root should define koia design tokens', () => {

    // when
    const style = getComputedStyle(document.documentElement);

    // then
    expect(style.getPropertyValue('--koia-primary').trim()).toBe('#303f9f');
    expect(style.getPropertyValue('--koia-accent').trim()).toBe('#388e3c');
    expect(style.getPropertyValue('--koia-border-color').trim()).toBe('#e0e0e0');
    expect(style.getPropertyValue('--koia-toolbar-height').trim()).toBe('48px');
    expect(style.getPropertyValue('--koia-tile-header-height').trim()).toBe('48px');
    expect(style.getPropertyValue('--koia-canvas').trim()).toBe('#eceff1');
    expect(style.getPropertyValue('--koia-desk').trim()).toBe('#d9dce1');
    expect(style.getPropertyValue('--koia-header-shadow').trim()).toBe('0 2px 4px rgba(0, 0, 0, 0.2)');
    expect(style.getPropertyValue('--koia-header-surface').trim()).toBe('#e8eaf6');
    expect(style.getPropertyValue('--koia-header-border').trim()).toBe('#c5cae9');
    expect(style.getPropertyValue('--koia-header-line').trim()).toBe('1px solid #c5cae9');
    expect(style.getPropertyValue('--koia-hover-tint').trim()).toBe('rgba(48, 63, 159, 0.1)');
    expect(style.getPropertyValue('--koia-primary-dark').trim()).toBe('#1a237e');
    expect(style.getPropertyValue('--koia-table-font-family').replace(/\s+/g, ' ').trim()).toBe(TABLE_FONT_FAMILY);
    expect(style.getPropertyValue('--koia-table-font-size').trim()).toBe(TABLE_FONT_SIZE + 'px');
    expect(style.getPropertyValue('--koia-table-line-height').trim()).toBe('16px');
    expect(style.getPropertyValue('--koia-table-cell-padding').trim()).toBe('3px 6px');
    expect(style.getPropertyValue('--koia-table-header-surface').trim()).toBe('#f5f6f8');
    expect(style.getPropertyValue('--koia-table-grid-line').trim()).toBe('1px solid #e0e0e0');
    expect(style.getPropertyValue('--koia-table-total-line').trim()).toBe('2px solid #8a94a6');
    expect(style.getPropertyValue('--koia-table-row-hover').trim()).toBe('#e5f3ff');
    expect(style.getPropertyValue('--koia-table-row-stripe').trim()).toBe('#efefef');
    expect(style.getPropertyValue('--koia-resize-handle-size').trim()).toBe('16px');
    expect(style.getPropertyValue('--koia-resize-grip-size').trim()).toBe('8px');
    expect(style.getPropertyValue('--koia-pivot-font-size').trim()).toBe('11px');
    expect(style.getPropertyValue('--koia-pivot-cell-padding').trim()).toBe('2px 5px');
    expect(style.getPropertyValue('--koia-pivot-field-height').trim()).toBe('22px');
  });

  it('active toggle icon button should be accent tinted', () => {

    // when
    const style = styleOf(createToggleHost(), '#toggle');

    // then
    expect(style.color).toBe('rgb(56, 142, 60)');
    expect(style.backgroundColor).toBe('rgba(56, 142, 60, 0.12)');
  });

  it('toolbar separator should be thin vertical divider', () => {

    // when
    const style = styleOf(createToggleHost(), '#separator');

    // then
    expect(style.width).toBe('1px');
    expect(style.height).toBe('24px');
    expect(style.backgroundColor).toBe('rgb(197, 202, 233)');
  });

  it('menu trigger should look like chip', () => {

    // when
    const style = styleOf(createToggleHost(), '#trigger');

    // then
    expect(style.borderTopLeftRadius).toBe('12px');
    expect(style.paddingLeft).toBe('8px');
    expect(style.borderTopColor).toBe('rgb(224, 224, 224)');
    expect(style.cursor).toBe('pointer');
    expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('outside range menu trigger should be highlighted chip', () => {

    // when
    const style = styleOf(createToggleHost(), '#outside');

    // then
    expect(style.borderTopLeftRadius).toBe('12px');
    expect(style.backgroundColor).toBe('rgb(250, 218, 162)');
  });

  it('drag preview of side bar items should be rounded and shadowed', () => {

    // when
    const style = styleOf(createDragHost(), '#preview');

    // then
    expect(style.borderTopLeftRadius).toBe('4px');
    expect(style.boxShadow).toBe('rgba(0, 0, 0, 0.2) 0px 5px 5px -3px, rgba(0, 0, 0, 0.14) 0px 8px 10px 1px, rgba(0, 0, 0, 0.12) 0px 3px 14px 2px');
  });

  it('drag placeholder of side bar items should be invisible', () => {

    // when
    const style = styleOf(createDragHost(), '#placeholder');

    // then
    expect(style.opacity).toBe('0');
  });

  it('column items of dragging list should animate sorting', () => {

    // when
    const style = styleOf(createDragHost(), '#item_a');

    // then
    expect(style.transitionProperty).toBe('transform');
    expect(style.transitionDuration).toBe('0.25s');
  });

  it('last column item of list should have no border', () => {

    // when
    const host = createDragHost();

    // then
    expect(styleOf(host, '#item_b').borderBottomStyle).toBe('none');
    expect(styleOf(host, '#item_a').borderBottomStyle).toBe('solid');
  });

  it('print styles should hide view toolbar', () => {

    // when
    const rule = findStyleRule(Array.from(document.styleSheets), 'koia-main-toolbar, koia-range-filter, koia-view-toolbar, img', 'print');

    // then
    expect(rule).toBeDefined();
    expect(rule.style.display).toBe('none');
  });

  function printRule(selectorText: string): CSSStyleRule {
    return findStyleRule(Array.from(document.styleSheets), selectorText, 'print');
  }

  it('print styles should print landscape pages', () => {

    // when
    const rule = findPageRule(Array.from(document.styleSheets), 'print');

    // then
    expect(rule.style.getPropertyValue('size')).toBe('landscape');
    expect(rule.style.getPropertyValue('margin')).toBe('10mm');
  });

  it('print styles should paint white page background', () => {

    // when
    const rule = printRule('html');

    // then
    expect(rule.style.backgroundColor).toBe('white');
  });

  it('print styles should zoom printable content by print zoom', () => {

    // when
    const rule = printRule('.printable');

    // then
    expect(rule.style.getPropertyValue('zoom')).toBe('var(--koia-print-zoom, 1)');
  });

  it('print styles should not shrink every element', () => {

    // when
    const rule = printRule('*');

    // then
    expect(rule.style.getPropertyValue('zoom')).toBe('');
    expect(rule.style.overflow).toBe('visible');
    expect(rule.style.getPropertyPriority('overflow')).toBe('important');
  });

  it('print styles should lay out sidenav content without side bar margins', () => {

    // when
    const rule = printRule('mat-sidenav-content.mat-drawer-content');

    // then
    expect(rule.style.marginLeft).toBe('0px');
    expect(rule.style.marginRight).toBe('0px');
    expect(rule.style.getPropertyPriority('margin-left')).toBe('important');
    expect(rule.style.getPropertyPriority('margin-right')).toBe('important');
    expect(rule.style.transitionProperty).toBe('none');
    expect(rule.style.getPropertyPriority('transition-property')).toBe('important');
  });

  it('print styles should hide side bar and its backdrop', () => {

    // when
    const rule = printRule('mat-sidenav, .mat-drawer-backdrop');

    // then
    expect(rule.style.display).toBe('none');
    expect(rule.style.getPropertyPriority('display')).toBe('important');
  });

  it('print styles should strip header decoration', () => {

    // when
    const rule = printRule('.div_header');

    // then
    expect(rule.style.backgroundColor).toBe('transparent');
    expect(rule.style.getPropertyPriority('background-color')).toBe('important');
    expect(rule.style.backgroundImage).toBe('none');
    expect(rule.style.getPropertyPriority('background-image')).toBe('important');
    expect(rule.style.borderTopStyle).toBe('none');
    expect(rule.style.borderBottomStyle).toBe('none');
    expect(rule.style.getPropertyPriority('border-bottom-style')).toBe('important');
    expect(rule.style.boxShadow).toBe('none');
    expect(rule.style.getPropertyPriority('box-shadow')).toBe('important');
  });

  it('print styles should hide header content except print heading', () => {

    // when
    const rule = printRule('.div_header > :not(koia-print-heading)');

    // then
    expect(rule.style.display).toBe('none');
    expect(rule.style.getPropertyPriority('display')).toBe('important');
  });

  it('print styles should show print heading and its logo', () => {

    // when
    const heading = printRule('koia-print-heading');
    const visibility = printRule('koia-print-heading, koia-print-heading *');
    const logo = printRule('koia-print-heading img');
    const title = printRule('.span_print_title');
    const details = printRule('.span_print_details');

    // then
    expect(heading.style.display).toBe('flex');
    expect(heading.style.height).toBe('36px');
    expect(heading.style.boxSizing).toBe('border-box');
    expect(heading.style.marginBottom).toBe('8px');
    expect(heading.style.borderBottom).toBe('1px solid rgb(153, 153, 153)');
    expect(visibility.style.visibility).toBe('visible');
    expect(logo.style.display).toBe('block');
    expect(logo.style.height).toBe('28px');
    expect(title.style.fontSize).toBe('18px');
    expect(details.style.fontSize).toBe('11px');
    expect(details.style.marginLeft).toBe('auto');
  });

  it('print heading should be hidden on screen before print styles apply', () => {

    // given
    const sheet = Array.from(document.styleSheets).find(s => findStyleRule([s], 'koia-print-heading', 'print'));
    const rules = Array.from(sheet.cssRules);

    // when
    const screenRule = findStyleRule([sheet], 'koia-print-heading');

    // then
    expect(screenRule.style.display).toBe('none');
    expect(rules.indexOf(screenRule)).toBeLessThan(rules.findIndex(r => r.type === CSSRule.MEDIA_RULE && (r as CSSMediaRule).media.mediaText === 'print'));
  });

  it('print styles should hide visually hidden cdk containers', () => {

    // when
    const rule = printRule('.cdk-visually-hidden, .cdk-overlay-container');

    // then
    expect(rule.style.display).toBe('none');
    expect(rule.style.getPropertyPriority('display')).toBe('important');
  });

  it('print styles should hide pivot configuration', () => {

    // when
    const rule = printRule('#pivot .pvtRenderer, #pivot .pvtAxisContainer, #pivot .pvtVals');

    // then
    expect(rule.style.display).toBe('none');
    expect(rule.style.getPropertyPriority('display')).toBe('important');
  });

  it('print styles should print pivot cells as plain text', () => {

    // when
    const rule = printRule('#pivot table.pvtTable td');

    // then
    expect(rule.style.color).toBe('inherit');
    expect(rule.style.textDecoration).toBe('none');
    expect(rule.style.getPropertyPriority('text-decoration')).toBe('important');
  });

  it('print styles should hide text box placeholder', () => {

    // when
    const rule = printRule('koia-text-box .is-editor-empty::before');

    // then
    expect(rule.style.content).toBe('none');
    expect(rule.style.getPropertyPriority('content')).toBe('important');
  });

  it('print styles should print text box background color', () => {

    // when
    const rule = printRule('.div_text_box_tile');

    // then
    expect(rule.style.getPropertyValue('print-color-adjust')).toBe('exact');
  });

  it('print styles should hide frame of text box without border', () => {

    // when
    const rule = printRule('.div_text_box_tile:not(.div_text_box_bordered)::after');

    // then
    expect(rule.style.borderStyle).toBe('none');
    expect(rule.style.getPropertyPriority('border-style')).toBe('important');
  });

  it('print styles should print border of bordered text box with its width and color', () => {

    // when
    const rule = printRule('.div_text_box_tile.div_text_box_bordered::after');

    // then
    expect(rule.style.border).toBe('var(--koia-text-box-border-width, 1px) solid var(--koia-text-box-border-color, var(--koia-border-color))');
    expect(rule.style.getPropertyPriority('border')).toBe('important');
  });

  it('print styles should hide outline of revealed text box', () => {

    // when
    const rule = printRule('.div_text_box_tile');

    // then
    expect(rule.style.outlineStyle).toBe('none');
    expect(rule.style.getPropertyPriority('outline-style')).toBe('important');
  });

  it('print styles should hide move button of text box', () => {

    // when
    const rule = printRule('.but_config, .but_move, .but_text_box_move, .but_close');

    // then
    expect(rule.style.display).toBe('none');
    expect(rule.style.getPropertyPriority('display')).toBe('important');
  });

  it('border color token should equal default border color of text box', () => {

    // when
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--koia-border-color').trim();

    // then
    expect(borderColor).toBe(DEFAULT_BORDER_COLOR);
  });
});
