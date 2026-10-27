import { LinePattern } from './line-pattern';

/**
 * line patterns of common log formats in the order they are tried when the format of a log file is detected
 */
export const LOG_PATTERNS = [
   '{Time:time} {Level:level} [{Thread}] {Logger} - {Message}',
   '{Time:time} [{Thread}] {Level:level} {Logger} - {Message}',
   '{Time:time} - {Logger} - {Level:level} - {Message}',
   '{Level:level}:{Logger}:{Message}',
   '{Time:time} {Host} {Process}: {Message}',
   '{Time:time} {Level:level} {Message}',
   LinePattern.JSON_LINES,
   LinePattern.LOGFMT
];

/**
 * the line pattern of lines that match no other pattern, every line becomes one message
 */
export const FALLBACK_LOG_PATTERN = '{Message}';
