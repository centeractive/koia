import { TestBed } from '@angular/core/testing';

import { ReaderService } from './reader.service';
import { CSVReader } from './csv/csv-reader';
import { JSONReader } from './json/json-reader';
import { ExcelReader } from './excel/excel-reader';

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

  it('#readHeader should return file start when bytesCount is less than file size', (done) => {
    service.readHeader(file, 3)
      .then(s => {
        expect(s).toBe('A,B');
        done();
      })
      .catch(e => fail(e));
  });

  it('#readHeader should return entire file content when bytesCount is greater than file size', (done) => {
    service.readHeader(file, 100)
      .then(s => {
        expect(s).toBe(text);
        done();
      })
      .catch(e => fail(e));
  });

  function createFile(data: string): File {
    return new File([data], 'test.txt', { type: 'text/plain' });
  }
});
