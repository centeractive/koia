import { Language } from 'app/shared/services/language/language';
import { SampleDef } from './sample-data';

export const APP_LOGS = 'app-logs';

const ROW_COUNT = 2000;

const sceneIdOf = (language: Language) => 'sample_' + APP_LOGS + '_' + language;

const APP_LOGS_SAMPLES: Record<Language, SampleDef> = {
   en: { id: APP_LOGS, file: 'app-logs.en.json', sceneId: sceneIdOf('en'), sceneName: 'App logs (sample)', rowCount: ROW_COUNT },
   de: { id: APP_LOGS, file: 'app-logs.de.json', sceneId: sceneIdOf('de'), sceneName: 'App-Logs (Beispiel)', rowCount: ROW_COUNT },
   ja: { id: APP_LOGS, file: 'app-logs.ja.json', sceneId: sceneIdOf('ja'), sceneName: 'アプリログ（サンプル）', rowCount: ROW_COUNT }
};

export function appLogsSampleOf(language: Language): SampleDef {
   return APP_LOGS_SAMPLES[language];
}
