# Koia data visualization

This project was generated with [Angular CLI](https://github.com/angular/angular-cli)

## Prerequisites

Node.js 24 LTS (≥ 24.15)

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive/pipe/service/class/module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `npm test` to execute the unit tests with [Vitest](https://vitest.dev) in headless Chromium (one-time: `npx playwright install chromium`). `npm run test-debug` runs them headed with the Vitest UI. CouchDB backend tests and the integration tests in the `IT` folders require a CouchDB at `http://localhost:5984`; the integration tests fail rather than fall back to the browser IndexedDB when it is not running.

## Running end-to-end tests

Run `npm run e2e` to execute the [Playwright](https://playwright.dev) end-to-end tests in `e2e/` against their own `ng serve` on port 4300, or the port in environment variable `E2E_PORT` (a dev server already running on that port is reused; one-time: `npx playwright install chromium`). The browser locale is `en-US`. Tests of project `chromium` block requests to other origins, hence they never touch a CouchDB and start with an empty browser IndexedDB. Tests in `*.couchdb.e2e.ts` (project `couchdb`, run alone with `npm run e2e -- --project=couchdb`) use the CouchDB at `http://localhost:5984` with the default credentials admin/admin and require CORS for the origin of the tested app (`origins = *` works); they are skipped, stating why, when that CouchDB is not usable, but fail on CI. Each creates its own scene document and data database named `e2e_<timestamp>_<random>` and removes them with the scene's tabs document afterwards; the browser cannot send DELETE requests to CouchDB. Scenes named `E2E e2e_…` left by an aborted run can be deleted on the scenes page. Results are written to `test-results/e2e-junit.xml`, traces of failed tests to `test-results/e2e` (view with `npx playwright show-trace <zip>`).

There is one spec per area (`e2e/*.e2e.ts`). Specs use the page objects of `e2e/support/pages` and `e2e/support/components` through the fixtures in `e2e/support/fixtures.ts` and `e2e/support/couchdb-fixtures.ts` and import framework-free app modules directly (never barrels). Expected texts come from `src/assets/i18n/<lang>.json` (`e2e/support/texts.ts`), sample data from `src/assets/samples`, import files from `e2e/data` and `src/app/shared/services/reader/excel/test.xlsx`. Both Azure pipelines run the end-to-end tests through the step template `e2e/azure-e2e-steps.yml`.

## Recording tutorial videos

The videos of `src/intro/videos.html` are recorded by Playwright scripts in `e2e/videos/*.video.ts` and mixed with background music by `scripts/mix-videos.mjs`. Prerequisites: `ffmpeg` and `ffprobe` on the `PATH` (e.g. `winget install Gyan.FFmpeg`) and the soundtrack "The Entertainer" by Scott Joplin, recorded by Kevin MacLeod (incompetech.com, CC BY 4.0, credited in the footer of `videos.html`), in the git-ignored `e2e/videos/music/`: `curl -L --create-dirs -o "e2e/videos/music/The Entertainer.mp3" https://incompetech.com/music/royalty-free/mp3-royaltyfree/The%20Entertainer.mp3`. Environment variable `VIDEO_MUSIC` may name another music file.

Record and mix one video, here `new-scene`, with `E2E_PORT=4317 npm run videos:record -- new-scene && npm run videos:mix -- new-scene` (PowerShell 7: `$env:E2E_PORT=4317; npm run videos:record -- new-scene && npm run videos:mix -- new-scene`; `&&` needs PowerShell 7, pwsh). The recording writes the raw video and its trim offset to `test-results/videos/raw`, the mix writes `src/intro/videos/<slug>.webm` and its poster `<slug>.webp` and fails when the video exceeds 8 MB. Each recording run clears `test-results/videos`, hence `npm run videos:mix` without a slug mixes the videos of the last recording run only.

To add a video, write `e2e/videos/<slug>.video.ts` with `VideoRecording` (`e2e/videos/support/video-recording.ts`), record and mix it as above, add its tile with the play button and video dialog to `src/intro/videos.html` and update the tiles expected by `src/app/intro/videos-page.spec.ts`.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
