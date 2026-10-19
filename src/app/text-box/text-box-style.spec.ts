import { colorInputValue, DEFAULT_TEXT_COLOR, fontFamilyLabel, toHexColor } from './text-box-style';

describe('text-box-style', () => {

  describe('colorInputValue', () => {

    it.each([
      { color: '#a1b2c3', expected: '#a1b2c3' },
      { color: '#FFF9C4CC', expected: '#FFF9C4' },
      { color: '#a1b2c3zz', expected: '#000001' },
      { color: undefined, expected: '#000001' },
      { color: 'red', expected: '#000001' }
    ])('should return $expected for $color', ({ color, expected }) => {

      // when
      const value = colorInputValue(color, '#000001');

      // then
      expect(value).toBe(expected);
    });
  });

  describe('fontFamilyLabel', () => {

    it('should return label of known font family', () => {

      // when
      const label = fontFamilyLabel('Georgia, serif');

      // then
      expect(label).toBe('Georgia');
    });

    it('should return first font of unknown font family', () => {

      // when
      const label = fontFamilyLabel('Tahoma, Geneva, sans-serif');

      // then
      expect(label).toBe('Tahoma');
    });

    it('should return unquoted first font of unknown quoted font family', () => {

      // when
      const label = fontFamilyLabel(' "Segoe UI" , \'Open Sans\'');

      // then
      expect(label).toBe('Segoe UI');
    });
  });

  describe('toHexColor', () => {

    it('should return hex color unchanged', () => {

      // when
      const color = toHexColor('#A0b1C2');

      // then
      expect(color).toBe('#A0b1C2');
    });

    it('should convert rgb color to hex color', () => {

      // when
      const color = toHexColor('rgb(255, 0, 10)');

      // then
      expect(color).toBe('#ff000a');
    });

    it('should return default text color when undefined', () => {

      // when
      const color = toHexColor(undefined);

      // then
      expect(color).toBe(DEFAULT_TEXT_COLOR);
    });

    it('should return default text color when not a color', () => {

      // when
      const color = toHexColor('red');

      // then
      expect(color).toBe(DEFAULT_TEXT_COLOR);
    });
  });
});
