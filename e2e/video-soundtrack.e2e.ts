import { readFileSync } from 'fs';
import { resolve } from 'path';
import { expect, test } from './support/fixtures';
import { SRC_DIR } from './support/paths';
import {
   audioFilterOf, FADE_OUT_SECONDS, musicProblemOf, SOUNDTRACKS, soundtrackOf, TAIL_SECONDS, tileSlugsOf
} from './videos/support/soundtrack.mjs';

const VIDEOS_PAGE = resolve(SRC_DIR, 'intro/videos.html');
const MUSIC_DIR = 'music';
const [ENTERTAINER, FIG_LEAF_RAG] = SOUNDTRACKS;

function videosPageHtml(): string {
   return readFileSync(VIDEOS_PAGE, 'utf-8');
}

test('soundtracks name incompetech mp3 urls of their titles', () => {
   const filesAndUrls = SOUNDTRACKS.map(s => [s.title, s.file, s.url]);

   expect(filesAndUrls).toEqual([
      ['The Entertainer', 'The Entertainer.mp3', 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/The%20Entertainer.mp3'],
      ['Fig Leaf Rag', 'Fig Leaf Rag.mp3', 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fig%20Leaf%20Rag.mp3']
   ]);
});

test('tile slugs of the videos page follow the order of its tiles', () => {
   const html = videosPageHtml();

   const slugs = tileSlugsOf(html);

   expect(slugs).toEqual(['new-scene', 'scenes-and-navigation', 'pivot-and-export', 'dashboards-and-charts', 'summary-tables',
      'relationship-graphs']);
});

test('odd tiles play The Entertainer and even tiles Fig Leaf Rag', () => {
   const slugs = tileSlugsOf(videosPageHtml());

   const soundtracks = slugs.map(slug => soundtrackOf(slug, slugs));

   expect(soundtracks).toEqual([ENTERTAINER, FIG_LEAF_RAG, ENTERTAINER, FIG_LEAF_RAG, ENTERTAINER, FIG_LEAF_RAG]);
});

test('reordered tiles swap the soundtracks of their videos', () => {
   const slugs = ['b', 'a'];

   const soundtracks = [soundtrackOf('a', slugs), soundtrackOf('b', slugs)];

   expect(soundtracks).toEqual([FIG_LEAF_RAG, ENTERTAINER]);
});

test('video without tile has no soundtrack', () => {
   const slugs = ['a'];

   const soundtrack = soundtrackOf('b', slugs);

   expect(soundtrack).toBeUndefined();
});

test('video without tile is reported with its slug and the videos page', () => {
   const slugs = ['a'];

   const problem = musicProblemOf('b', slugs, VIDEOS_PAGE, MUSIC_DIR, [ENTERTAINER.file]);

   expect(problem).toBe(`b has no tile in ${VIDEOS_PAGE}, add its tile first`);
});

test('missing music file is reported with its download url and the music directory variable', () => {
   const slugs = ['a', 'b'];

   const problem = musicProblemOf('b', slugs, VIDEOS_PAGE, MUSIC_DIR, [ENTERTAINER.file]);

   expect(problem).toBe('music file Fig Leaf Rag.mp3 missing in music, download '
      + 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fig%20Leaf%20Rag.mp3 into it or name another directory '
      + 'by environment variable VIDEO_MUSIC_DIR');
});

test('present music file reports no problem', () => {
   const slugs = ['a', 'b'];

   const problem = musicProblemOf('b', slugs, VIDEOS_PAGE, MUSIC_DIR, [ENTERTAINER.file, FIG_LEAF_RAG.file]);

   expect(problem).toBeUndefined();
});

test('videos page credits every soundtrack', () => {
   const html = videosPageHtml();

   const credit = /<small class="video-credit">([^<]*)/.exec(html)[1];

   SOUNDTRACKS.forEach(s => expect(credit).toContain('“' + s.title + '”'));
});

test('audio filter fades the music in over the first second and out along a quadratic curve over the last four seconds', () => {
   const duration = 70;

   const filter = audioFilterOf(duration);

   expect(filter).toBe('volume=0.95,afade=t=in:d=1,afade=t=out:st=66:d=4:curve=qua');
});

test('audio filter of a video shorter than the fade out starts fading out at once', () => {
   const duration = 3;

   const filter = audioFilterOf(duration);

   expect(filter).toBe('volume=0.95,afade=t=in:d=1,afade=t=out:st=0:d=4:curve=qua');
});

test('music fades out within the tail recorded after the last caption', () => {
   const fadeOut = FADE_OUT_SECONDS;

   const tail = TAIL_SECONDS;

   expect(fadeOut).toBeLessThan(tail);
});
