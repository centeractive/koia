export interface ProgressMonitor {

   onProgress(percent: number, message: string): void;

   onComplete(message: string): void;

   onError(error: string | Object): void;
}
