import { expect, Locator } from '@playwright/test';
import { pressAndMoveBy, pressCenterAndMoveBy } from '../pointer';

const FRAME_PADDING_PX = 6;

export interface RenderedTextStyle {
   fontWeight: number;
   fontFamily: string;
   fontSize: string;
   color: string;
}

export class TextBoxToolbar {

   readonly boldButton: Locator;
   readonly textColorInput: Locator;
   readonly backgroundColorInput: Locator;

   constructor(readonly root: Locator) {
      this.boldButton = root.locator('.but_bold');
      this.textColorInput = root.locator('.input_text_color');
      this.backgroundColorInput = root.locator('.input_background_color');
   }

   async toggleBold(): Promise<void> {
      await this.boldButton.click();
   }

   setFontSize(fontSize: string): Promise<void> {
      return this.chooseOption('.select_font_size', fontSize);
   }

   setFontFamily(label: string): Promise<void> {
      return this.chooseOption('.select_font_family', label);
   }

   async toggleBorder(): Promise<void> {
      await this.root.locator('.but_border').click();
   }

   async delete(): Promise<void> {
      await this.root.locator('.but_delete').click();
   }

   async setTextColor(color: string): Promise<void> {
      await this.pickColor(this.textColorInput, color);
   }

   async setBackgroundColor(color: string): Promise<void> {
      await this.pickColor(this.backgroundColorInput, color);
   }

   /**
    * the colour input is hidden within its toolbar button
    */
   private async pickColor(input: Locator, color: string): Promise<void> {
      await input.fill(color, { force: true });
   }

   private async chooseOption(select: string, label: string): Promise<void> {
      await this.root.locator(select).locator('.but_select').click();
      await this.root.page().locator('.but_select_option').filter({ hasText: new RegExp('^\\s*' + label + '\\s*$') }).click();
   }
}

export class TextBox {

   readonly editor: Locator;
   readonly paragraphs: Locator;
   readonly resizeHandle: Locator;
   readonly toolbar: TextBoxToolbar;

   constructor(readonly tile: Locator) {
      this.editor = tile.locator('koia-text-box .ProseMirror');
      this.paragraphs = this.editor.locator('p');
      this.resizeHandle = tile.locator('.resize-handle');
      this.toolbar = new TextBoxToolbar(tile.page().locator('.cdk-overlay-container koia-text-box-toolbar .div_text_box_toolbar'));
   }

   lineBreaksOf(paragraph: number): Locator {
      return this.paragraphs.nth(paragraph).locator('br:not(.ProseMirror-trailingBreak)');
   }

   /**
    * clicks the text, as the empty area of an inactive text box is click-through, and waits for the focus, which is set asynchronously
    */
   async focus(): Promise<void> {
      await this.paragraphs.first().click();
      await expect(this.editor).toBeFocused();
      await expect(this.toolbar.root).toBeVisible();
   }

   /**
    * reveals the click-through frame by hovering the text
    */
   async hover(): Promise<void> {
      await this.paragraphs.first().hover();
   }

   async startMoveBy(dx: number, dy: number): Promise<void> {
      await this.hover();
      const box = await this.tile.boundingBox();
      await pressAndMoveBy(this.tile.page(), box.x + FRAME_PADDING_PX / 2, box.y + FRAME_PADDING_PX / 2, dx, dy);
   }

   async startResizeBy(dx: number, dy: number): Promise<void> {
      await this.hover();
      await pressCenterAndMoveBy(this.resizeHandle, dx, dy);
   }

   async release(): Promise<void> {
      await this.tile.page().mouse.up();
   }

   /**
    * @returns the height of the editor text including its padding, as the editor itself is stretched to the tile
    */
   contentHeight(): Promise<number> {
      return this.editor.evaluate((editor: HTMLElement) => editor.lastElementChild.getBoundingClientRect().bottom
         - editor.getBoundingClientRect().top + parseFloat(getComputedStyle(editor).paddingBottom));
   }

   /**
    * @returns whether the whole text is shown within the frame padding of the tile without being scrolled
    */
   fitsContent(): Promise<boolean> {
      return this.tile.evaluate((tile: HTMLElement, padding: number) => {
         const editorDiv = tile.querySelector('.div_text_box_editor');
         const lastParagraph = tile.querySelector('.ProseMirror').lastElementChild;
         return editorDiv.scrollTop === 0
            && lastParagraph.getBoundingClientRect().bottom <= tile.getBoundingClientRect().bottom - padding;
      }, FRAME_PADDING_PX);
   }

   frameBorderStyle(): Promise<string> {
      return this.tile.evaluate((tile: HTMLElement) => getComputedStyle(tile, '::after').borderTopStyle);
   }

   async type(text: string): Promise<void> {
      await this.editor.page().keyboard.type(text);
   }

   async insert(text: string): Promise<void> {
      await this.editor.page().keyboard.insertText(text);
   }

   async press(key: string, times = 1): Promise<void> {
      for (let i = 0; i < times; i++) {
         await this.editor.page().keyboard.press(key);
      }
   }

   selectedText(): Promise<string> {
      return this.editor.evaluate(() => document.getSelection().toString());
   }

   /**
    * @returns the computed style of the innermost element containing the first occurrence of the word
    */
   styleOf(word: string): Promise<RenderedTextStyle> {
      return this.editor.evaluate((editor: HTMLElement, w: string) => {
         const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
         while (walker.nextNode()) {
            if (walker.currentNode.textContent.includes(w)) {
               const style = getComputedStyle(walker.currentNode.parentElement);
               return { fontWeight: Number(style.fontWeight), fontFamily: style.fontFamily, fontSize: style.fontSize, color: style.color };
            }
         }
         throw new Error('word not found: ' + w);
      }, word);
   }

   /**
    * @returns the characters preceding each automatic line wrap of the editor text
    */
   charactersBeforeWraps(): Promise<string[]> {
      return this.editor.evaluate((editor: HTMLElement) => {
         const wrapped: string[] = [];
         const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
         while (walker.nextNode()) {
            const node = walker.currentNode as Text;
            const range = document.createRange();
            let previousTop: number;
            for (let i = 0; i < node.length; i++) {
               range.setStart(node, i);
               range.setEnd(node, i + 1);
               const top = range.getClientRects()[0]?.top ?? previousTop;
               if (previousTop !== undefined && top > previousTop + 1) {
                  wrapped.push(node.data[i - 1]);
               }
               previousTop = top;
            }
         }
         return wrapped;
      });
   }

   /**
    * @returns whether the placeholder of the empty editor is rendered
    */
   placeholderShown(): Promise<boolean> {
      return this.editor.locator('p.is-editor-empty').evaluate((p: HTMLElement) => {
         const content = getComputedStyle(p, '::before').content;
         return content !== 'none' && content !== 'normal' && content !== '""';
      });
   }
}
