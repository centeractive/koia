import { ExportService } from './export.service';
import { ExportFormat, DataType, Column } from '../../model';
import * as XLSX from '@e965/xlsx';

describe('ExportService', () => {

  let exportService: ExportService;

  beforeEach(() => {
    exportService = new ExportService();
  });

  afterEach(() => vi.useRealTimers());

  it('#exportData should create CSV formatted data', async () => {

    // given
    let blob: Blob;
    vi.spyOn(exportService, 'saveBlobAs').mockImplementation(b => blob = b); // capture argument    
    const data = [{ a: 'x', b: 1 }, { a: 'y', b: 2 }]
    const columns: Column[] = [
      { name: 'a', dataType: DataType.TEXT, width: 10 },
      { name: 'b', dataType: DataType.NUMBER, width: 10 }
    ];

    // when
    exportService.exportData(data, columns, ExportFormat.CSV, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(blob).toBeTruthy();
    expect(await blob.text()).toBe('a,b\nx,1\ny,2');
  });

  it('#exportData should name the file after base name, date and time', () => {

    // given
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 16, 14, 37, 12));
    const saveAsSpy = vi.spyOn(exportService, 'saveBlobAs').mockReturnValue(undefined);
    const column: Column = { name: 'a', dataType: DataType.NUMBER, width: 10 };

    // when
    exportService.exportData([{ a: 1 }], [column], ExportFormat.CSV, 'testfile');

    // then
    expect(vi.mocked(saveAsSpy).mock.lastCall[1]).toBe('testfile_2026-10-16_143712.csv');
  });

  it('#exportData should create CSV with header only when there is no data', async () => {

    // given
    let blob: Blob;
    vi.spyOn(exportService, 'saveBlobAs').mockImplementation(b => blob = b);
    const columns: Column[] = [
      { name: 'a', dataType: DataType.TEXT, width: 10 },
      { name: 'b', dataType: DataType.NUMBER, width: 10 }
    ];

    // when
    exportService.exportData([], columns, ExportFormat.CSV, 'testfile');

    // then
    expect(await blob.text()).toBe('a,b\n');
  });

  it('#exportData should quote CSV values containing delimiter, quotes or line breaks', async () => {

    // given
    let blob: Blob;
    vi.spyOn(exportService, 'saveBlobAs').mockImplementation(b => blob = b);
    const data = [{ a: 'Smith, John', b: 'say "hi"' }, { a: 'line1\nline2', b: 'plain' }, { a: null }];
    const columns: Column[] = [
      { name: 'a', dataType: DataType.TEXT, width: 10 },
      { name: 'b', dataType: DataType.TEXT, width: 10 }
    ];

    // when
    exportService.exportData(data, columns, ExportFormat.CSV, 'testfile');

    // then
    expect(await blob.text()).toBe('a,b\n"Smith, John","say ""hi"""\n"line1\nline2",plain\n,');
  });

  it('#exportData should save .csv file', () => {

    // given
    const saveAsSpy = vi.spyOn(exportService, 'saveBlobAs').mockReturnValue(undefined);
    const column: Column = { name: 'a', dataType: DataType.NUMBER, width: 10 };

    // when
    exportService.exportData([{ a: 1 }], [column], ExportFormat.CSV, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(vi.mocked(saveAsSpy).mock.lastCall[1]).toMatch(/testfile.*\.csv/);
  });

  it('#exportData should save .xlsx file', () => {

    // given
    const saveAsSpy = vi.spyOn(exportService, 'saveBlobAs').mockReturnValue(undefined);
    const column: Column = { name: 'a', dataType: DataType.NUMBER, width: 10 };

    // when
    exportService.exportData([{ a: 1 }], [column], ExportFormat.EXCEL, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(vi.mocked(saveAsSpy).mock.lastCall[1]).toMatch(/testfile.*\.xlsx/);
  });

  it('#exportData should create Excel sheet with header only when there is no data', async () => {

    // given
    let blob: Blob;
    vi.spyOn(exportService, 'saveBlobAs').mockImplementation(b => blob = b);
    const columns: Column[] = [
      { name: 'a', dataType: DataType.TEXT, width: 10 },
      { name: 'b', dataType: DataType.NUMBER, width: 10 }
    ];

    // when
    exportService.exportData([], columns, ExportFormat.EXCEL, 'testfile');

    // then
    const workbook = XLSX.read(await blob.arrayBuffer());
    expect(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 })).toEqual([['a', 'b']]);
  });

  it('#exportData should create JSON formatted data', async () => {

    // given
    let blob: Blob;
    vi.spyOn(exportService, 'saveBlobAs').mockImplementation(b => blob = b); // capture argument
    const data = [{ a: 'x', b: 1 }, { a: 'y', b: 2 }]
    const columns: Column[] = [
      { name: 'a', dataType: DataType.TEXT, width: 10 },
      { name: 'b', dataType: DataType.NUMBER, width: 10 }
    ];

    // when
    exportService.exportData(data, columns, ExportFormat.JSON, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(blob).toBeTruthy();
    expect(JSON.parse(await blob.text())).toEqual(data);
  });

  it('#exportData should save .json file', () => {

    // given
    const saveAsSpy = vi.spyOn(exportService, 'saveBlobAs').mockReturnValue(undefined);
    const column: Column = { name: 'a', dataType: DataType.NUMBER, width: 10 };

    // when
    exportService.exportData([{ a: 1 }], [column], ExportFormat.JSON, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(vi.mocked(saveAsSpy).mock.lastCall[1]).toMatch(/testfile.*\.json/);
  });

  it('#exportData should throw error when format is not supported', () => {
    const column: Column = { name: 'a', dataType: DataType.NUMBER, width: 10 };

    expect(() => exportService.exportData([{ a: 1 }], [column], ExportFormat.PNG, 'testfile')).toThrow(expect.objectContaining({ message: 'export format PNG is not supported' }));
  });

  it('#exportTableAsExcel should save .xlsx file', () => {

    // given
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.appendChild(document.createTextNode('test'));
    tr.appendChild(td)
    tbody.appendChild(tr);
    table.appendChild(tbody);
    const saveAsSpy = vi.spyOn(exportService, 'saveBlobAs').mockReturnValue(undefined);

    // when
    exportService.exportTableAsExcel(table, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(vi.mocked(saveAsSpy).mock.lastCall[1]).toMatch(/testfile.*\.xlsx/);
  });

  it('#exportTableAsExcel should write numbers as numbers and labels as text', async () => {

    // given
    const table = document.createElement('table');
    table.innerHTML = '<tbody><tr><th>2024-01-02</th><td data-value="1234.5">1,234.50</td><td data-value="0.25">25.0%</td></tr></tbody>';
    const saveAsSpy = vi.spyOn(exportService, 'saveBlobAs').mockReturnValue(undefined);

    // when
    exportService.exportTableAsExcel(table, 'testfile');

    // then
    const blob: Blob = vi.mocked(saveAsSpy).mock.lastCall[0];
    const sheet = XLSX.read(await blob.arrayBuffer(), { cellNF: true }).Sheets['data'];
    expect(sheet['A1']).toMatchObject({ t: 's', v: '2024-01-02' });
    expect(sheet['B1']).toMatchObject({ t: 'n', v: 1234.5 });
    expect(sheet['C1']).toMatchObject({ t: 'n', v: 0.25, z: '0.0%' });
  });

  it('#exportImage should save .png file', () => {

    // given
    const saveAsSpy = vi.spyOn(exportService, 'saveUrlAs').mockReturnValue(undefined);

    // when
    exportService.exportImage('base64Image...', ExportFormat.PNG, 'testfile');

    // then
    //expect(vi.mocked(saveAsSpy).mock.lastCall[0]).toBe('base64Image...');
    expect(vi.mocked(saveAsSpy).mock.lastCall[1]).toMatch(/testfile.*\.png/);
  });

  it('#saveBlobAs should click anchor with object URL and file name', () => {

    // given
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/123');
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockReturnValue(undefined);

    // when
    exportService.saveBlobAs(new Blob(['x']), 'testfile.csv');

    // then
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.href).toBe('blob:http://localhost/123');
    expect(anchor.download).toBe('testfile.csv');
  });

  it('#saveBlobAs should revoke object URL after download started', () => {

    // given
    vi.useFakeTimers();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/123');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockReturnValue(undefined);

    // when
    exportService.saveBlobAs(new Blob(['x']), 'testfile.csv');

    // then
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(ExportService.OBJECT_URL_LIFETIME_MS);
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:http://localhost/123');
  });

  it('#exportImage should throw error when format is not supported', () => {
    expect(() => exportService.exportImage('base64Image...', ExportFormat.JSON, 'testfile')).toThrow(expect.objectContaining({ message: 'export format JSON is not supported' }));
  });

});
