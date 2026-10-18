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

   private _content: JSONContent;
   private _backgroundColor: string;
   private _anchor: ElementContext;
   private _anchorOffset: AnchorOffset;

   constructor(columns: Column[]) {
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
      return true;
   }
}
