import { ParamMap } from '@angular/router';

export class QueryParams implements ParamMap {

   readonly keys: string[] = [];
   private params = new Map();

   set(name: string, value: string) {
      this.keys.push(name);
      this.params.set(name, value);
   }

   has(name: string): boolean {
      return this.params.has(name);
   }

   get(name: string): string | null {
      return this.params.get(name);
   }

   getAll(name: string): string[] {
      return this.params.has(name) ? [this.params.get(name)] : [];
   }
}
