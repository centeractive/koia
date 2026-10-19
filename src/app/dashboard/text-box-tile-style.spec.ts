import { TextBoxContext } from 'app/shared/model';
import { textBoxTileStyle } from './text-box-tile-style';

describe('textBoxTileStyle', () => {

  it('should return background color, border width and color of text box', () => {

    // given
    const context = new TextBoxContext([]);
    context.backgroundColor = '#ffff00';
    context.borderWidth = 3;
    context.borderColor = '#ff0000';

    // when
    const style = textBoxTileStyle(context);

    // then
    expect(style).toEqual({
      'background-color': '#ffff00',
      '--koia-text-box-border-width': '3px',
      '--koia-text-box-border-color': '#ff0000'
    });
  });

  it('should return null background and border color when unset', () => {

    // when
    const style = textBoxTileStyle(new TextBoxContext([]));

    // then
    expect(style).toEqual({
      'background-color': null,
      '--koia-text-box-border-width': '1px',
      '--koia-text-box-border-color': null
    });
  });
});
