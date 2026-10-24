/**
 * @returns a clone of the table whose cells SheetJS reads as typed: a cell with a numeric data-value becomes that number,
 * formatted as percentage when its text ends with %, any other non-empty cell remains text
 */
export function typedTableClone(table: HTMLTableElement): HTMLTableElement {
   const clone = table.cloneNode(true) as HTMLTableElement;
   clone.querySelectorAll('td, th').forEach(cell => {
      const value = cell.getAttribute('data-value');
      if (value !== null && Number.isFinite(Number(value)) && String(Number(value)) === value) {
         cell.setAttribute('data-v', value);
         if (cell.textContent.trim().endsWith('%')) {
            cell.setAttribute('data-z', '0.0%');
         }
      } else if (cell.innerHTML !== '') {
         cell.setAttribute('data-t', 's');
      }
   });
   return clone;
}
