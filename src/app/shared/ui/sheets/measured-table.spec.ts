import { measureTable } from './measured-table';

describe('measureTable', () => {

  let table: HTMLTableElement;

  beforeEach(() => {
    table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.innerHTML = '<tr><td style="height: 20px; width: 100px; padding: 0; border: 2px solid black"></td></tr>'
      + '<tr><td style="height: 30px; padding: 0; border: 2px solid black"></td></tr>';
    document.body.appendChild(table);
  });

  afterEach(() => table.remove());

  it('should measure height and rows relative to table top', () => {

    // when
    const result = measureTable(table);

    // then
    const tableTop = table.getBoundingClientRect().top;
    const rects = Array.from(table.rows).map(row => row.getBoundingClientRect());
    expect(result.element).toBe(table);
    expect(result.height).toBe(table.offsetHeight);
    expect(result.rows).toEqual(rects.map(r => ({ top: r.top - tableTop, bottom: r.bottom - tableTop })));
    expect(result.rows[1].bottom - result.rows[1].top).toBeGreaterThan(result.rows[0].bottom - result.rows[0].top);
  });

  it('should measure grid line of first cell', () => {

    // when
    const result = measureTable(table);

    // then
    expect(result.gridLine).toBe(2);
  });

  it('should measure no grid line of table without cells', () => {

    // given
    table.innerHTML = '';

    // when
    const result = measureTable(table);

    // then
    expect(result.rows).toEqual([]);
    expect(result.gridLine).toBe(0);
  });

  it('should measure no grid line of table outside document', () => {

    // given
    table.remove();

    // when
    const result = measureTable(table);

    // then
    expect(result.gridLine).toBe(0);
  });
});
