import { Language } from '../../language/language';

export enum LogLevelCategory {
   ERROR = 'ERROR',
   WARN = 'WARN',
   OTHER = 'OTHER'
}

type NamesByCategory = Record<LogLevelCategory, string[]>;

const COMMON_NAMES: NamesByCategory = {
   [LogLevelCategory.ERROR]: ['EMERGENCY', 'FATAL', 'CRITICAL', 'ALERT', 'ERROR', 'SEVERE'],
   [LogLevelCategory.WARN]: ['WARN', 'WARNING'],
   [LogLevelCategory.OTHER]: ['INFO', 'INFORMATION', 'CONFIG', 'CONFIGURATION', 'DEBUG', 'TRACE', 'FINE', 'DETAIL', 'VERBOSE',
      'FINER', 'FINEST']
};

const LANGUAGE_NAMES: Record<Language, NamesByCategory> = {
   en: {
      [LogLevelCategory.ERROR]: [],
      [LogLevelCategory.WARN]: [],
      [LogLevelCategory.OTHER]: []
   },
   de: {
      [LogLevelCategory.ERROR]: ['SCHWERWIEGEND'],
      [LogLevelCategory.WARN]: ['WARNUNG'],
      [LogLevelCategory.OTHER]: ['KONFIGURATION', 'FEIN', 'FEINER', 'AM FEINSTEN']
   },
   ja: {
      [LogLevelCategory.ERROR]: ['致命的', '重大', 'エラー'],
      [LogLevelCategory.WARN]: ['警告'],
      [LogLevelCategory.OTHER]: ['構成', '情報', 'デバッグ', '普通', 'トレース', '詳細', 'さらに詳細', '最も詳細']
   }
};

const BG_COLORS: Record<LogLevelCategory, string | undefined> = {
   [LogLevelCategory.ERROR]: '#ff785a',
   [LogLevelCategory.WARN]: '#fed255',
   [LogLevelCategory.OTHER]: undefined
};

/**
 * log level names and colors as defined by the default log level configuration of the Retrospective Log Analyzer
 */
export class LogLevels {

   /**
    * @returns the log level names recognized in the specified language, longest first
    */
   static namesOf(language: Language): string[] {
      return Object.values(LogLevelCategory)
         .flatMap(category => LogLevels.categoryNamesOf(category, language))
         .sort((a, b) => b.length - a.length);
   }

   /**
    * @returns the category of the specified log level name (case-insensitive), undefined when the value is no log level name
    */
   static categoryOf(value: unknown, language: Language): LogLevelCategory | undefined {
      if (typeof value !== 'string') {
         return undefined;
      }
      const name = value.trim().toUpperCase();
      return Object.values(LogLevelCategory).find(category => LogLevels.categoryNamesOf(category, language).includes(name));
   }

   /**
    * @returns the row background color of the specified category, undefined when rows of the category are not highlighted
    */
   static bgColorOf(category: LogLevelCategory): string | undefined {
      return BG_COLORS[category];
   }

   private static categoryNamesOf(category: LogLevelCategory, language: Language): string[] {
      return [...COMMON_NAMES[category], ...LANGUAGE_NAMES[language][category]];
   }
}
