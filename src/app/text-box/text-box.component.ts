import { CdkConnectedOverlay, ConnectedPosition, OverlayContainer } from '@angular/cdk/overlay';
import { ScrollDispatcher, ScrollDispatcherTarget } from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  inject,
  Input,
  NgZone,
  OnDestroy,
  Output,
  Renderer2,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import type { JSONContent } from '@tiptap/core';
import { TextBoxContext } from 'app/shared/model';
import { LanguageService } from 'app/shared/services/language';
import { listenToDocumentOutsideAngular } from 'app/shared/ui/document-listener';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { TextBoxEditor } from './text-box-editor';
import { TextStyleState, TOOLBAR_HEIGHT_PX } from './text-box-style';
import { TextExtent, TextFit } from './text-fit';
import { TileRelease } from './tile-release';

const ABOVE_START: ConnectedPosition = { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' };
const ABOVE_END: ConnectedPosition = { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' };
const BELOW_START: ConnectedPosition = { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' };
const BELOW_END: ConnectedPosition = { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' };

@Component({
  selector: 'koia-text-box',
  templateUrl: './text-box.component.html',
  styleUrls: ['./text-box.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class TextBoxComponent implements AfterViewInit, OnDestroy {

  static readonly ABOVE_FIRST: ConnectedPosition[] = [ABOVE_START, ABOVE_END, BELOW_START, BELOW_END];
  static readonly BELOW_ONLY: ConnectedPosition[] = [BELOW_START, BELOW_END];

  @Input() context: TextBoxContext;
  @Output() remove = new EventEmitter<void>();
  /** emits the height in pixels the enclosing tile needs to show the whole text, measured only while observed */
  @Output() fitHeightChange = new EventEmitter<number>();
  /** emits the size in pixels the enclosing tile needs for its text once editing ended after the text was changed */
  @Output() textEdited = new EventEmitter<TextExtent>();

  @ViewChild('editorElement') editorElementRef: ElementRef<HTMLDivElement>;
  @ViewChild(CdkConnectedOverlay) connectedOverlay: CdkConnectedOverlay;

  editor: TextBoxEditor;
  state: TextStyleState;
  @HostBinding('class.koia-text-box-active') active = false;
  toolbarPositions = TextBoxComponent.ABOVE_FIRST;
  toolbarViewportMargin = { top: 0 };

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly renderer = inject(Renderer2);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly scrollDispatcher = inject(ScrollDispatcher);
  private readonly overlayContainer = inject(OverlayContainer);
  private readonly languageService = inject(LanguageService);
  private readonly subscriptions = new Subscription();
  private textFit: TextFit;
  private tileRelease: TileRelease;
  private edited = false;
  private focusFrame: number;

  /**
   * the enclosing dashboard tile
   */
  get toolbarOrigin(): Element {
    const host = this.elementRef.nativeElement;
    return host.closest('.div_tile') ?? host;
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.editor = new TextBoxEditor(this.editorElementRef.nativeElement, this.context.content,
        () => this.languageService.instant('textBox.placeholder'),
        content => this.onContentChange(content),
        state => this.onStateChange(state));
      if (this.fitHeightChange.observed || this.textEdited.observed) {
        this.textFit = new TextFit(this.toolbarOrigin, this.elementRef.nativeElement, this.editor.dom,
          height => this.zone.run(() => this.fitHeightChange.emit(height)));
      }
      this.subscriptions.add(this.scrollDispatcher.ancestorScrolled(this.elementRef)
        .subscribe(scrollable => this.onAncestorScrolled(scrollable)));
    });
    this.state = this.editor.state();
    this.tileRelease = new TileRelease(this.zone, this.renderer, this.toolbarOrigin);
    this.subscriptions.add(() => this.editor.destroy());
    this.subscriptions.add(() => this.textFit?.disconnect());
    this.subscriptions.add(() => this.tileRelease.cancel());
    this.subscriptions.add(() => cancelAnimationFrame(this.focusFrame));
    this.subscriptions.add(this.languageService.changed$.subscribe(() => this.editor.refreshPlaceholder()));
    this.subscriptions.add(listenToDocumentOutsideAngular(this.zone, this.renderer, 'pointerdown',
      event => this.deactivateWhenPressedElsewhere(event.target as Node)));
    this.startEditingWhenRequested();
  }

  startEditing(): void {
    this.editor.focusEnd();
  }

  /**
   * focuses within an own frame, as the editor focuses synchronously on some platforms, which would change the active
   * state within this hook
   */
  private startEditingWhenRequested(): void {
    if (this.context.editRequested) {
      this.context.editRequested = false;
      this.focusFrame = requestAnimationFrame(() => this.startEditing());
    }
  }

  @HostListener('focusin')
  @HostListener('click')
  activate(): void {
    this.computeToolbarPlacement();
    this.active = true;
  }

  /**
   * a focus change without related target (e.g. click on toolbar padding or window blur) keeps the toolbar,
   * real outside clicks are handled by the document pointerdown listener, which already deactivates on a press
   * that moves the focus
   */
  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget as Node;
    if (this.active && relatedTarget && !this.isInsideHostOrOverlay(relatedTarget)) {
      this.deactivate();
    }
  }

  /**
   * the own deactivations close the toolbar while already inactive, other closes such as escape deactivate
   */
  onToolbarDetached(): void {
    if (this.active) {
      this.deactivate();
    }
  }

  deactivate(): void {
    this.active = false;
    if (this.edited) {
      this.edited = false;
      this.emitTextEdited();
    }
  }

  private emitTextEdited(): void {
    const extent = this.textFit?.fitExtent();
    if (extent?.width > 0) {
      this.textEdited.emit(extent);
    }
  }

  setBorderWidth(borderWidth: number): void {
    this.context.borderWidth = borderWidth;
    this.context.bordered = true;
  }

  setBorderColor(borderColor: string): void {
    this.context.borderColor = borderColor;
    this.context.bordered = true;
  }

  /**
   * prevents the enclosing tile from being dragged while text is selected
   */
  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  /**
   * also measures the text, which the fit cannot observe while the text shrinks within the stretched editor content
   */
  private onContentChange(content: JSONContent): void {
    this.zone.run(() => {
      this.context.content = content;
      this.edited = true;
      this.textFit?.update();
    });
  }

  private onStateChange(state: TextStyleState): void {
    if (!_.isEqual(state, this.state)) {
      this.zone.run(() => this.state = state);
    }
  }

  /**
   * a press within the own tile starts moving or resizing it, which must not be disturbed by a shrinking tile
   */
  private deactivateWhenPressedElsewhere(target: Node): void {
    if (this.active && !this.isInsideHostOrOverlay(target)) {
      this.zone.run(() => this.toolbarOrigin.contains(target) ? this.deactivateOnRelease() : this.deactivate());
    }
  }

  private deactivateOnRelease(): void {
    this.active = false;
    this.tileRelease.awaitRelease(resized => this.endEditOnRelease(resized));
  }

  /**
   * a resize keeps the size chosen by the user
   */
  private endEditOnRelease(resized: boolean): void {
    if (resized) {
      this.edited = false;
    } else {
      this.deactivate();
    }
  }

  private isInsideHostOrOverlay(node: Node): boolean {
    return this.elementRef.nativeElement.contains(node) || this.overlayContainer.getContainerElement().contains(node);
  }

  private onAncestorScrolled(scrollable: ScrollDispatcherTarget | void): void {
    if (!scrollable || !this.active) {
      return;
    }
    const tile = this.toolbarOrigin.getBoundingClientRect();
    const container = scrollable.getElementRef().nativeElement.getBoundingClientRect();
    if (tile.bottom <= container.top || tile.top >= container.bottom) {
      this.zone.run(() => this.deactivate());
      return;
    }
    const positions = this.toolbarPositionsFor(this.containerTop());
    if (positions !== this.toolbarPositions) {
      this.zone.run(() => {
        this.toolbarPositions = positions;
        this.cdr.detectChanges();
        this.connectedOverlay.overlayRef.updatePosition();
      });
    }
  }

  /**
   * the overlay only respects the top viewport margin when pushing, the position above the tile must hence be excluded
   * when there is no room between the tile and the top of its scroll container
   */
  private computeToolbarPlacement(): void {
    const containerTop = this.containerTop();
    this.toolbarViewportMargin = { top: containerTop };
    this.toolbarPositions = this.toolbarPositionsFor(containerTop);
  }

  private toolbarPositionsFor(containerTop: number): ConnectedPosition[] {
    const roomAbove = this.toolbarOrigin.getBoundingClientRect().top - containerTop;
    return roomAbove >= TOOLBAR_HEIGHT_PX ? TextBoxComponent.ABOVE_FIRST : TextBoxComponent.BELOW_ONLY;
  }

  /**
   * @returns the top of the innermost scroll container, 0 when there is none
   */
  private containerTop(): number {
    return Math.max(0, ...this.scrollDispatcher.getAncestorScrollContainers(this.elementRef)
      .map(c => c.getElementRef().nativeElement.getBoundingClientRect().top));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
