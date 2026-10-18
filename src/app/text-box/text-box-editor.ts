import { Editor, JSONContent } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Italic from '@tiptap/extension-italic';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { Placeholder, Selection, UndoRedo } from '@tiptap/extensions';
import {
   DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, TEXT_ALIGNMENTS, TextAlignment, TextStyleState, toHexColor
} from './text-box-style';

export class TextBoxEditor {

   private readonly editor: Editor;

   constructor(element: HTMLElement, content: JSONContent, placeholder: () => string,
      onContentChange: (content: JSONContent) => void, onStateChange: (state: TextStyleState) => void) {
      this.editor = new Editor({
         element,
         content: content ?? '',
         injectCSS: false,
         enableInputRules: false,
         enablePasteRules: false,
         extensions: [
            Document, Paragraph, Text, Bold, Italic, Underline, HardBreak, UndoRedo,
            TextStyleKit.configure({ backgroundColor: false, lineHeight: false }),
            TextAlign.configure({ types: ['paragraph'], alignments: TEXT_ALIGNMENTS }),
            Placeholder.configure({ placeholder }),
            Selection
         ]
      });
      this.editor.on('update', () => onContentChange(this.editor.getJSON()));
      this.editor.on('transaction', () => onStateChange(this.state()));
   }

   state(): TextStyleState {
      const textStyle = this.editor.getAttributes('textStyle');
      return {
         bold: this.editor.isActive('bold'),
         italic: this.editor.isActive('italic'),
         underline: this.editor.isActive('underline'),
         fontFamily: textStyle['fontFamily'] ?? DEFAULT_FONT_FAMILY,
         fontSize: textStyle['fontSize'] ?? DEFAULT_FONT_SIZE,
         color: toHexColor(textStyle['color']),
         textAlign: TEXT_ALIGNMENTS.find(a => this.editor.isActive({ textAlign: a })) ?? 'left'
      };
   }

   toggleBold(): void {
      this.editor.chain().focus().toggleBold().run();
   }

   toggleItalic(): void {
      this.editor.chain().focus().toggleItalic().run();
   }

   toggleUnderline(): void {
      this.editor.chain().focus().toggleUnderline().run();
   }

   setFontFamily(fontFamily: string): void {
      this.editor.chain().focus().setFontFamily(fontFamily).run();
   }

   setFontSize(fontSize: string): void {
      this.editor.chain().focus().setFontSize(fontSize).run();
   }

   setColor(color: string): void {
      this.editor.chain().focus().setColor(color).run();
   }

   unsetColor(): void {
      this.editor.chain().focus().unsetColor().run();
   }

   setTextAlign(textAlign: TextAlignment): void {
      this.editor.chain().focus().setTextAlign(textAlign).run();
   }

   refreshPlaceholder(): void {
      this.editor.view.dispatch(this.editor.state.tr);
   }

   destroy(): void {
      this.editor.destroy();
   }
}
