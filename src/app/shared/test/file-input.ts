/**
 * selects the file in the file input as the user would and fires its change event
 */
export function selectFile(input: HTMLInputElement, file: File): void {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
  input.dispatchEvent(new Event('change'));
}
