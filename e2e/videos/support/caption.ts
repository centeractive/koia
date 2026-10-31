const CAPTION_STYLE = 'position:absolute;left:50%;bottom:40px;transform:translateX(-50%);padding:10px 20px;border-radius:12px;'
   + 'background:rgba(26,35,126,.88);color:#fff;font:500 22px/1.4 system-ui,sans-serif;white-space:nowrap';

/** longest caption fitting on one line of the recorded video */
export const MAX_CAPTION_LENGTH = 70;

/**
 * @returns the caption shown centred above the bottom of the page
 */
export function captionHtml(text: string): string {
   if (text.length > MAX_CAPTION_LENGTH) {
      throw new Error('caption longer than ' + MAX_CAPTION_LENGTH + ' characters: ' + text);
   }
   return '<div style="' + CAPTION_STYLE + '">' + text + '</div>';
}
