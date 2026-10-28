import { BrowserStorage } from './browser-storage';

describe('BrowserStorage', () => {

  const KEY = 'koia.test';

  afterEach(() => localStorage.removeItem(KEY));

  it('#read should return stored value', () => {

    // given
    localStorage.setItem(KEY, 'value');

    // when
    const value = BrowserStorage.read(KEY);

    // then
    expect(value).toBe('value');
  });

  it('#read should return null when nothing is stored', () => {

    // when
    const value = BrowserStorage.read(KEY);

    // then
    expect(value).toBeNull();
  });

  it('#read should return null when storage is not accessible', () => {

    // given
    localStorage.setItem(KEY, 'value');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });

    // when
    const value = BrowserStorage.read(KEY);

    // then
    expect(value).toBeNull();
  });

  it('#write should store value', () => {

    // when
    BrowserStorage.write(KEY, 'value');

    // then
    expect(localStorage.getItem(KEY)).toBe('value');
  });

  it('#write should pass error to error handler when storage is not accessible', () => {

    // given
    const error = new Error('quota');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw error; });
    const onError = vi.fn();

    // when
    BrowserStorage.write(KEY, 'value', onError);

    // then
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('#write should ignore error when storage is not accessible and no error handler is given', () => {

    // given
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });

    // when
    const write = () => BrowserStorage.write(KEY, 'value');

    // then
    expect(write).not.toThrow();
  });
});
