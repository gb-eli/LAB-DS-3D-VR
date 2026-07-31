const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const average = (values = []) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const percentile = (values = [], ratio = 0.5) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * ratio)))];
};

export class AdaptiveGestureCalibrator {
  constructor({ maxSamples = 140 } = {}) {
    this.maxSamples = maxSamples;
    this.reset();
  }

  reset() {
    this.closedRatios = [];
    this.openRatios = [];
    this.positions = [];
    this.confidences = [];
    this.scales = [];
    this.misses = 0;
    this.frames = 0;
    this.lastPosition = null;
    this.jitterSamples = [];
  }

  observe(gesture) {
    this.frames += 1;
    if (!gesture || gesture.type === 'unknown') {
      this.misses += 1;
      return;
    }
    if (Number.isFinite(gesture.confidence)) this.#push(this.confidences, gesture.confidence);
    if (Number.isFinite(gesture.palmScale)) this.#push(this.scales, gesture.palmScale);
    if (Number.isFinite(gesture.pinchRatio)) {
      if (['pinch', 'ok', 'fist'].includes(gesture.type)) this.#push(this.closedRatios, gesture.pinchRatio);
      else if (['open', 'point', 'peace'].includes(gesture.type)) this.#push(this.openRatios, gesture.pinchRatio);
    }
    if (gesture.palm && Number.isFinite(gesture.palm.x) && Number.isFinite(gesture.palm.y)) {
      const point = { x: gesture.palm.x, y: gesture.palm.y };
      if (this.lastPosition && (gesture.heldFor || 0) > 180) {
        const delta = Math.hypot(point.x - this.lastPosition.x, point.y - this.lastPosition.y);
        if (delta < 0.08) this.#push(this.jitterSamples, delta);
      }
      this.lastPosition = point;
      this.#push(this.positions, point);
    }
  }

  #push(list, value) {
    list.push(value);
    if (list.length > this.maxSamples) list.shift();
  }

  get ready() {
    return this.closedRatios.length >= 5 && this.openRatios.length >= 8 && this.frames >= 24;
  }

  recommendation(currentSensitivity = 1) {
    const closed = percentile(this.closedRatios, 0.78) || 0.31;
    const open = percentile(this.openRatios, 0.2) || 0.68;
    const separation = Math.max(0.04, open - closed);
    const desiredClose = clamp(closed + separation * 0.22, 0.29, 0.5);
    const sensitivity = clamp(desiredClose / 0.39, 0.76, 1.36);
    const jitter = percentile(this.jitterSamples, 0.75) || 0;
    const confidence = average(this.confidences) || 0;
    const lossRate = this.frames ? this.misses / this.frames : 1;
    const smoothing = clamp(0.42 + jitter * 7.5 + lossRate * 0.3, 0.42, 0.82);
    const holdMs = Math.round(clamp(260 + jitter * 4800 + lossRate * 420, 260, 760));
    const score = Math.round(clamp((confidence * 0.55 + separation * 1.25 - jitter * 4 - lossRate * 0.5) * 100, 0, 100));
    const label = score >= 78 ? 'EXCELENTE' : score >= 58 ? 'ESTÁVEL' : score >= 38 ? 'AJUSTANDO' : 'FRÁGIL';
    return {
      ready: this.ready,
      sensitivity: Number((this.ready ? sensitivity : currentSensitivity).toFixed(2)),
      smoothing: Number(smoothing.toFixed(2)),
      holdMs,
      score,
      label,
      metrics: {
        closedRatio: Number(closed.toFixed(3)),
        openRatio: Number(open.toFixed(3)),
        separation: Number(separation.toFixed(3)),
        jitter: Number(jitter.toFixed(4)),
        confidence: Number(confidence.toFixed(3)),
        lossRate: Number(lossRate.toFixed(3)),
        palmScale: Number((average(this.scales) || 0).toFixed(3))
      }
    };
  }
}

export class SensorStabilityMonitor {
  constructor({ maxSamples = 90 } = {}) {
    this.maxSamples = maxSamples;
    this.samples = [];
  }

  observe({ fps = 0, confidence = 0, detected = false, inferenceMs = 0, jitter = 0 } = {}) {
    this.samples.push({ fps, confidence, detected, inferenceMs, jitter });
    if (this.samples.length > this.maxSamples) this.samples.shift();
    return this.snapshot();
  }

  snapshot() {
    if (!this.samples.length) return { score: 0, label: 'SEM DADOS', fps: 0, confidence: 0, detectionRate: 0, inferenceMs: 0, jitter: 0 };
    const fps = average(this.samples.map((item) => item.fps).filter(Number.isFinite));
    const confidence = average(this.samples.map((item) => item.confidence).filter(Number.isFinite));
    const detectionRate = this.samples.filter((item) => item.detected).length / this.samples.length;
    const inferenceMs = average(this.samples.map((item) => item.inferenceMs).filter(Number.isFinite));
    const jitter = average(this.samples.map((item) => item.jitter).filter(Number.isFinite));
    const score = Math.round(clamp((fps / 60) * 34 + confidence * 28 + detectionRate * 30 - Math.min(1, inferenceMs / 120) * 8 - jitter * 180, 0, 100));
    const label = score >= 80 ? 'EXCELENTE' : score >= 62 ? 'ESTÁVEL' : score >= 44 ? 'AJUSTANDO' : 'REDUZIDO';
    return { score, label, fps: Math.round(fps), confidence, detectionRate, inferenceMs: Math.round(inferenceMs), jitter };
  }
}
