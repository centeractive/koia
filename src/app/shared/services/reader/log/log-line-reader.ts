/**
 * reads a text file slice by slice and passes its lines on, without loading the whole file into memory
 */
export class LogLineReader {

   constructor(private readonly sliceSize = 1_048_576) { }

   /**
    * @param onLine receives each line without line break, returns false to stop reading
    * @returns a promise that resolves when all lines are read or reading was stopped
    */
   async read(file: Blob, encoding: string, onLine: (line: string) => boolean): Promise<void> {
      const decoder = LogLineReader.decoderOf(encoding);
      let rest = '';
      for (let offset = 0; offset < file.size; offset += this.sliceSize) {
         const text = rest + decoder.decode(await file.slice(offset, offset + this.sliceSize).arrayBuffer(), { stream: true });
         const lines = text.split('\n');
         rest = lines.pop();
         if (!LogLineReader.emit(lines, onLine)) {
            return;
         }
      }
      const tail = rest + decoder.decode();
      if (tail) {
         LogLineReader.emit([tail], onLine);
      }
   }

   private static emit(lines: string[], onLine: (line: string) => boolean): boolean {
      return lines.every(line => onLine(line.endsWith('\r') ? line.slice(0, -1) : line));
   }

   /**
    * falls back to UTF-8 for character sets the browser cannot decode, as [[FileReader#readAsText]] does
    */
   private static decoderOf(encoding: string): TextDecoder {
      try {
         return new TextDecoder(encoding);
      } catch {
         return new TextDecoder('utf-8');
      }
   }
}
