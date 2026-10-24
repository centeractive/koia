import * as XLSX from '@e965/xlsx';
import { typedTableClone } from './typed-table';

describe('typedTableClone', () => {

   function tableOf(cellHTML: string): HTMLTableElement {
      const table = document.createElement('table');
      table.innerHTML = '<tbody><tr>' + cellHTML + '</tr></tbody>';
      return table;
   }

   function firstCellOf(table: HTMLTableElement): XLSX.CellObject {
      return XLSX.utils.table_to_sheet(typedTableClone(table))['A1'];
   }

   it('should type cell with numeric data value as number', () => {
      expect(firstCellOf(tableOf('<td data-value="1234.5">1,234.50</td>'))).toMatchObject({ t: 'n', v: 1234.5 });
   });

   it('should format cell with numeric data value and percent text as percentage', () => {
      expect(firstCellOf(tableOf('<td data-value="0.25">25.0%</td>'))).toMatchObject({ t: 'n', v: 0.25, z: '0.0%' });
   });

   it('should keep label cell looking like a date as text', () => {
      expect(firstCellOf(tableOf('<th>2024-01-02</th>'))).toMatchObject({ t: 's', v: '2024-01-02' });
   });

   it('should keep cell with non-numeric data value as text', () => {
      expect(firstCellOf(tableOf('<td data-value="NaN">NaN</td>'))).toMatchObject({ t: 's', v: 'NaN' });
   });

   it('should keep cell with number-like text data value as text', () => {
      expect(firstCellOf(tableOf('<td data-value="00123">00123</td>'))).toMatchObject({ t: 's', v: '00123' });
   });

   it('should leave empty cell untyped', () => {
      expect(firstCellOf(tableOf('<td></td>'))).toMatchObject({ t: 'z' });
   });

   it('should leave original table unchanged', () => {

      // given
      const table = tableOf('<td data-value="0.25">25.0%</td><th>label</th>');

      // when
      typedTableClone(table);

      // then
      table.querySelectorAll('td, th').forEach(cell => {
         expect(cell.hasAttribute('data-v')).toBe(false);
         expect(cell.hasAttribute('data-z')).toBe(false);
         expect(cell.hasAttribute('data-t')).toBe(false);
      });
   });
});
