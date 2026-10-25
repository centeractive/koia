export class Base64Utils {

   static encodeUtf8(text: string): string {
      return btoa(Array.from(new TextEncoder().encode(text), byte => String.fromCharCode(byte)).join(''));
   }

   /**
    * @returns the UTF-8 text of the Base64 encoded bytes or, when they are no valid UTF-8, their windows-1252 text
    * @throws DOMException when the text is not Base64 encoded
    */
   static decodeText(base64: string): string {
      const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
      try {
         return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
      } catch {
         return new TextDecoder('windows-1252').decode(bytes);
      }
   }
}
