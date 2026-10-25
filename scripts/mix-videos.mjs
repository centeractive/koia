/**
 * Mixes the background music given by environment variable VIDEO_MUSIC (default e2e/videos/music/The Entertainer.mp3) into the raw videos recorded by `npm run videos:record`,
 * trims their loading frames, extracts a poster and copies both to src/intro/videos unless the video exceeds the size cap.
 *
 * usage: node scripts/mix-videos.mjs [slug]
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = join(REPO_DIR, 'test-results/videos/raw');
const OUT_DIR = join(REPO_DIR, 'test-results/videos/out');
const TARGET_DIR = join(REPO_DIR, 'src/intro/videos');
const MAX_BYTES = 8 * 1024 * 1024;
const FADE_OUT_SECONDS = 2.5;
const DEFAULT_MUSIC = join(REPO_DIR, 'e2e/videos/music/The Entertainer.mp3');
const MUSIC_URL = 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/The%20Entertainer.mp3';

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
   const { trimStart } = JSON.parse(readFileSync(sidecar, 'utf8'));
   const duration = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', raw], 'pipe')) - trimStart;
   const video = join(OUT_DIR, slug + '.webm');
   const poster = join(OUT_DIR, slug + '.webp');
   run('ffmpeg', ['-y', '-ss', String(trimStart), '-i', raw, '-stream_loop', '-1', '-i', music, '-map', '0:v', '-map', '1:a:0',
      '-t', String(duration), '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
      '-c:a', 'libopus', '-b:a', '96k',
      '-af', `volume=0.95,afade=t=in:d=1,afade=t=out:st=${duration - FADE_OUT_SECONDS}:d=${FADE_OUT_SECONDS}`, video]);
   run('ffmpeg', ['-y', '-sseof', '-0.5', '-i', video, '-frames:v', '1', '-c:v', 'libwebp', poster]);
   const bytes = statSync(video).size;
   if (bytes > MAX_BYTES) {
      fail(`${video} has ${bytes} bytes, more than the ${MAX_BYTES} allowed for committed videos`);
   }
   copyFileSync(video, join(TARGET_DIR, slug + '.webm'));
   copyFileSync(poster, join(TARGET_DIR, slug + '.webp'));
   console.log(`${slug}: ${duration.toFixed(1)} s, ${bytes} bytes copied to ${TARGET_DIR}`);
}

const music = process.env.VIDEO_MUSIC || DEFAULT_MUSIC;
if (!existsSync(music) || !statSync(music).isFile()) {
   fail(`music file ${music} missing, download ${MUSIC_URL} to ${DEFAULT_MUSIC} or name another file by environment variable VIDEO_MUSIC`);
}
run('ffmpeg', ['-version'], 'ignore');
run('ffprobe', ['-version'], 'ignore');
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TARGET_DIR, { recursive: true });
for (const slug of slugsToMix(process.argv[2])) {
   mix(slug, music);
}
