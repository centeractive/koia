import { Base64Utils } from './base64-utils';

describe('Base64Utils', () => {

   it('#encodeUtf8 should encode ASCII text', () => {
      expect(Base64Utils.encodeUtf8('test:secret')).toBe('dGVzdDpzZWNyZXQ=');
   });

   it('#encodeUtf8 should encode umlaut as UTF-8', () => {
      expect(Base64Utils.encodeUtf8('ü')).toBe('w7w=');
   });

   it('#encodeUtf8 should encode Japanese text as UTF-8', () => {
      expect(Base64Utils.encodeUtf8('日本')).toBe('5pel5pys');
   });

   it('#decodeText should decode UTF-8 text', () => {
      expect(Base64Utils.decodeText('cMOk5pel5pys')).toBe('pä日本');
   });

   it('#decodeText should decode windows-1252 text when bytes are no valid UTF-8', () => {
      expect(Base64Utils.decodeText('/IA=')).toBe('ü€');
   });

   it('#decodeText should keep byte order mark', () => {
      expect(Base64Utils.decodeText('77u/YQ==')).toBe('﻿a');
   });

   it('#decodeText should decode empty text', () => {
      expect(Base64Utils.decodeText('')).toBe('');
   });

   it('#decodeText should throw when text is not Base64 encoded', () => {
      expect(() => Base64Utils.decodeText('a!')).toThrow(DOMException);
   });

   it('#decodeText should return original text of encodeUtf8 result', () => {

      // given
      const text = 'pä日本 +/=';

      // when
      const decoded = Base64Utils.decodeText(Base64Utils.encodeUtf8(text));

      // then
      expect(decoded).toBe(text);
   });
});
