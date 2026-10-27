/**
 * lines of the head of a file, of which the last line may be incomplete because only the head is provided
 */
export class HeaderLines {

   static withoutLastLine(text: string): string {
      const lastLineBreak = text.lastIndexOf('\n');
      return lastLineBreak === -1 ? text : text.substring(0, lastLineBreak);
   }

   /**
    * @returns the non-empty lines of the text without its last line, which may be incomplete, or the only line of a
    * text without line break
    */
   static of(text: string): string[] {
      return HeaderLines.withoutLastLine(text)
         .split(/\r?\n/)
         .filter(line => line.length > 0);
   }
}
