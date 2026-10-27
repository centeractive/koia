import { LanguageService } from '../../language';
import { Attribute, DataType } from 'app/shared/model';
import oboe from 'oboe';
import { EntryHandler } from '../data-handler.type';
import { DataReader } from '../data-reader.type';
import { Sample } from '../sample.type';
import { SourceName } from '../source-name.enum';
import { PathConverter } from './path-converter';

export class JSONReader implements DataReader {

  private pathConverter = new PathConverter();
  private attrArrayJSONPath = JSONReader.createArrayJSONPathAttribute();

  private static createArrayJSONPathAttribute(): Attribute<string> {
    return new Attribute('scene.reader.jsonPath', 'scene.reader.jsonPathDescription', DataType.TEXT, '');
  }

  getDescription(): string {
    return LanguageService.instant('scene.reader.jsonDescription');
  }

  getSourceName(): string {
    return SourceName.JSON;
  }

  getFileExtension(): string {
    return '.json';
  }

  expectsPlainTextData(): boolean {
    return true;
  }

  supportsEncoding(): boolean {
    return false;
  }

  furnishAttributes(dataHeader: string): Attribute[] {
    this.attrArrayJSONPath = JSONReader.createArrayJSONPathAttribute();
    this.detectArrayJSONPaths(dataHeader, this.attrArrayJSONPath);
    return [this.attrArrayJSONPath];
  }

  private detectArrayJSONPaths(dataHeader: string, attr: Attribute<string>): void {
    const paths: string[] = [];
    const url = URL.createObjectURL(new Blob([dataHeader]));
    const done = () => {
      URL.revokeObjectURL(url);
      this.defineArrayJSONPathAttribute(attr, paths);
    };
    oboe(url)
      .node('!*..*', (node, path) => {
        if (typeof node === 'object' && typeof path[path.length - 1] === 'number') {
          const jsonPath = this.pathConverter.toJSONPath(path.slice(0, -1));
          if (!paths.includes(jsonPath)) {
            paths.push(jsonPath);
          }
        }
      })
      .fail(done)
      .done(done);
  }

  private defineArrayJSONPathAttribute(attr: Attribute<string>, paths: string[]): void {
    if (paths.length > 0) {
      attr.value = paths[0];
      attr.valueChoice = paths;
    }
  }

  readSample(file: File, entriesCount: number): Promise<Sample> {
    return new Promise<Sample>((resolve, reject) => {
      let canceled = false;
      const entryHandler: EntryHandler = {
        onEntries: entries => {
          canceled = true;
          resolve({ entries: entries });
        },
        onError: err => reject(err),
        onComplete: () => resolve({ entries: [] }),
        isCanceled: () => canceled
      }
      this.readData(file, entriesCount, entryHandler);
    });
  }

  readData(file: File, chunkSize: number, dataHandler: EntryHandler): void {
    const url = URL.createObjectURL(file);
    const release = () => URL.revokeObjectURL(url);
    let entries = [];
    const parser = oboe(url)
      .node(this.pathConverter.toOboeMatchPattern(this.attrArrayJSONPath.value), entry => {
        if (dataHandler.isCanceled()) {
          entries = [];
          parser.abort();
          release();
        } else {
          entries.push(entry);
          if (entries.length === chunkSize) {
            dataHandler.onEntries(entries);
            entries = [];
          }
          return oboe.drop; // release parsed JSON objects in order to be garbage collected
        }
      })
      .fail(err => {
        release();
        dataHandler.onError(err);
      })
      .done(() => {
        release();
        if (entries.length > 0) {
          dataHandler.onEntries(entries)
        }
        dataHandler.onComplete();
      });
  }
}
