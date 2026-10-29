import { expect, test } from './support/fixtures';
import { fileDialogHtml, FileDialogKind } from './videos/support/file-dialog';

const FILE_NAME = 'sales.koia';

test('save dialog shows the file name and a Save button', () => {
   const kind = FileDialogKind.SAVE;

   const html = fileDialogHtml(kind, FILE_NAME);

   expect(html).toContain('>Save As<');
   expect(html).toContain('>' + FILE_NAME + '<');
   expect(html).toContain('>Save<');
});

test('open dialog shows the file name and an Open button', () => {
   const kind = FileDialogKind.OPEN;

   const html = fileDialogHtml(kind, FILE_NAME);

   expect(html.match(/>Open</g)).toHaveLength(2);
   expect(html).toContain('>' + FILE_NAME + '<');
});

test('file name is shown as text, not as markup', () => {
   const fileName = 'a<b>&"c".koia';

   const html = fileDialogHtml(FileDialogKind.OPEN, fileName);

   expect(html).toContain('>a&lt;b&gt;&amp;&quot;c&quot;.koia<');
   expect(html).not.toContain('<b>');
});
