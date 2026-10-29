export enum FileDialogKind {
   SAVE = 'Save',
   OPEN = 'Open'
}

const TITLES: Record<FileDialogKind, string> = { [FileDialogKind.SAVE]: 'Save As', [FileDialogKind.OPEN]: 'Open' };
const FOLDERS = ['Desktop', 'Documents', 'Downloads'];
const SELECTED_FOLDER = 'Documents';
const FONT = 'font:400 15px/1.4 system-ui,sans-serif;color:#1f1f1f';
const SELECTED = 'background:#dbe8fb';
const BUTTON = 'padding:6px 22px;border-radius:4px;border:1px solid #9aa0a6;background:#fff';
const DEFAULT_BUTTON = 'padding:6px 22px;border-radius:4px;border:1px solid #1a73e8;background:#1a73e8;color:#fff';

function escaped(text: string): string {
   return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * @returns a neutral desktop file dialog showing only the file name, centred above the page
 */
export function fileDialogHtml(kind: FileDialogKind, fileName: string): string {
   const name = escaped(fileName);
   const folders = FOLDERS.map(f => '<div style="padding:6px 12px;' + (f === SELECTED_FOLDER ? SELECTED : '') + '">' + f + '</div>').join('');
   return '<div style="position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:560px;height:340px;display:flex;'
      + 'flex-direction:column;border-radius:8px;overflow:hidden;background:#f3f3f3;box-shadow:0 12px 40px rgba(0,0,0,.45);' + FONT + '">'
      + '<div style="padding:10px 16px;background:#fff;border-bottom:1px solid #ddd;font-weight:600">' + TITLES[kind] + '</div>'
      + '<div style="flex:1;display:flex;min-height:0">'
      + '<div style="width:150px;padding-top:8px;border-right:1px solid #ddd">' + folders + '</div>'
      + '<div style="flex:1;padding:8px;background:#fff"><div style="padding:6px 10px;' + SELECTED + '">' + name + '</div></div>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid #ddd">'
      + '<span>File name:</span>'
      + '<span style="flex:1;padding:5px 8px;border:1px solid #9aa0a6;border-radius:4px;background:#fff">' + name + '</span>'
      + '<span style="' + DEFAULT_BUTTON + '">' + kind + '</span>'
      + '<span style="' + BUTTON + '">Cancel</span>'
      + '</div></div>';
}
