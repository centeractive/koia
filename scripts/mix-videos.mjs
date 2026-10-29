/**
 * Mixes the soundtrack chosen by soundtrackOf from the tiles of src/intro/videos.html from the music directory given by environment variable
 * VIDEO_MUSIC_DIR (default e2e/videos/music) into the raw videos recorded by `npm run videos:record`, trims their loading frames, cuts the long waits marked by VideoRecording.cutWhile, extracts a poster and copies both
 * to src/intro/videos unless the video exceeds the size cap.
 *
 * usage: node scripts/mix-videos.mjs [slug]
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cutFilterOf, keptDurationOf } from '../e2e/videos/support/cuts.mts';
import { audioFilterOf, MUSIC_DIR_VARIABLE, musicProblemOf, soundtrackOf, tileSlugsOf } from '../e2e/videos/support/soundtrack.mts';

const REPO_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = join(REPO_DIR, 'test-results/videos/raw');
const OUT_DIR = join(REPO_DIR, 'test-results/videos/out');
const TARGET_DIR = join(REPO_DIR, 'src/intro/videos');
const VIDEOS_PAGE = join(REPO_DIR, 'src/intro/videos.html');
const MUSIC_DIR = process.env[MUSIC_DIR_VARIABLE] || join(REPO_DIR, 'e2e/videos/music');
const MAX_BYTES = 8 * 1024 * 1024;

function fail(message) {
   console.error(message);
   process.exit(1);
}

function run(command, args, stdio = 'inherit') {
   const result = spawnSync(command, args, { stdio, encoding: 'utf8' });
   if (result.error || result.status !== 0) {
      fail(`${command} ${args.join(' ')} failed${result.error ? ': ' + result.error.message : ''}`);
   }
   return result.stdout;
}

function slugsToMix(slug) {
   if (slug) {
      return [slug];
   }
   return existsSync(RAW_DIR) ? readdirSync(RAW_DIR).filter(f => f.endsWith('.json')).map(f => f.slice(0, -'.json'.length)) : [];
}

function mix(slug, music) {
   const raw = join(RAW_DIR, slug + '.webm');
   const sidecar = join(RAW_DIR, slug + '.json');
   if (!existsSync(raw) || !existsSync(sidecar)) {
      fail(`no recording of ${slug} in ${RAW_DIR}, run npm run videos:record -- ${slug} first`);
   }
   const { trimStart, cuts = [] } = JSON.parse(readFileSync(sidecar, 'utf8'));
   const duration = keptDurationOf(Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', raw], 'pipe'))
      - trimStart, cuts);
   const cutFilter = cutFilterOf(cuts);
   const video = join(OUT_DIR, slug + '.webm');
   const poster = join(OUT_DIR, slug + '.webp');
   run('ffmpeg', ['-y', '-ss', String(trimStart), '-i', raw, '-stream_loop', '-1', '-i', music, '-map', '0:v', '-map', '1:a:0',
      '-t', String(duration), ...(cutFilter ? ['-vf', cutFilter] : []), '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
      '-c:a', 'libopus', '-b:a', '96k',
      '-af', audioFilterOf(duration), video]);
   run('ffmpeg', ['-y', '-sseof', '-0.5', '-i', video, '-frames:v', '1', '-c:v', 'libwebp', poster]);
   const bytes = statSync(video).size;
   if (bytes > MAX_BYTES) {
      fail(`${video} has ${bytes} bytes, more than the ${MAX_BYTES} allowed for committed videos`);
   }
   copyFileSync(video, join(TARGET_DIR, slug + '.webm'));
   copyFileSync(poster, join(TARGET_DIR, slug + '.webp'));
   console.log(`${slug}: ${duration.toFixed(1)} s, ${bytes} bytes copied to ${TARGET_DIR}`);
}

const slugs = slugsToMix(process.argv[2]);
const tileSlugs = tileSlugsOf(readFileSync(VIDEOS_PAGE, 'utf8'));
const musicFiles = existsSync(MUSIC_DIR) ? readdirSync(MUSIC_DIR, { withFileTypes: true }).filter(e => e.isFile()).map(e => e.name) : [];
const problems = slugs.map(slug => musicProblemOf(slug, tileSlugs, VIDEOS_PAGE, MUSIC_DIR, musicFiles)).filter(problem => problem);
if (problems.length) {
   fail(problems.join('\n'));
}
run('ffmpeg', ['-version'], 'ignore');
run('ffprobe', ['-version'], 'ignore');
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TARGET_DIR, { recursive: true });
for (const slug of slugs) {
   mix(slug, join(MUSIC_DIR, soundtrackOf(slug, tileSlugs).file));
}
