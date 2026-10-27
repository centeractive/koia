import { QueryConverter } from 'app/shared/services/backend/mango/query-converter';

/**
 * @returns the row colors written to the entry by Retrospective or the log import
 */
export function entryRowStyle(entry: object): object {
   return { background: entry[QueryConverter.BG_COLOR], color: entry[QueryConverter.FG_COLOR] };
}
