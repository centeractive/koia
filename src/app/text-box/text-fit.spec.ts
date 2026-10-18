import type { Mock } from 'vitest';
import { TextFit } from './text-fit';

describe('TextFit', () => {

  let tile: HTMLDivElement;
  let host: HTMLDivElement;
  let content: HTMLDivElement;
  let textFit: TextFit;
  let onFitHeight: Mock<(height: number) => void>;

  beforeEach(() => {
    tile = document.createElement('div');
    tile.style.cssText = 'width: 200px; height: 100px; padding: 6px; box-sizing: border-box';
    host = document.createElement('div');
    host.style.cssText = 'height: 100%';
    content = document.createElement('div');
    content.style.cssText = 'min-height: 100%; padding: 4px 0; box-sizing: border-box';
    content.innerHTML = paragraphs(2);
    host.appendChild(content);
    tile.appendChild(host);
    document.body.appendChild(tile);
    onFitHeight = vi.fn();
  });

  afterEach(() => {
    textFit?.disconnect();
    tile.remove();
  });

  function paragraphs(count: number): string {
    return Array.from({ length: count }, () => '<p style="margin: 0; height: 20px"></p>').join('');
  }

  function createTextFit(): TextFit {
    textFit = new TextFit(tile, host, content, onFitHeight);
    return textFit;
  }

  function scheduleUpdateOf(fit: TextFit): void {
    (fit as unknown as { scheduleUpdate: () => void }).scheduleUpdate();
  }

  function nextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }

  it('#fitHeight should return height of content text plus tile padding', () => {

    // given
    createTextFit();

    // when
    const height = textFit.fitHeight();

    // then
    expect(height).toBe(4 + 2 * 20 + 4 + 2 * 6);
  });

  it('#fitHeight should ignore content stretched to tile', () => {

    // given
    content.innerHTML = paragraphs(1);
    createTextFit();

    // when
    const height = textFit.fitHeight();

    // then
    expect(content.getBoundingClientRect().height).toBe(88);
    expect(height).toBe(4 + 20 + 4 + 2 * 6);
  });

  it('#update should report fit height', () => {

    // given
    createTextFit();

    // when
    textFit.update();

    // then
    expect(onFitHeight).toHaveBeenCalledExactlyOnceWith(60);
  });

  it('should report fit height once observed', async () => {

    // when
    createTextFit();

    // then
    await vi.waitFor(() => expect(onFitHeight).toHaveBeenCalledWith(60));
    await nextFrame();
    expect(onFitHeight).toHaveBeenCalledTimes(1);
  });

  it('should report fit height when content grows beyond tile', async () => {

    // given
    createTextFit();
    await vi.waitFor(() => expect(onFitHeight).toHaveBeenCalled());
    onFitHeight.mockClear();

    // when
    content.innerHTML = paragraphs(5);

    // then
    await vi.waitFor(() => expect(onFitHeight).toHaveBeenCalledExactlyOnceWith(4 + 5 * 20 + 4 + 2 * 6));
  });

  it('should report fit height when tile width changes', async () => {

    // given
    createTextFit();
    await vi.waitFor(() => expect(onFitHeight).toHaveBeenCalled());
    onFitHeight.mockClear();

    // when
    tile.style.width = '300px';

    // then
    await vi.waitFor(() => expect(onFitHeight).toHaveBeenCalledExactlyOnceWith(60));
  });

  it('should report once when observed changes repeat before next frame', async () => {

    // given
    const frameSpy = vi.spyOn(window, 'requestAnimationFrame');
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    createTextFit();
    await vi.waitFor(() => expect(onFitHeight).toHaveBeenCalled());
    onFitHeight.mockClear();
    frameSpy.mockClear();

    // when
    scheduleUpdateOf(textFit);
    const firstFrame = frameSpy.mock.results[0].value;
    scheduleUpdateOf(textFit);
    await nextFrame();

    // then
    expect(cancelSpy).toHaveBeenCalledWith(firstFrame);
    expect(onFitHeight).toHaveBeenCalledTimes(1);
  });

  it('should not report while tile is dragged', async () => {

    // given
    tile.classList.add('cdk-drag-dragging');

    // when
    createTextFit();
    await nextFrame();
    await nextFrame();

    // then
    expect(onFitHeight).not.toHaveBeenCalled();
  });

  it('#disconnect should stop reporting including pending frame', async () => {

    // given
    createTextFit();
    await vi.waitFor(() => expect(onFitHeight).toHaveBeenCalled());
    onFitHeight.mockClear();
    scheduleUpdateOf(textFit);

    // when
    textFit.disconnect();
    content.innerHTML = paragraphs(5);
    await nextFrame();
    await nextFrame();

    // then
    expect(onFitHeight).not.toHaveBeenCalled();
  });
});
