/** seconds recorded after the last caption, the music fades out over them */
export const TAIL_SECONDS = 4.5;
export const FADE_IN_SECONDS = 1;
export const FADE_OUT_SECONDS = 4;
/** quadratic gain lowers the volume audibly from the start of the fade, a linear one is heard to drop only at its end */
const FADE_OUT_CURVE = 'qua';
const MUSIC_VOLUME = 0.95;
const INCOMPETECH_MP3_URL = 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/';
export const MUSIC_DIR_VARIABLE = 'VIDEO_MUSIC_DIR';

export interface Soundtrack {
   readonly title: string;
   readonly file: string;
   readonly url: string;
}

function incompetechSoundtrack(title: string): Soundtrack {
   const file = title + '.mp3';
   return { title, file, url: INCOMPETECH_MP3_URL + encodeURIComponent(file) };
}

/** played by the odd and by the even tiles of the videos page */
export const SOUNDTRACKS: readonly Soundtrack[] = [incompetechSoundtrack('The Entertainer'), incompetechSoundtrack('Fig Leaf Rag')];

/**
 * @returns the slugs of the videos in the order of their tiles on the videos page
 */
export function tileSlugsOf(videosPageHtml: string): string[] {
   return [...videosPageHtml.matchAll(/src="videos\/([^"]+)\.webm"/g)].map(match => match[1]);
}

/**
 * @returns the soundtrack alternating by tile position, undefined for a video without tile
 */
export function soundtrackOf(slug: string, tileSlugs: readonly string[]): Soundtrack | undefined {
   const index = tileSlugs.indexOf(slug);
   return index < 0 ? undefined : SOUNDTRACKS[index % SOUNDTRACKS.length];
}

/**
 * @returns why the video cannot be mixed with the music files of the directory, undefined when it can
 */
export function musicProblemOf(slug: string, tileSlugs: readonly string[], videosPagePath: string, musicDir: string,
   musicFiles: readonly string[]): string | undefined {
   const soundtrack = soundtrackOf(slug, tileSlugs);
   if (!soundtrack) {
      return `${slug} has no tile in ${videosPagePath}, add its tile first`;
   }
   return musicFiles.includes(soundtrack.file) ? undefined
      : `music file ${soundtrack.file} missing in ${musicDir}, download ${soundtrack.url} into it or name another directory by environment variable ${MUSIC_DIR_VARIABLE}`;
}

/**
 * @returns the ffmpeg audio filter fading the music in and out over the last seconds of a video of the duration in seconds
 */
export function audioFilterOf(duration: number): string {
   return `volume=${MUSIC_VOLUME},afade=t=in:d=${FADE_IN_SECONDS},afade=t=out:st=${Math.max(0, duration - FADE_OUT_SECONDS)}`
      + `:d=${FADE_OUT_SECONDS}:curve=${FADE_OUT_CURVE}`;
}
