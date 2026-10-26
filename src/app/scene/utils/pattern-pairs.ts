import { ColumnPair, DataType } from 'app/shared/model';
import { CommonUtils } from 'app/shared/utils';
import { isPatternColumn, patternColumnName } from 'app/shared/utils/column-utils';
import { PatternMasker } from 'app/shared/utils/pattern-masker';

/**
 * manages the pattern mappings among the column mappings of a file import, see [[PatternMasker]]
 */
export class PatternPairs {

   /**
    * pattern mapping to the mapping of its message column, never cleared because a cancelled file selection restores mappings
    */
   private readonly messagePairs = new WeakMap<ColumnPair, ColumnPair>();

   /**
    * whether a source column suits a pattern column, per data sample
    */
   private readonly suitability = new WeakMap<object[], Map<string, boolean>>();

   /**
    * @returns true when a pattern column can be derived from the column of the specified mapping, whose sampled values must be
    * free text
    */
   canAdd(columnPair: ColumnPair, columnMappings: ColumnPair[], sampleEntries: object[]): boolean {
      return !columnPair.skip && columnPair.target.dataType === DataType.TEXT && !isPatternColumn(columnPair.target) &&
         !columnMappings.some(cp => !cp.skip && isPatternColumn(cp.target) && cp.source.name === columnPair.source.name) &&
         !!sampleEntries && this.suits(columnPair.source.name, sampleEntries);
   }

   private suits(sourceName: string, sampleEntries: object[]): boolean {
      let suitabilities = this.suitability.get(sampleEntries);
      if (!suitabilities) {
         suitabilities = new Map();
         this.suitability.set(sampleEntries, suitabilities);
      }
      if (!suitabilities.has(sourceName)) {
         suitabilities.set(sourceName, PatternMasker.suitsColumn(sampleEntries, sourceName));
      }
      return suitabilities.get(sourceName);
   }

   /**
    * inserts a pattern mapping right after the specified mapping, its values are derived from the same source column
    *
    * @param suffix the (translated) word appended to the name of the pattern column
    */
   add(columnPair: ColumnPair, columnMappings: ColumnPair[], suffix: string): void {
      const usedNames = new Set(columnMappings.filter(cp => !cp.skip).map(cp => cp.target.name));
      const name = patternColumnName(columnPair.target.name, usedNames, suffix);
      const patternPair: ColumnPair = {
         source: CommonUtils.clone(columnPair.source),
         target: { name, dataType: DataType.TEXT, width: columnPair.target.width, indexed: true, patternOf: columnPair.target.name }
      };
      this.messagePairs.set(patternPair, columnPair);
      columnMappings.splice(columnMappings.indexOf(columnPair) + 1, 0, patternPair);
   }

   /**
    * links each pattern mapping to the mapping of its message column, which is the one targeting the column the pattern is
    * derived from, or the first one of the same source column otherwise
    */
   link(columnMappings: ColumnPair[]): void {
      const messagePairs = columnMappings.filter(cp => !isPatternColumn(cp.target));
      columnMappings.filter(cp => isPatternColumn(cp.target)).forEach(cp => {
         const messagePair = messagePairs.find(mp => mp.target.name === cp.target.patternOf) ??
            messagePairs.find(mp => mp.source.name === cp.source.name);
         if (messagePair) {
            this.messagePairs.set(cp, messagePair);
         }
      });
   }

   /**
    * lets each pattern column refer to the current name of its message column, or to its source column name when the message
    * column was deleted
    */
   updatePatternOf(columnMappings: ColumnPair[]): void {
      columnMappings.filter(cp => this.messagePairs.has(cp)).forEach(cp => {
         const messagePair = this.messagePairs.get(cp);
         cp.target.patternOf = messagePair.skip ? messagePair.source.name : messagePair.target.name;
      });
   }
}
