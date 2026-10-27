import { LogLineReader } from './log-line-reader';

describe('LogLineReader', () => {

   async function linesOf(blob: Blob, reader = new LogLineReader(), encoding = 'UTF-8'): Promise<string[]> {
      const lines: string[] = [];
      await reader.read(blob, encoding, line => {
         lines.push(line);
         return true;
      });
      return lines;
   }

   it('#read should pass lines of LF and CRLF line breaks without line break', async () => {

      // when
      const lines = await linesOf(new Blob(['first\nsecond\r\nthird\n']));

      // then
      expect(lines).toEqual(['first', 'second', 'third']);
   });

   it('#read should pass last line without line break', async () => {

      // when
      const lines = await linesOf(new Blob(['first\nlast']));

      // then
      expect(lines).toEqual(['first', 'last']);
   });

   it('#read should join line split across slices and drop carriage return at end of slice', async () => {

      // when
      const lines = await linesOf(new Blob(['abc\r\ndef\r\n']), new LogLineReader(4));

      // then
      expect(lines).toEqual(['abc', 'def']);
   });

   it('#read should decode multi-byte character split across slices', async () => {

      // when
      const lines = await linesOf(new Blob(['aä€b\n']), new LogLineReader(2));

      // then
      expect(lines).toEqual(['aä€b']);
   });

   it('#read should replace incomplete multi-byte character at end of file', async () => {

      // when
      const lines = await linesOf(new Blob([new Uint8Array([0x61, 0xE2, 0x82])]));

      // then
      expect(lines).toEqual(['a�']);
   });

   it('#read should decode file of specified encoding', async () => {

      // given
      const shiftJis = new Uint8Array([0x82, 0xA0, 0x0A]);

      // when
      const lines = await linesOf(new Blob([shiftJis]), new LogLineReader(), 'Shift_JIS');

      // then
      expect(lines).toEqual(['あ']);
   });

   it('#read should decode as UTF-8 when encoding is not supported by browser', async () => {

      // when
      const lines = await linesOf(new Blob(['ä\n']), new LogLineReader(), 'UTF-32BE');

      // then
      expect(lines).toEqual(['ä']);
   });

   it('#read should stop when line handler returns false', async () => {

      // given
      const lines: string[] = [];

      // when
      await new LogLineReader(2).read(new Blob(['a\nb\nc\nd\n']), 'UTF-8', line => {
         lines.push(line);
         return lines.length < 2;
      });

      // then
      expect(lines).toEqual(['a', 'b']);
   });

   it('#read should pass no line of empty file', async () => {
      expect(await linesOf(new Blob([]))).toEqual([]);
   });

   it('#read should reject when file cannot be read', async () => {

      // given
      vi.spyOn(Blob.prototype, 'arrayBuffer').mockRejectedValue('read error');

      // when
      const result = linesOf(new Blob(['a\n']));

      // then
      await expect(result).rejects.toBe('read error');
   });
});
