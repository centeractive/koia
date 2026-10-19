import { OverlayContainer, OverlayModule } from '@angular/cdk/overlay';
import { ScrollDispatcher, ScrollingModule } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, NgZone, Output, Type, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { JSONContent } from '@tiptap/core';
import { TextBoxContext } from 'app/shared/model';
import { Language, LanguageService } from 'app/shared/services/language';
import { firstValueFrom, Subject } from 'rxjs';
import { userEvent } from 'vitest/browser';
import { TextBoxComponent } from './text-box.component';
import { TextBoxEditor } from './text-box-editor';
import { TextExtent } from './text-fit';
import { TileRelease } from './tile-release';
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_TEXT_COLOR, TextStyleState } from './text-box-style';

@Component({
  selector: 'koia-text-box-toolbar',
  template: '<div style="width: 360px; height: 74px"></div>',
  standalone: false
})
class TextBoxToolbarStubComponent {
  @Input() editor: TextBoxEditor;
  @Input() state: TextStyleState;
  @Input() backgroundColor: string;
  @Output() backgroundColorChange = new EventEmitter<string>();
  @Input() bordered: boolean;
  @Output() borderedChange = new EventEmitter<boolean>();
  @Input() borderWidth: number;
  @Output() borderWidthChange = new EventEmitter<number>();
  @Input() borderColor: string;
  @Output() borderColorChange = new EventEmitter<string>();
  @Output() remove = new EventEmitter<void>();
}

@Component({
  template: `
    <div cdkScrollable class="div_container" style="position: fixed; left: 0; right: 0; overflow: auto"
      [style.top.px]="containerTop" [style.height.px]="containerHeight">
      <div [style.height.px]="spaceAbove"></div>
      <div class="div_tile" style="width: 300px" [style.height.px]="tileHeight" [style.margin-left.px]="tileLeft">
        <koia-text-box [context]="context" />
      </div>
      <div style="height: 2000px"></div>
    </div>`,
  standalone: false
})
class ScrollContainerHostComponent {
  containerTop = 100;
  containerHeight = 300;
  spaceAbove = 0;
  tileHeight = 150;
  tileLeft = 0;
  context = new TextBoxContext([]);
  @ViewChild(TextBoxComponent) textBox: TextBoxComponent;
}

@Component({
  template: `
    <div cdkScrollable style="position: fixed; top: 30px; left: 0; right: 0; height: 500px; overflow: auto">
      <div cdkScrollable class="div_inner" style="margin-top: 50px; height: 300px; overflow: auto">
        <koia-text-box [context]="context" />
      </div>
    </div>`,
  standalone: false
})
class NestedScrollContainersHostComponent {
  context = new TextBoxContext([]);
  @ViewChild(TextBoxComponent) textBox: TextBoxComponent;
}

@Component({
  template: `
    <div class="div_tile" style="padding: 6px; box-sizing: border-box" [style.width.px]="tileWidth" [style.height.px]="tileHeight">
      <koia-text-box [context]="context" (fitHeightChange)="fitHeights.push($event)" (textEdited)="textEdits.push($event)" />
    </div>`,
  standalone: false
})
class FitHostComponent {
  tileWidth = 300;
  tileHeight = 150;
  context = new TextBoxContext([]);
  fitHeights: number[] = [];
  textEdits: TextExtent[] = [];
  @ViewChild(TextBoxComponent) textBox: TextBoxComponent;
}

@Component({
  template: `
    <div class="div_tile" [class.div_text_tile]="textTile" style="width: 300px; height: 150px">
      <koia-text-box [context]="context" />
    </div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class PlaceholderHostComponent {
  textTile = true;
  context = new TextBoxContext([]);
  @ViewChild(TextBoxComponent) textBox: TextBoxComponent;
}

describe('TextBoxComponent', () => {

  const initialContent: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'initial' }] }] };
  let languageChanged: Subject<Language>;
  let zone: NgZone;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TextBoxComponent, TextBoxToolbarStubComponent, ScrollContainerHostComponent, NestedScrollContainersHostComponent,
        FitHostComponent, PlaceholderHostComponent],
      imports: [OverlayModule, ScrollingModule]
    });
    languageChanged = new Subject<Language>();
    vi.spyOn(TestBed.inject(LanguageService), 'changed$', 'get').mockReturnValue(languageChanged);
    zone = TestBed.inject(NgZone);
  });

  async function create<T>(type: Type<T>): Promise<ComponentFixture<T>> {
    const fixture = TestBed.createComponent(type);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  async function createTextBox(content?: JSONContent): Promise<ComponentFixture<TextBoxComponent>> {
    const fixture = TestBed.createComponent(TextBoxComponent);
    fixture.componentInstance.context = new TextBoxContext([]);
    fixture.componentInstance.context.content = content;
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => expect(proseMirrorOf(fixture.nativeElement)).toBeTruthy());
    return fixture;
  }

  async function createInScrollContainer(configure: (host: ScrollContainerHostComponent) => void = () => undefined):
    Promise<ComponentFixture<ScrollContainerHostComponent>> {
    const fixture = TestBed.createComponent(ScrollContainerHostComponent);
    configure(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  function proseMirrorOf(element: HTMLElement): HTMLElement {
    return element.querySelector('.ProseMirror');
  }

  function hostOf(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector('koia-text-box') ?? fixture.nativeElement;
  }

  function tileOf(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector('.div_tile');
  }

  function containerOf(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement.querySelector('.div_container');
  }

  function overlayPane(): HTMLElement {
    return TestBed.inject(OverlayContainer).getContainerElement().querySelector('.cdk-overlay-pane');
  }

  function toolbar(): HTMLElement {
    return TestBed.inject(OverlayContainer).getContainerElement().querySelector('koia-text-box-toolbar');
  }

  function focusIn(fixture: ComponentFixture<unknown>): void {
    proseMirrorOf(hostOf(fixture)).dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();
  }

  function focusOut(fixture: ComponentFixture<unknown>, relatedTarget: EventTarget | null): void {
    proseMirrorOf(hostOf(fixture)).dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget }));
    fixture.detectChanges();
  }

  function pressPointerOn(fixture: ComponentFixture<unknown>, element: Element): void {
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();
  }

  async function scrollAndAwaitAudit(fixture: ComponentFixture<unknown>, scroll: () => void): Promise<void> {
    const audited = firstValueFrom(TestBed.inject(ScrollDispatcher).ancestorScrolled(hostOf(fixture)));
    scroll();
    await audited;
  }

  function rect(element: Element): DOMRect {
    return element.getBoundingClientRect();
  }

  describe('editor', () => {

    it('should create editor with context content', async () => {

      // when
      const fixture = await createTextBox(initialContent);

      // then
      expect(proseMirrorOf(fixture.nativeElement).textContent).toBe('initial');
      expect(fixture.componentInstance.editor).toBeInstanceOf(TextBoxEditor);
    });

    it('should set initial state', async () => {

      // when
      const fixture = await createTextBox(initialContent);

      // then
      expect(fixture.componentInstance.state).toEqual({
        bold: false, italic: false, underline: false, fontFamily: DEFAULT_FONT_FAMILY, fontSize: DEFAULT_FONT_SIZE,
        color: DEFAULT_TEXT_COLOR, textAlign: 'left'
      });
    });

    it('should update context content inside Angular zone when typing', async () => {

      // given
      const fixture = await createTextBox();
      const context = fixture.componentInstance.context;
      const setContent = Object.getOwnPropertyDescriptor(TextBoxContext.prototype, 'content').set;
      const inAngularZone: boolean[] = [];
      vi.spyOn(context, 'content', 'set').mockImplementation(content => {
        inAngularZone.push(NgZone.isInAngularZone());
        setContent.call(context, content);
      });

      // when
      await userEvent.click(proseMirrorOf(fixture.nativeElement));
      await userEvent.keyboard('typed');

      // then
      await vi.waitFor(() => expect(context.content.content[0].content).toEqual([{ type: 'text', text: 'typed' }]));
      expect(inAngularZone.length).toBeGreaterThan(0);
      expect(inAngularZone.every(z => z)).toBe(true);
    });

    it('should keep editor CSS when another text box is destroyed', async () => {

      // given
      const destroyedFixture = await createInScrollContainer();
      const remainingFixture = await createInScrollContainer();
      await vi.waitFor(() => expect(proseMirrorOf(hostOf(remainingFixture))).toBeTruthy());

      // when
      destroyedFixture.destroy();

      // then
      expect(getComputedStyle(proseMirrorOf(hostOf(remainingFixture))).whiteSpace).toBe('break-spaces');
    });

    it('editor div should hide overflow', async () => {

      // when
      const fixture = await createInScrollContainer();

      // then
      const editorDiv: HTMLElement = hostOf(fixture).querySelector('.div_text_box_editor');
      expect(getComputedStyle(editorDiv).overflow).toBe('hidden');
      expect(rect(editorDiv).top).toBe(rect(hostOf(fixture)).top);
    });

    it('should not measure text without fit height binding', async () => {

      // given
      const fixture = await createTextBox();

      // when
      await userEvent.click(proseMirrorOf(fixture.nativeElement));
      await userEvent.keyboard('typed');

      // then
      await vi.waitFor(() => expect(fixture.componentInstance.context.content).toBeDefined());
      expect(fixture.componentInstance['textFit']).toBeUndefined();
    });

    it('should not run zone when state is unchanged', async () => {

      // given
      const fixture = await createTextBox(initialContent);
      const runSpy = vi.spyOn(zone, 'run');

      // when
      fixture.componentInstance.editor.refreshPlaceholder();

      // then
      expect(runSpy).not.toHaveBeenCalled();
    });

    it('should set state inside zone when state changed', async () => {

      // given
      const fixture = await createTextBox(initialContent);
      const runSpy = vi.spyOn(zone, 'run');

      // when
      fixture.componentInstance.editor.toggleBold();

      // then
      expect(runSpy).toHaveBeenCalled();
      expect(fixture.componentInstance.state.bold).toBe(true);
    });

    it('should refresh placeholder when language changed', async () => {

      // given
      const fixture = await createTextBox();
      const refreshPlaceholderSpy = vi.spyOn(fixture.componentInstance.editor, 'refreshPlaceholder');

      // when
      languageChanged.next('de');

      // then
      expect(refreshPlaceholderSpy).toHaveBeenCalled();
    });

    it('should fill enclosing tile', async () => {

      // when
      const fixture = await createInScrollContainer();

      // then
      expect(rect(hostOf(fixture)).height).toBe(150);
      expect(getComputedStyle(hostOf(fixture)).cursor).toBe('text');
    });

    it('should let paragraphs catch pointer events inside tile not catching pointer events', async () => {

      // given
      const fixture = await createInScrollContainer();
      await vi.waitFor(() => expect(proseMirrorOf(hostOf(fixture))).toBeTruthy());

      // when
      tileOf(fixture).style.pointerEvents = 'none';

      // then
      expect(getComputedStyle(hostOf(fixture)).pointerEvents).toBe('none');
      expect(getComputedStyle(proseMirrorOf(hostOf(fixture)).querySelector('p')).pointerEvents).toBe('auto');
    });

    it('should show placeholder of language service', async () => {

      // when
      const fixture = await createTextBox();

      // then
      const paragraph = proseMirrorOf(fixture.nativeElement).querySelector('p');
      expect(paragraph.getAttribute('data-placeholder')).toBe(TestBed.inject(LanguageService).instant('textBox.placeholder'));
    });
  });

  describe('toolbar opening and closing', () => {

    let fixture: ComponentFixture<TextBoxComponent>;

    beforeEach(async () => fixture = await createTextBox(initialContent));

    async function openToolbar(): Promise<void> {
      focusIn(fixture);
      await vi.waitFor(() => expect(toolbar()).toBeTruthy());
    }

    it('should be closed initially', () => {
      expect(fixture.componentInstance.active).toBe(false);
      expect(toolbar()).toBeNull();
    });

    it('should open on focusin', async () => {

      // when
      focusIn(fixture);

      // then
      expect(fixture.componentInstance.active).toBe(true);
      await vi.waitFor(() => expect(toolbar()).toBeTruthy());
    });

    it('should close on pointerdown outside', async () => {

      // given
      await openToolbar();

      // when
      pressPointerOn(fixture, document.body);

      // then
      expect(fixture.componentInstance.active).toBe(false);
      expect(toolbar()).toBeNull();
    });

    it('should close inside Angular zone on pointerdown outside', async () => {

      // given
      await openToolbar();
      vi.spyOn(zone, 'run').mockReturnValue(undefined);

      // when
      pressPointerOn(fixture, document.body);

      // then
      expect(fixture.componentInstance.active).toBe(true);
    });

    it('should not run zone on pointerdown when closed', () => {

      // given
      const runSpy = vi.spyOn(zone, 'run');

      // when
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

      // then
      expect(runSpy).not.toHaveBeenCalled();
    });

    it('should stay open on pointerdown in host', async () => {

      // given
      await openToolbar();

      // when
      pressPointerOn(fixture, proseMirrorOf(fixture.nativeElement));

      // then
      expect(fixture.componentInstance.active).toBe(true);
    });

    it('should stay open on pointerdown in overlay container', async () => {

      // given
      await openToolbar();

      // when
      pressPointerOn(fixture, toolbar());

      // then
      expect(fixture.componentInstance.active).toBe(true);
    });

    it('should close on focusout to outside', async () => {

      // given
      await openToolbar();

      // when
      focusOut(fixture, document.body);

      // then
      expect(fixture.componentInstance.active).toBe(false);
    });

    it('should stay open on focusout into overlay', async () => {

      // given
      await openToolbar();

      // when
      focusOut(fixture, toolbar());

      // then
      expect(fixture.componentInstance.active).toBe(true);
    });

    it('should stay open on focusout without related target', async () => {

      // given
      await openToolbar();

      // when
      focusOut(fixture, null);

      // then
      expect(fixture.componentInstance.active).toBe(true);
    });

    it('should mark host as active while toolbar is open', async () => {

      // given
      const host: HTMLElement = fixture.nativeElement;
      const initiallyActive = host.classList.contains('koia-text-box-active');

      // when
      await openToolbar();

      // then
      expect(initiallyActive).toBe(false);
      expect(host.classList).toContain('koia-text-box-active');
    });

    it('should emit remove when toolbar emits remove', async () => {

      // given
      await openToolbar();
      const removeSpy = vi.fn();
      fixture.componentInstance.remove.subscribe(removeSpy);
      const stub = fixture.debugElement.query(By.directive(TextBoxToolbarStubComponent)).componentInstance;

      // when
      stub.remove.emit();

      // then
      expect(removeSpy).toHaveBeenCalledTimes(1);
    });

    it('should close on detach', async () => {

      // given
      await openToolbar();

      // when
      fixture.componentInstance.connectedOverlay.overlayRef.detach();
      fixture.detectChanges();

      // then
      expect(fixture.componentInstance.active).toBe(false);
    });

    it('should reopen on host click', async () => {

      // given
      await openToolbar();
      pressPointerOn(fixture, document.body);

      // when
      fixture.nativeElement.click();
      fixture.detectChanges();

      // then
      expect(fixture.componentInstance.active).toBe(true);
      await vi.waitFor(() => expect(toolbar()).toBeTruthy());
    });

    it('should pass editor, state and background color to toolbar', async () => {

      // given
      fixture.componentInstance.context.backgroundColor = '#ff0000';

      // when
      await openToolbar();

      // then
      const stub = fixture.debugElement.query(By.directive(TextBoxToolbarStubComponent)).componentInstance;
      expect(stub.editor).toBe(fixture.componentInstance.editor);
      expect(stub.state).toBe(fixture.componentInstance.state);
      expect(stub.backgroundColor).toBe('#ff0000');
    });

    it.each([false, true])('should pass bordered %s to toolbar', async bordered => {

      // given
      fixture.componentInstance.context.bordered = bordered;

      // when
      await openToolbar();

      // then
      expect(fixture.debugElement.query(By.directive(TextBoxToolbarStubComponent)).componentInstance.bordered).toBe(bordered);
    });

    it('should set context bordered emitted by toolbar', async () => {

      // given
      await openToolbar();
      const stub = fixture.debugElement.query(By.directive(TextBoxToolbarStubComponent)).componentInstance;

      // when
      stub.borderedChange.emit(true);

      // then
      expect(fixture.componentInstance.context.bordered).toBe(true);
    });

    it.each([
      { emitted: '#00ff00' },
      { emitted: undefined }
    ])('should set context background color $emitted emitted by toolbar', async ({ emitted }) => {

      // given
      fixture.componentInstance.context.backgroundColor = '#ff0000';
      await openToolbar();
      const stub = fixture.debugElement.query(By.directive(TextBoxToolbarStubComponent)).componentInstance;

      // when
      stub.backgroundColorChange.emit(emitted);

      // then
      expect(fixture.componentInstance.context.backgroundColor).toBe(emitted);
    });
  });

  describe('border', () => {

    let fixture: ComponentFixture<TextBoxComponent>;

    beforeEach(async () => {
      fixture = await createTextBox(initialContent);
      focusIn(fixture);
      await vi.waitFor(() => expect(toolbar()).toBeTruthy());
    });

    function toolbarStub(): TextBoxToolbarStubComponent {
      return fixture.debugElement.query(By.directive(TextBoxToolbarStubComponent)).componentInstance;
    }

    it('should pass border width and color to toolbar', () => {

      // when
      fixture.componentInstance.context.borderWidth = 3;
      fixture.componentInstance.context.borderColor = '#ff0000';
      fixture.detectChanges();

      // then
      expect([toolbarStub().borderWidth, toolbarStub().borderColor]).toEqual([3, '#ff0000']);
    });

    it('should set border width emitted by toolbar and show border', () => {

      // when
      toolbarStub().borderWidthChange.emit(4);

      // then
      expect([fixture.componentInstance.context.borderWidth, fixture.componentInstance.context.bordered]).toEqual([4, true]);
    });

    it('should set border color emitted by toolbar and show border', () => {

      // when
      toolbarStub().borderColorChange.emit('#00ff00');

      // then
      expect([fixture.componentInstance.context.borderColor, fixture.componentInstance.context.bordered]).toEqual(['#00ff00', true]);
    });
  });

  describe('edit request', () => {

    function createRequestedTextBox(editRequested: boolean): ComponentFixture<TextBoxComponent> {
      const fixture = TestBed.createComponent(TextBoxComponent);
      fixture.componentInstance.context = new TextBoxContext([]);
      fixture.componentInstance.context.content = initialContent;
      fixture.componentInstance.context.editRequested = editRequested;
      fixture.detectChanges();
      return fixture;
    }

    it('should start editing once rendered when requested', async () => {

      // when
      const fixture = createRequestedTextBox(true);

      // then
      expect(fixture.componentInstance.context.editRequested).toBe(false);
      await vi.waitFor(() => expect(document.activeElement).toBe(proseMirrorOf(fixture.nativeElement)));
      expect(fixture.componentInstance.active).toBe(true);
      fixture.detectChanges();
      await vi.waitFor(() => expect(toolbar()).toBeTruthy());
    });

    it('#startEditing should focus editor and open toolbar', async () => {

      // given
      const fixture = createRequestedTextBox(false);
      await fixture.whenStable();

      // when
      fixture.componentInstance.startEditing();

      // then
      await vi.waitFor(() => expect(document.activeElement).toBe(proseMirrorOf(fixture.nativeElement)));
      expect(fixture.componentInstance.active).toBe(true);
    });

    it('should not start editing when not requested', async () => {

      // when
      const fixture = createRequestedTextBox(false);
      await fixture.whenStable();

      // then
      expect(fixture.componentInstance.active).toBe(false);
      expect(document.activeElement).not.toBe(proseMirrorOf(fixture.nativeElement));
    });

    it('should not start editing when destroyed before rendered', () => {

      // given
      const fixture = createRequestedTextBox(true);
      const focusEndSpy = vi.spyOn(fixture.componentInstance.editor, 'focusEnd');

      // when
      fixture.destroy();

      // then
      return new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
        expect(focusEndSpy).not.toHaveBeenCalled();
        resolve();
      })));
    });
  });

  describe('text edited', () => {

    async function createFitHost(): Promise<ComponentFixture<FitHostComponent>> {
      const fixture = TestBed.createComponent(FitHostComponent);
      fixture.componentInstance.context.content = initialContent;
      fixture.detectChanges();
      await fixture.whenStable();
      await vi.waitFor(() => expect(proseMirrorOf(hostOf(fixture))).toBeTruthy());
      return fixture;
    }

    async function type(fixture: ComponentFixture<unknown>, text: string): Promise<void> {
      await userEvent.click(proseMirrorOf(hostOf(fixture)));
      await userEvent.keyboard(text);
      fixture.detectChanges();
    }

    function release(): Promise<void> {
      document.dispatchEvent(new Event('pointerup'));
      return new Promise(resolve => setTimeout(resolve));
    }

    function textBoxOf(fixture: ComponentFixture<FitHostComponent>): TextBoxComponent {
      return fixture.componentInstance.textBox;
    }

    it('should emit fit extent when pressed outside after text was changed', async () => {

      // given
      const fixture = await createFitHost();
      await type(fixture, ' text');

      // when
      pressPointerOn(fixture, document.body);

      // then
      expect(fixture.componentInstance.textEdits.length).toBe(1);
      const extent = fixture.componentInstance.textEdits[0];
      expect(extent.width).toBeGreaterThan(0);
      expect(extent.width).toBeLessThan(300);
      expect(extent.height).toBeGreaterThan(0);
    });

    it('should not emit when text was not changed', async () => {

      // given
      const fixture = await createFitHost();
      focusIn(fixture);

      // when
      pressPointerOn(fixture, document.body);

      // then
      expect(fixture.componentInstance.textEdits).toEqual([]);
    });

    it('should not emit when edited text has no width', async () => {

      // given
      const fixture = await createFitHost();
      await type(fixture, '{Control>}a{/Control}{Backspace}{Shift>}{Enter}{/Shift}');

      // when
      pressPointerOn(fixture, document.body);

      // then
      expect(fixture.componentInstance.textEdits).toEqual([]);
    });

    it('should not emit when fit is not observed', async () => {

      // given
      const fixture = await createTextBox(initialContent);
      const emitSpy = vi.spyOn(fixture.componentInstance.textEdited, 'emit');
      await type(fixture, ' text');

      // when
      pressPointerOn(fixture, document.body);

      // then
      expect(emitSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.active).toBe(false);
    });

    it('should emit once when toolbar is detached after deactivation', async () => {

      // given
      const fixture = await createFitHost();
      await type(fixture, ' text');
      const overlayRef = textBoxOf(fixture).connectedOverlay.overlayRef;

      // when
      pressPointerOn(fixture, document.body);
      overlayRef.detach();

      // then
      expect(fixture.componentInstance.textEdits.length).toBe(1);
    });

    it('should emit when toolbar is closed by escape after text was changed', async () => {

      // given
      const fixture = await createFitHost();
      await type(fixture, ' text');

      // when
      await userEvent.keyboard('{Escape}');
      fixture.detectChanges();

      // then
      expect(textBoxOf(fixture).active).toBe(false);
      expect(fixture.componentInstance.textEdits.length).toBe(1);
    });

    it('should emit on focusout to outside after text was changed', async () => {

      // given
      const fixture = await createFitHost();
      await type(fixture, ' text');

      // when
      focusOut(fixture, document.body);

      // then
      expect(fixture.componentInstance.textEdits.length).toBe(1);
    });

    it('should ignore focusout while inactive', async () => {

      // given
      const fixture = await createFitHost();
      const deactivateSpy = vi.spyOn(textBoxOf(fixture), 'deactivate');

      // when
      focusOut(fixture, document.body);

      // then
      expect(deactivateSpy).not.toHaveBeenCalled();
    });

    it('should deactivate without emitting on press in own tile followed by focusout into tile', async () => {

      // given
      const fixture = await createFitHost();
      await type(fixture, ' text');
      const button = document.createElement('button');
      tileOf(fixture).appendChild(button);

      // when
      pressPointerOn(fixture, tileOf(fixture));
      focusOut(fixture, button);

      // then
      expect(textBoxOf(fixture).active).toBe(false);
      expect(fixture.componentInstance.textEdits).toEqual([]);
    });

    it('should deactivate inside Angular zone on press in own tile', async () => {

      // given
      const fixture = await createFitHost();
      await type(fixture, ' text');
      vi.spyOn(zone, 'run').mockReturnValue(undefined);

      // when
      pressPointerOn(fixture, tileOf(fixture));

      // then
      expect(textBoxOf(fixture).active).toBe(true);
    });

    it('should emit after release of press in own tile', async () => {

      // given
      const fixture = await createFitHost();
      await type(fixture, ' text');
      pressPointerOn(fixture, tileOf(fixture));

      // when
      await release();

      // then
      expect(fixture.componentInstance.textEdits.length).toBe(1);
    });

    it('should not emit after release of press resizing own tile, neither on later deactivation', async () => {

      // given
      const fixture = await createFitHost();
      await type(fixture, ' text');
      pressPointerOn(fixture, tileOf(fixture));
      tileOf(fixture).classList.add(TileRelease.RESIZE_ACTIVE_CLASS);

      // when
      await release();
      textBoxOf(fixture).deactivate();

      // then
      expect(fixture.componentInstance.textEdits).toEqual([]);
    });

    it('should cancel pending release on destroy', async () => {

      // given
      const fixture = await createFitHost();
      const cancelSpy = vi.spyOn(TileRelease.prototype, 'cancel');

      // when
      fixture.destroy();

      // then
      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should not emit when edited box is destroyed while active', async () => {

      // given
      const fixture = await createFitHost();
      await type(fixture, ' text');
      const emitSpy = vi.spyOn(textBoxOf(fixture).textEdited, 'emit');

      // when
      fixture.destroy();

      // then
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('toolbar origin and placement', () => {

    it('should use enclosing tile as toolbar origin', async () => {

      // when
      const fixture = await createInScrollContainer();

      // then
      expect(fixture.componentInstance.textBox.toolbarOrigin).toBe(tileOf(fixture));
    });

    it('should use host as toolbar origin without tile', async () => {

      // when
      const fixture = await createTextBox();

      // then
      expect(fixture.componentInstance.toolbarOrigin).toBe(fixture.nativeElement);
    });

    it('should create without NG0100 when hosted in tile', async () => {

      // given
      const fixture = await createInScrollContainer(host => host.spaceAbove = 100);

      // when
      focusIn(fixture);

      // then
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(fixture.componentInstance.textBox.active).toBe(true);
    });

    it('should place toolbar above tile with room above', async () => {

      // given
      const fixture = await createInScrollContainer(host => host.spaceAbove = 100);

      // when
      focusIn(fixture);

      // then
      expect(fixture.componentInstance.textBox.toolbarPositions).toBe(TextBoxComponent.ABOVE_FIRST);
      await expect.poll(() => overlayPane() && rect(overlayPane()).bottom).toBeLessThanOrEqual(rect(tileOf(fixture)).top);
    });

    it('should place toolbar below tile at top of container', async () => {

      // given
      const fixture = await createInScrollContainer();

      // when
      focusIn(fixture);

      // then
      expect(fixture.componentInstance.textBox.toolbarPositions).toBe(TextBoxComponent.BELOW_ONLY);
      await expect.poll(() => overlayPane() && rect(overlayPane()).top).toBeGreaterThanOrEqual(rect(tileOf(fixture)).bottom);
    });

    it('should keep toolbar within viewport when tile touches right window edge', async () => {

      // given
      const fixture = await createInScrollContainer(host => host.spaceAbove = 100);
      fixture.componentInstance.tileLeft = containerOf(fixture).clientWidth - 300;
      fixture.detectChanges();

      // when
      focusIn(fixture);

      // then
      await expect.poll(() => overlayPane() && rect(overlayPane()).width).toBeGreaterThan(0);
      expect(rect(overlayPane()).right).toBeLessThanOrEqual(window.innerWidth);
    });

    it('should push toolbar below container top when tile is taller than container', async () => {

      // given
      const fixture = await createInScrollContainer(host => host.tileHeight = window.innerHeight);

      // when
      focusIn(fixture);

      // then
      await expect.poll(() => overlayPane() && rect(overlayPane()).width).toBeGreaterThan(0);
      expect(rect(overlayPane()).top).toBeGreaterThanOrEqual(rect(containerOf(fixture)).top);
    });

    it('should set viewport margin top to top of innermost scroll container', async () => {

      // given
      const fixture = await create(NestedScrollContainersHostComponent);

      // when
      focusIn(fixture);

      // then
      const innerTop = rect(fixture.nativeElement.querySelector('.div_inner')).top;
      expect(innerTop).toBe(80);
      expect(fixture.componentInstance.textBox.toolbarViewportMargin).toEqual({ top: innerTop });
    });

    it('should set viewport margin top to 0 without scroll container', async () => {

      // given
      const fixture = await createTextBox();

      // when
      focusIn(fixture);

      // then
      expect(fixture.componentInstance.toolbarViewportMargin).toEqual({ top: 0 });
    });
  });

  describe('ancestor scrolling', () => {

    it('should move toolbar below tile when room above gets too small', async () => {

      // given
      const fixture = await createInScrollContainer(host => host.spaceAbove = 100);
      const textBox = fixture.componentInstance.textBox;
      focusIn(fixture);
      await expect.poll(() => overlayPane() && rect(overlayPane()).bottom).toBeLessThanOrEqual(rect(tileOf(fixture)).top);
      const overlayRef = textBox.connectedOverlay.overlayRef;
      const updatePosition = overlayRef.updatePosition.bind(overlayRef);
      const belowOnlyOnUpdate: boolean[] = [];
      vi.spyOn(overlayRef, 'updatePosition').mockImplementation(() => {
        belowOnlyOnUpdate.push(textBox.connectedOverlay.positions === TextBoxComponent.BELOW_ONLY);
        return updatePosition();
      });

      // when
      containerOf(fixture).scrollTop = 70;

      // then
      await expect.poll(() => rect(overlayPane()).top).toBeGreaterThanOrEqual(rect(tileOf(fixture)).bottom);
      expect(textBox.toolbarPositions).toBe(TextBoxComponent.BELOW_ONLY);
      expect(belowOnlyOnUpdate).toContain(true);
    });

    it('should not run zone when toolbar positions are unchanged', async () => {

      // given
      const fixture = await createInScrollContainer(host => host.spaceAbove = 100);
      focusIn(fixture);
      const runSpy = vi.spyOn(zone, 'run');

      // when
      await scrollAndAwaitAudit(fixture, () => containerOf(fixture).scrollTop = 10);

      // then
      expect(runSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.textBox.toolbarPositions).toBe(TextBoxComponent.ABOVE_FIRST);
    });

    it('should keep toolbar open while tile is partly visible', async () => {

      // given
      const fixture = await createInScrollContainer(host => host.spaceAbove = 100);
      focusIn(fixture);

      // when
      await scrollAndAwaitAudit(fixture, () => containerOf(fixture).scrollTop = 200);

      // then
      expect(fixture.componentInstance.textBox.active).toBe(true);
    });

    it('should close toolbar once tile is scrolled out above container', async () => {

      // given
      const fixture = await createInScrollContainer(host => host.spaceAbove = 100);
      focusIn(fixture);

      // when
      containerOf(fixture).scrollTop = 300;

      // then
      await expect.poll(() => fixture.componentInstance.textBox.active).toBe(false);
    });

    it('should close toolbar when tile is below container', async () => {

      // given
      const fixture = await createInScrollContainer(host => host.spaceAbove = 500);
      focusIn(fixture);

      // when
      containerOf(fixture).scrollTop = 10;

      // then
      await expect.poll(() => fixture.componentInstance.textBox.active).toBe(false);
    });

    it('should not run zone on scroll while toolbar is closed', async () => {

      // given
      const fixture = await createInScrollContainer(host => host.spaceAbove = 500);
      const runSpy = vi.spyOn(zone, 'run');

      // when
      await scrollAndAwaitAudit(fixture, () => containerOf(fixture).scrollTop = 10);

      // then
      expect(runSpy).not.toHaveBeenCalled();
    });

    it('should ignore document scroll', async () => {

      // given
      const fixture = await createInScrollContainer(host => host.spaceAbove = 100);
      focusIn(fixture);
      const runSpy = vi.spyOn(zone, 'run');

      // when
      await scrollAndAwaitAudit(fixture, () => document.dispatchEvent(new Event('scroll')));

      // then
      expect(runSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.textBox.active).toBe(true);
    });
  });

  describe('event propagation', () => {

    it.each([
      { eventName: 'mousedown', createEvent: () => new MouseEvent('mousedown', { bubbles: true }) },
      { eventName: 'touchstart', createEvent: () => new TouchEvent('touchstart', { bubbles: true }) }
    ])('should stop $eventName propagation from editor and host', async ({ eventName, createEvent }) => {

      // given
      const fixture = await createInScrollContainer();
      await vi.waitFor(() => expect(proseMirrorOf(hostOf(fixture))).toBeTruthy());
      const tileListener = vi.fn();
      tileOf(fixture).addEventListener(eventName, tileListener);

      // when
      proseMirrorOf(hostOf(fixture)).dispatchEvent(createEvent());
      hostOf(fixture).dispatchEvent(createEvent());

      // then
      expect(tileListener).not.toHaveBeenCalled();
    });
  });

  describe('fit height', () => {

    function lines(count: number): JSONContent {
      return {
        type: 'doc',
        content: Array.from({ length: count }, (_, i) => ({ type: 'paragraph', content: [{ type: 'text', text: 'line ' + i }] }))
      };
    }

    async function createFitHost(content?: JSONContent): Promise<ComponentFixture<FitHostComponent>> {
      const fixture = TestBed.createComponent(FitHostComponent);
      fixture.componentInstance.context.content = content;
      fixture.detectChanges();
      await fixture.whenStable();
      await vi.waitFor(() => expect(fixture.componentInstance.fitHeights.length).toBeGreaterThan(0));
      return fixture;
    }

    function lastFitHeight(fixture: ComponentFixture<FitHostComponent>): number {
      return fixture.componentInstance.fitHeights.at(-1);
    }

    function expectedFitHeightOf(fixture: ComponentFixture<FitHostComponent>): number {
      const proseMirror = proseMirrorOf(hostOf(fixture));
      const textBottom = rect(proseMirror.lastElementChild).bottom - rect(proseMirror).top;
      return Math.ceil(textBottom + parseFloat(getComputedStyle(proseMirror).paddingBottom) + 2 * 6);
    }

    it('should emit fit height of text plus tile padding', async () => {

      // when
      const fixture = await createFitHost(lines(1));

      // then
      expect(lastFitHeight(fixture)).toBe(expectedFitHeightOf(fixture));
      expect(lastFitHeight(fixture)).toBeLessThan(150);
    });

    it('should emit fit height inside Angular zone', async () => {

      // given
      const fixture = await createFitHost();
      const inAngularZone: boolean[] = [];
      fixture.componentInstance.textBox.fitHeightChange.subscribe(() => inAngularZone.push(NgZone.isInAngularZone()));

      // when
      fixture.componentInstance.tileWidth = 200;
      fixture.detectChanges();

      // then
      await vi.waitFor(() => expect(inAngularZone.length).toBeGreaterThan(0));
      expect(inAngularZone.every(z => z)).toBe(true);
    });

    it('should emit fit height beyond tile when typed text exceeds tile', async () => {

      // given
      const fixture = await createFitHost();

      // when
      await userEvent.click(proseMirrorOf(hostOf(fixture)));
      await userEvent.keyboard('line{Enter}'.repeat(12));

      // then
      await vi.waitFor(() => expect(lastFitHeight(fixture)).toBeGreaterThan(150));
      expect(lastFitHeight(fixture)).toBe(expectedFitHeightOf(fixture));
    });

    it('should emit smaller fit height when text is deleted', async () => {

      // given
      const fixture = await createFitHost(lines(12));
      await vi.waitFor(() => expect(lastFitHeight(fixture)).toBeGreaterThan(150));

      // when
      await userEvent.click(proseMirrorOf(hostOf(fixture)));
      await userEvent.keyboard('{Control>}a{/Control}{Backspace}');

      // then
      await vi.waitFor(() => expect(lastFitHeight(fixture)).toBeLessThan(150));
      expect(lastFitHeight(fixture)).toBe(expectedFitHeightOf(fixture));
    });

    it('should emit same fit height again when tile width changes', async () => {

      // given
      const fixture = await createFitHost(lines(1));
      const count = fixture.componentInstance.fitHeights.length;
      const fitHeight = lastFitHeight(fixture);

      // when
      fixture.componentInstance.tileWidth = 280;
      fixture.detectChanges();

      // then
      await vi.waitFor(() => expect(fixture.componentInstance.fitHeights.length).toBeGreaterThan(count));
      expect(lastFitHeight(fixture)).toBe(fitHeight);
    });

    it('should disconnect fit on destroy', async () => {

      // given
      const fixture = await createFitHost();
      const disconnectSpy = vi.spyOn(fixture.componentInstance.textBox['textFit'], 'disconnect');

      // when
      fixture.destroy();

      // then
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('placeholder', () => {

    async function createPlaceholderHost(textTile: boolean): Promise<ComponentFixture<PlaceholderHostComponent>> {
      const fixture = TestBed.createComponent(PlaceholderHostComponent);
      fixture.componentInstance.textTile = textTile;
      fixture.detectChanges();
      await fixture.whenStable();
      await vi.waitFor(() => expect(proseMirrorOf(hostOf(fixture))).toBeTruthy());
      return fixture;
    }

    function placeholderContentOf(fixture: ComponentFixture<unknown>): string {
      return getComputedStyle(proseMirrorOf(hostOf(fixture)).querySelector('p.is-editor-empty'), '::before').content;
    }

    it('should be hidden in empty text tile neither hovered nor active', async () => {

      // when
      const fixture = await createPlaceholderHost(true);

      // then
      expect(placeholderContentOf(fixture)).toBe('none');
    });

    it('should be shown in empty text tile while hovered', async () => {

      // given
      const fixture = await createPlaceholderHost(true);

      // when
      await userEvent.hover(tileOf(fixture));

      // then
      expect(placeholderContentOf(fixture)).not.toBe('none');
      await userEvent.unhover(tileOf(fixture));
    });

    it('should be shown in empty text tile while active', async () => {

      // given
      const fixture = await createPlaceholderHost(true);

      // when
      fixture.componentInstance.textBox.active = true;
      fixture.detectChanges();

      // then
      expect(placeholderContentOf(fixture)).not.toBe('none');
    });

    it('should be shown in empty note', async () => {

      // when
      const fixture = await createPlaceholderHost(false);

      // then
      expect(placeholderContentOf(fixture)).not.toBe('none');
    });
  });

  describe('destroy', () => {

    it('should remove listener, unsubscribe and destroy editor', async () => {

      // given
      const ancestorScrolled = new Subject<void>();
      vi.spyOn(TestBed.inject(ScrollDispatcher), 'ancestorScrolled').mockReturnValue(ancestorScrolled);
      const fixture = await createTextBox();
      const destroySpy = vi.spyOn(fixture.componentInstance.editor, 'destroy');
      const textBox = fixture.componentInstance;

      // when
      fixture.destroy();

      // then
      expect(ancestorScrolled.observed).toBe(false);
      expect(languageChanged.observed).toBe(false);
      expect(destroySpy).toHaveBeenCalled();
      textBox.active = true;
      const runSpy = vi.spyOn(zone, 'run');
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      expect(runSpy).not.toHaveBeenCalled();
    });
  });
});
