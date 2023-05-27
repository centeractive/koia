export class TestUtils {

   static generateEntries(columnName: string, count: number, minValue: number, maxValue: number): object[] {
      return TestUtils.expandEntries(new Array(count), columnName, minValue, maxValue);
   }

   static expandEntries(entries: object[], columnName: string, minValue: number, maxValue: number): object[] {
      const diffPerEntry = (maxValue - minValue) / (entries.length - 1);
      let value = minValue;
      for (let i = 0; i < entries.length - 1; i++) {
         entries[i] = entries[i] || {};
         entries[i][columnName] = value;
         value += diffPerEntry;
      }
      const iLastEntry = entries.length - 1;
      entries[iLastEntry] = entries[iLastEntry] || {};
      entries[iLastEntry][columnName] = maxValue;
      return entries;
   }
}
