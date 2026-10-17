import { TestBed } from '@angular/core/testing';
import { LanguageService } from 'app/shared/services/language';
import { Aggregation } from './aggregation.enum';
import { ChartType } from './chart/chart-type';
import { DataType } from './data-type.enum';
import { EnumLabels } from './enum-labels';
import { ExportFormat } from './export-format.enum';
import { Operator } from './operator.enum';
import { TimeUnit } from './time-unit.enum';

describe('EnumLabels', () => {

   async function useLanguage(language: 'de' | 'ja'): Promise<void> {
      vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
      await TestBed.inject(LanguageService).use(language);
   }

   afterEach(() => document.documentElement.lang = 'en');

   it('should provide keys composed of enum member names', () => {
      expect(EnumLabels.aggregationKey(Aggregation.AVG)).toBe('enum.aggregation.AVG');
      expect(EnumLabels.operatorKey(Operator.LESS_THAN_OR_EQUAL)).toBe('enum.operator.LESS_THAN_OR_EQUAL');
      expect(EnumLabels.timeUnitKey(TimeUnit.MONTH)).toBe('enum.timeUnit.MONTH');
      expect(EnumLabels.dataTypeKey(DataType.TEXT)).toBe('enum.dataType.TEXT');
      expect(EnumLabels.exportFormatKey(ExportFormat.EXCEL)).toBe('enum.exportFormat.EXCEL');
      expect(EnumLabels.chartTypeKey(ChartType.LINEAR_BAR.type)).toBe('enum.chartType.linearBar');
   });

   it('English labels should equal enum values and chart type names', () => {
      Object.values(Aggregation).forEach(a => expect(EnumLabels.aggregation(a)).toBe(a));
      Object.values(Operator).forEach(o => expect(EnumLabels.operator(o)).toBe(o));
      Object.values(TimeUnit).forEach(u => expect(EnumLabels.timeUnit(u)).toBe(u));
      Object.values(DataType).forEach(t => expect(EnumLabels.dataType(t)).toBe(t));
      Object.values(ExportFormat).forEach(f => expect(EnumLabels.exportFormat(f)).toBe(f));
      ChartType.ALL.forEach(t => expect(EnumLabels.chartType(t.type)).toBe(t.name));
   });

   it('should translate labels without changing enum values', async () => {

      // when
      await useLanguage('de');

      // then
      expect(EnumLabels.aggregation(Aggregation.SUM)).toBe('Summe');
      expect(EnumLabels.operator(Operator.EMPTY)).toBe('ist leer');
      expect(EnumLabels.timeUnit(TimeUnit.MONTH)).toBe('Monat');
      expect(EnumLabels.chartType(ChartType.PIE.type)).toBe('Kreis');
      expect(Aggregation.SUM).toBe('Sum');
   });

   it('should return enum value when no translation exists', () => {
      expect(EnumLabels.chartType('unknown')).toBe('unknown');
   });

   it('should fall back to enum value when aggregation is unknown', () => {

      // given
      const aggregation = 'unknown' as Aggregation;

      // when
      const key = EnumLabels.aggregationKey(aggregation);

      // then
      expect(key).toBe('enum.aggregation.unknown');
      expect(EnumLabels.aggregation(aggregation)).toBe('unknown');
   });

   it('should translate all labels into Japanese', async () => {

      // when
      await useLanguage('ja');

      // then
      Object.values(Aggregation).forEach(a => expect(EnumLabels.aggregation(a)).not.toBe(EnumLabels.aggregationKey(a)));
      ChartType.ALL.forEach(t => expect(EnumLabels.chartType(t.type)).not.toBe(t.name));
   });
});
