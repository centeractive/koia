import { SampleLanguage } from './sample-language';

export interface SampleDef {
   id: string;
   /** file with the scene, its preconfigured view tabs and its entries */
   file: string;
   sceneName: string;
   rowCount: number;
}

export const FRUIT_SALES = 'fruit-sales';

const ROW_COUNT = 2000;

const FRUIT_SALES_SAMPLES: Record<SampleLanguage, SampleDef> = {
   en: { id: FRUIT_SALES, file: 'fruit-sales.en.json', sceneName: 'Fruit sales (sample)', rowCount: ROW_COUNT },
   de: { id: FRUIT_SALES, file: 'fruit-sales.de.json', sceneName: 'Obstverkauf (Beispiel)', rowCount: ROW_COUNT },
   ja: { id: FRUIT_SALES, file: 'fruit-sales.ja.json', sceneName: '果物の売上（サンプル）', rowCount: ROW_COUNT }
};

export function fruitSalesSampleOf(language: SampleLanguage): SampleDef {
   return FRUIT_SALES_SAMPLES[language];
}
