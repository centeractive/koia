import { Language } from 'app/shared/services/language/language';
import { SampleDef } from './sample-data';

export const FRUIT_SALES = 'fruit-sales';

const ROW_COUNT = 2000;

const sceneIdOf = (language: Language) => 'sample_' + FRUIT_SALES + '_' + language;

const FRUIT_SALES_SAMPLES: Record<Language, SampleDef> = {
   en: { id: FRUIT_SALES, file: 'fruit-sales.en.json', sceneId: sceneIdOf('en'), sceneName: 'Fruit sales (sample)', rowCount: ROW_COUNT },
   de: { id: FRUIT_SALES, file: 'fruit-sales.de.json', sceneId: sceneIdOf('de'), sceneName: 'Obstverkauf (Beispiel)', rowCount: ROW_COUNT },
   ja: { id: FRUIT_SALES, file: 'fruit-sales.ja.json', sceneId: sceneIdOf('ja'), sceneName: '果物の売上（サンプル）', rowCount: ROW_COUNT }
};

export function fruitSalesSampleOf(language: Language): SampleDef {
   return FRUIT_SALES_SAMPLES[language];
}
