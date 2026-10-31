export const VIDEO_SIZE = { width: 1600, height: 900 };

/** records the page with a cursor pointing at each action */
export const RECORDED_VIDEO = {
   mode: 'on', size: VIDEO_SIZE, show: { actions: { cursor: 'pointer', duration: 800, style: { title: 'display: none' } } }
} as const;
