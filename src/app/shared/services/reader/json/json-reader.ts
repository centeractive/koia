import * as oboe from 'oboe';
import { Attribute, DataType } from 'app/shared/model';
import { DataHandler } from '../data-handler.type';
import { DataReader } from '../data-reader.type';
import { Sample } from '../sample.type';
import { PathConverter } from './path-converter';

export class JSONReader implements DataReader {

  private pathConverter = new PathConverter();
  private attrArrayJSONPath = new Attribute('Array JSONPath', 'JSONPath to the object array that contains the data', DataType.TEXT, '');

  getDescription(): string {
    return 'JSON (JavaScript Object Notation) is formatted and self-describing text for storing and interchanging data.\n' +
      'You import an array of flat (non-nested) objects by specifying its JSONPath.';
  }

  getSourceName(): string {
    return 'JSON';
  }

  getFileExtension(): string {
    return '.json';
  }

  expectsPlainTextData() {
    return true;
  }

  furnishAttributes(dataHeader: string): Attribute[] {
    this.detectArrayJSONPaths(dataHeader);
    return [this.attrArrayJSONPath];
  }

  private detectArrayJSONPaths(dataHeader: string): void {
    const paths: string[] = [];
    const url = URL.createObjectURL(new Blob([dataHeader]));
    oboe(url)
      .node('!*..*', (node, path) => {
        if (typeof node === 'object' && typeof path[path.length - 1] === 'number') {
          const jsonPath = this.pathConverter.toJSONPath(path.slice(0, -1));
          if (!paths.includes(jsonPath)) {
            paths.push(jsonPath);
          }
        }
      })
      .fail(err => this.defineArrayJSONPathAttribute(paths))
      .done(() => this.defineArrayJSONPathAttribute(paths));
  }

  private defineArrayJSONPathAttribute(paths: string[]): void {
    if (paths.length > 0) {
      this.attrArrayJSONPath.value = paths[0];
      this.attrArrayJSONPath.valueChoice = paths;
    }
  }

  readSample(url: string, entriesCount: number): Promise<Sample> {
    return new Promise<Sample>((resolve, reject) => {
      let canceled = false;
      const dataHandler: DataHandler = {
        onValues: rows => null,
        onEntries: entries => {
          if (!canceled) {
            canceled = true;
            resolve({ entries: entries });
          }
        },
        onError: err => reject(err),
        onComplete: () => null,
        isCanceled: () => canceled
      }
      this.readData(url, entriesCount, dataHandler);
    });
  }

  readData(url: string, chunkSize: number, dataHandler: DataHandler): void {
    let entries = [];
    const parser = oboe(url)
      .node(this.pathConverter.toOboeMatchPattern(this.attrArrayJSONPath.value), entry => {
        if (dataHandler.isCanceled()) {
          entries = [];
          parser.abort();
        } else {
          entries.push(entry);
          if (entries.length === chunkSize) {
            dataHandler.onEntries(entries);
            entries = [];
          }
          return oboe.drop; // release parsed JSON objects in order to be garbage collected
        }
      })
      .fail(err => dataHandler.onError(err))
      .done(data => {
        if (entries.length > 0) {
          dataHandler.onEntries(entries)
        }
        dataHandler.onComplete();
      });
  }
}
