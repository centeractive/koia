export class CouchDBConstants {
   static readonly _ID = '_id';
   static readonly _REV = '_rev';
   static readonly INDEX_DDOC_PREFIX = 'index_';
   static readonly DESIGN_DOC_PREFIX = '_design/';
   /**
    * base of the entry id counter, ids of the same length sort naturally
    */
   static readonly ENTRY_ID_BASE = 1_000_000;
}
