import type { JSONContent } from '@tiptap/core';
import * as _ from 'lodash';
import { Column } from './column.type';
import { ElementContext } from './element-context';
import { ExportFormat } from './export-format.enum';

/**
 * position of a text box relative to its anchor tile, as fractions of the tile's width and height
 */
export interface AnchorOffset {
   x: number;
   y: number;
}

export class TextBoxContext extends ElementContext {

   static readonly TEXT_BOX_WIDTH = 300;
   static readonly TEXT_BOX_HEIGHT = 150;
   static readonly MIN_WIDTH = 40;
   static readonly MIN_HEIGHT = 30;
   /** width a note keeps when shrunk to a shorter text, leaving room for the text beside the move button */
   static readonly MIN_FIT_WIDTH = 120;
   static readonly NOTE_BACKGROUND_COLOR = '#fff9c4cc';
   static readonly DEFAULT_BORDER_WIDTH = 1;

   private _content: JSONContent;
   private _backgroundColor: string;
   private _bordered = false;
   private _borderWidth = TextBoxContext.DEFAULT_BORDER_WIDTH;
   private _borderColor: string;
   private _anchor: ElementContext;
   private _anchorOffset: AnchorOffset;

   /**
    * height in page units the text box needs to show its whole content at the current scale, transient
    */
   fitHeight: number;

   /**
    * set when added, the text box then starts editing once rendered, not persisted
    */
   editRequested = false;

   /**
    * @param tiled [[true]] if the text box takes a tile of its own, [[false]] if it is a note drawn above the tiles
    */
   constructor(columns: Column[], readonly tiled = false) {
      super(columns);
      this.setSize(TextBoxContext.TEXT_BOX_WIDTH, TextBoxContext.TEXT_BOX_HEIGHT);
   }

   get content(): JSONContent {
      return this._content;
   }

   set content(content: JSONContent) {
      if (!_.isEqual(this._content, content)) {
         this._content = content;
         this.fireLookChanged();
      }
   }

   get backgroundColor(): string {
      return this._backgroundColor;
   }

   set backgroundColor(backgroundColor: string) {
      if (this._backgroundColor !== backgroundColor) {
         this._backgroundColor = backgroundColor;
         this.fireLookChanged();
      }
   }

   get bordered(): boolean {
      return this._bordered;
   }

   set bordered(bordered: boolean) {
      if (this._bordered !== bordered) {
         this._bordered = bordered;
         this.fireLookChanged();
      }
   }

   get borderWidth(): number {
      return this._borderWidth;
   }

   set borderWidth(borderWidth: number) {
      if (this._borderWidth !== borderWidth) {
         this._borderWidth = borderWidth;
         this.fireLookChanged();
      }
   }

   get borderColor(): string {
      return this._borderColor;
   }

   set borderColor(borderColor: string) {
      if (this._borderColor !== borderColor) {
         this._borderColor = borderColor;
         this.fireLookChanged();
      }
   }

   get anchor(): ElementContext {
      return this._anchor;
   }

   get anchorOffset(): AnchorOffset {
      return this._anchorOffset;
   }

   setAnchor(anchor: ElementContext, offset: AnchorOffset): void {
      this._anchor = anchor;
      this._anchorOffset = offset;
   }

   clearAnchor(): void {
      this.setAnchor(undefined, undefined);
   }

   getTitle(): string {
      return this.title ?? '';
   }

   getSupportedExportFormats(): ExportFormat[] {
      return [];
   }

   override isConfigurable(): boolean {
      return false;
   }

   override isOverlay(): boolean {
      return !this.tiled;
   }
}
