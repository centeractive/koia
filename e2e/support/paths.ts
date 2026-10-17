import { readFileSync } from 'fs';
import { resolve } from 'path';

export const SRC_DIR = resolve(__dirname, '../../src');
export const E2E_DATA_DIR = resolve(__dirname, '../data');

export function jsonOf(path: string): any {
   return JSON.parse(readFileSync(path, 'utf-8'));
}
