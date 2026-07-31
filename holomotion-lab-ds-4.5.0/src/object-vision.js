import { MEDIAPIPE, QUALITY_PROFILES } from './config.js';

const INTERVALS = Object.freeze({
  economy: 300,
  low: 260,
  performance: 125,
  balanced: 175,
  quality: 210,
  precision: 150,
  high: 135,
  turbo: 88
});

export class ObjectVisionEngine {
  constructor(video, { quality = 'balanced', onResults = () => {}, onStatus = () => {}, onStats = () => {} } = {}) {
    this.video = video;
    this.quality = QUALITY_PROFILES[quality] ? quality : 'balanced';
    this.onResults = onResults;
    this.onStatus = onStatus;
    this.onStats = onStats;
    this.worker = null;
    this.backend = 'worker';
    this.initialized = false;
    this.running = false;
    this.busy = false;
    this.requestId = 0;
    this.lastRunAt = 0;
    this.lastVideoTime = -1;
    this.captureCanvas = document.createElement('canvas');
    this.captureContext = this.captureCanvas.getContext('2d', { alpha: false, desynchronized: true, willReadFrequently: true });
    this.mainApi = null;
    this.mainFileset = null;
    this.mainDetector = null;
    this.delegate = 'CPU';
    this.stats = { hz: 0, duration: 0, delegate: '--', backend: '--', width: 0, height: 0, frames: 0, windowAt: performance.now() };
    this.loopHandle = 0;
    this.loopBound = this.loop.bind(this);
  }

  get interval() { return INTERVALS[this.quality] || INTERVALS.balanced; }
  get dimensions() {
    const profile = QUALITY_PROFILES[this.quality] || QUALITY_PROFILES.balanced;
    const maxWidth = this.quality === 'turbo' ? 640 : this.quality === 'precision' ? 576 : 512;
    const width = Math.min(maxWidth, profile.processing.width || maxWidth);
    return { width, height: Math.round(width * 9 / 16) };
  }

  async initialize(progress = () => {}) {
    if (this.initialized) return;
    const canWorker = typeof Worker !== 'undefined' && typeof createImageBitmap === 'function' && typeof OffscreenCanvas !== 'undefined';
    if (canWorker) {
      try { await this.initializeWorker(progress); this.initialized = true; return; }
      catch (error) { console.warn('Worker do detector indisponível; usando thread principal.', error); this.worker?.terminate?.(); this.worker = null; }
    }
    await this.initializeMain(progress);
    this.initialized = true;
  }

  initializeWorker(progress) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./object-vision.worker.js', import.meta.url), { type: 'module' });
      this.worker = worker;
      this.backend = 'worker';
      const timeout = setTimeout(() => reject(new Error('Tempo excedido ao iniciar o detector de objetos.')), 30000);
      worker.addEventListener('message', (event) => {
        const message = event.data || {};
        if (message.type === 'progress') progress(message.progress, message.message);
        else if (message.type === 'ready') {
          clearTimeout(timeout);
          this.delegate = message.delegate || '--';
          this.stats.backend = 'WORKER'; this.stats.delegate = this.delegate;
          this.onStatus({ state: 'ready', backend: 'WORKER', delegate: this.delegate });
          resolve();
        } else if (message.type === 'result') this.handleResult(message);
        else if (message.type === 'processing-error') { this.busy = false; this.onStatus({ state: 'error', message: message.message }); }
        else if (message.type === 'fatal-error') { clearTimeout(timeout); reject(new Error(message.message || 'Falha no detector.')); }
      });
      worker.addEventListener('error', (error) => { clearTimeout(timeout); reject(error); }, { once: true });
      worker.postMessage({ type: 'init', config: MEDIAPIPE });
    });
  }

  async initializeMain(progress) {
    this.backend = 'main';
    progress(12, 'Carregando detector de objetos…');
    this.mainApi = await import(MEDIAPIPE.moduleUrl);
    progress(38, 'Preparando WebAssembly do scanner…');
    this.mainFileset = await this.mainApi.FilesetResolver.forVisionTasks(MEDIAPIPE.wasmPath);
    const options = (delegate) => ({
      baseOptions: { modelAssetPath: MEDIAPIPE.objectModel, delegate },
      runningMode: 'VIDEO', maxResults: 24, scoreThreshold: 0.22
    });
    try { this.mainDetector = await this.mainApi.ObjectDetector.createFromOptions(this.mainFileset, options('GPU')); this.delegate = 'GPU'; }
    catch { this.mainDetector = await this.mainApi.ObjectDetector.createFromOptions(this.mainFileset, options('CPU')); this.delegate = 'CPU'; }
    this.stats.backend = 'PRINCIPAL'; this.stats.delegate = this.delegate;
    progress(100, 'Vision Scanner pronto.');
    this.onStatus({ state: 'ready', backend: 'PRINCIPAL', delegate: this.delegate });
  }

  setQuality(quality) { if (QUALITY_PROFILES[quality]) this.quality = quality; }

  async start(progress = () => {}) {
    await this.initialize(progress);
    this.running = true;
    this.busy = false;
    this.lastRunAt = 0;
    this.schedule();
  }

  stop() {
    this.running = false;
    this.busy = false;
    if (this.loopHandle && this.video?.cancelVideoFrameCallback) this.video.cancelVideoFrameCallback(this.loopHandle);
    else if (this.loopHandle) cancelAnimationFrame(this.loopHandle);
    this.loopHandle = 0;
    this.onStatus({ state: 'paused' });
  }

  async dispose() {
    this.stop();
    this.worker?.postMessage?.({ type: 'close' });
    this.worker?.terminate?.();
    this.worker = null;
    this.mainDetector?.close?.();
    this.mainDetector = null;
    this.initialized = false;
    this.onStatus({ state: 'unloaded' });
  }

  schedule() {
    if (!this.running) return;
    if (this.video?.requestVideoFrameCallback) this.loopHandle = this.video.requestVideoFrameCallback(() => this.loop());
    else this.loopHandle = requestAnimationFrame(this.loopBound);
  }

  async loop() {
    if (!this.running) return;
    const now = performance.now();
    const ready = this.video?.readyState >= 2 && this.video.videoWidth > 0 && this.video.currentTime !== this.lastVideoTime;
    if (!this.busy && ready && now - this.lastRunAt >= this.interval) {
      this.lastVideoTime = this.video.currentTime;
      this.lastRunAt = now;
      await this.capture(now);
    }
    this.schedule();
  }

  async capture(timestamp) {
    const { width, height } = this.dimensions;
    this.captureCanvas.width = width; this.captureCanvas.height = height;
    this.captureContext.drawImage(this.video, 0, 0, width, height);
    this.busy = true;
    const requestId = ++this.requestId;
    if (this.backend === 'worker') {
      try {
        const bitmap = await createImageBitmap(this.captureCanvas);
        this.worker.postMessage({ type: 'process', requestId, timestamp, bitmap }, [bitmap]);
      } catch (error) { this.busy = false; this.onStatus({ state: 'error', message: error?.message || String(error) }); }
      return;
    }
    const started = performance.now();
    try {
      const result = this.mainDetector.detectForVideo(this.captureCanvas, timestamp);
      this.handleResult({ requestId, timestamp, width, height, duration: performance.now() - started, detections: result.detections || [] });
    } catch (error) { this.busy = false; this.onStatus({ state: 'error', message: error?.message || String(error) }); }
  }

  handleResult(message) {
    this.busy = false;
    const now = performance.now();
    this.stats.duration = Number(message.duration) || 0;
    this.stats.width = Number(message.width) || 0;
    this.stats.height = Number(message.height) || 0;
    this.stats.frames += 1;
    const elapsed = now - this.stats.windowAt;
    if (elapsed >= 1000) {
      this.stats.hz = Math.round(this.stats.frames * 1000 / elapsed);
      this.stats.frames = 0; this.stats.windowAt = now;
    }
    this.onStats({ ...this.stats });
    this.onResults({ detections: message.detections || [], width: message.width, height: message.height, timestamp: message.timestamp, duration: message.duration });
  }

  getFrameImageData(width = 240, height = 135) {
    if (!this.video || this.video.readyState < 2) return null;
    this.captureCanvas.width = width; this.captureCanvas.height = height;
    this.captureContext.drawImage(this.video, 0, 0, width, height);
    return this.captureContext.getImageData(0, 0, width, height);
  }
}
