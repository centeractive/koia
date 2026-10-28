/** localStorage access that tolerates unavailable storage */
export class BrowserStorage {

   static read(key: string): string | null {
      try {
         return localStorage.getItem(key);
      } catch {
         return null;
      }
   }

   static write(key: string, value: string, onError: (err: unknown) => void = () => undefined): void {
      try {
         localStorage.setItem(key, value);
      } catch (err) {
         onError(err);
      }
   }
}
