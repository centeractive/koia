import { TestBed } from '@angular/core/testing';
import { CSVReader } from './csv/csv-reader';
import { ExcelReader } from './excel/excel-reader';
import { JSONReader } from './json/json-reader';
import { ReaderService } from './reader.service';

describe('ReaderService', () => {

  let text: string;
  let file: File;
  let service: ReaderService;

  beforeAll(() => {
    text =
      'A,B,C\n' + //
      '1,X,true\n' + //
      '2,Y,false\n' + //
      '3,X,true\n' + //
      '4,Y,false\n' + //
      '5,Z,true';
    file = createFile(text);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(ReaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#getReaders should return distincet readers', () => {

    // when
    const readers = service.getReaders();

    // then
    expect(readers.length).toBe(3);
    expect(readers[0] instanceof CSVReader).toBeTruthy();
    expect(readers[1] instanceof ExcelReader).toBeTruthy();
    expect(readers[2] instanceof JSONReader).toBeTruthy();
  });

  it('#readHeader should return file start when bytesCount is less than file size', async () => {

    // when
    const header = await service.readHeader(file, 3);

    // then
    expect(header).toBe('A,B');
  });

  it('#readHeader should return entire file content when bytesCount is greater than file size', async () => {

    // when
    const header = await service.readHeader(file, 100);

    // then
    expect(header).toBe(text);
  });

  it('#readHeader should reject when file cannot be read', async () => {

    // given
    const error = new ProgressEvent('error') as ProgressEvent<FileReader>;
    vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
      this.onerror(error);
    });

    // when
    const header = service.readHeader(file, 3);

    // then
    await expect(header).rejects.toBe(error);
  });

  function createFile(data: string): File {
    return new File([data], 'test.txt', { type: 'text/plain' });
  }
});
