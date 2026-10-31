import { Locator } from '@playwright/test';

/**
 * clicks the button opening the file selection and chooses the file once the action while choosing resolved
 */
export async function chooseFile(button: Locator, path: string, whileChoosing: () => Promise<void>): Promise<void> {
   const [fileChooser] = await Promise.all([button.page().waitForEvent('filechooser'), button.click()]);
   await whileChoosing();
   await fileChooser.setFiles(path);
}
