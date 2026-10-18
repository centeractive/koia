import { OverlayContainer, OverlayModule } from '@angular/cdk/overlay';
import { ScrollDispatcher, ScrollingModule } from '@angular/cdk/scrolling';
import { Component, EventEmitter, Input, NgZone, Output, Type, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { JSONContent } from '@tiptap/core';
import { TextBoxContext } from 'app/shared/model';
import { Language, LanguageService } from 'app/shared/services/language';
import { firstValueFrom, Subject } from 'rxjs';
import { userEvent } from 'vitest/browser';
import { TextBoxComponent } from './text-box.component';
import { TextBoxEditor } from './text-box-editor';
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_TEXT_COLOR, TextStyleState } from './text-box-style';

@Component({
  selector: 'koia-text-box-toolbar',
  template: '<div style="width: 360px; height: 40px"></div>',
  standalone: false
})
class TextBoxToolbarStubComponent {
  @Input() editor: TextBoxEditor;
  @Input() state: TextStyleState;
  @Input() backgroundColor: string;
  @Output() backgroundColorChange = new EventEmitter<string>();
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

describe('TextBoxComponent', () => {

  const initialContent: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'initial' }] }] };
  let languageChanged: Subject<Language>;
  let zone: NgZone;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TextBoxComponent, TextBoxToolbarStubComponent, ScrollContainerHostComponent, NestedScrollContainersHostComponent],
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

    it('should scroll editor content inside editor div when content exceeds tile', async () => {

      // given
      const paragraphs = Array.from({ length: 30 }, (_, i) => ({ type: 'paragraph', content: [{ type: 'text', text: 'line ' + i }] }));
      const fixture = await createInScrollContainer(host => host.context.content = { type: 'doc', content: paragraphs });
      await vi.waitFor(() => expect(proseMirrorOf(hostOf(fixture))).toBeTruthy());
      const editorDiv: HTMLElement = hostOf(fixture).querySelector('.div_text_box_editor');

      // when
      editorDiv.scrollTop = 1000;

      // then
      expect(editorDiv.scrollTop).toBeGreaterThan(0);
      expect(rect(editorDiv).top).toBe(rect(hostOf(fixture)).top);
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
