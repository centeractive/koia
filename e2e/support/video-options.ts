export const VIDEO_SIZE = { width: 1280, height: 720 };

/** records the page with a cursor pointing at each action */
export const RECORDED_VIDEO = {
   mode: 'on', size: VIDEO_SIZE, show: { actions: { cursor: 'pointer', duration: 800, style: { title: 'display: none' } } }
} as const;
