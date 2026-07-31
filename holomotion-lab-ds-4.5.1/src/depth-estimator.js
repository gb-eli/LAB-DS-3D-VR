const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const median = (values = []) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export const DEPTH_ZONES = Object.freeze([
  { id: 'far', label: 'LONGE', min: 0, max: .34, color: '#60a5fa' },
  { id: 'mid', label: 'MÉDIO', min: .28, max: .72, color: '#22d3ee' },
  { id: 'near', label: 'PERTO', min: .66, max: 1, color: '#f472b6' }
]);

export class HandDepthEstimator {
  constructor({ smoothing = .26, hysteresis = .055, maxSamples = 90 } = {}) {
    this.smoothing = clamp(smoothing, .05, .8);
    this.hysteresis = clamp(hysteresis, .01, .15);
    this.maxSamples = maxSamples;
    this.reset();
  }

  reset() {
    this.samples = [];
    this.filtered = .5;
    this.velocity = 0;
    this.lastAt = 0;
    this.zone = 'mid';
    this.baseline = { farScale: .065, nearScale: .145, zFar: .12, zNear: -.12 };
    this.calibrated = false;
  }

  observe(gesture, now = performance.now()) {
    if (!gesture?.palm) return this.snapshot(false);
    const palmScale = Number(gesture.palmScale || 0);
    const worldZ = this.#worldZ(gesture);
    if (palmScale > .025 && palmScale < .35) {
      this.samples.push({ palmScale, worldZ });
      if (this.samples.length > this.maxSamples) this.samples.shift();
      if (!this.calibrated && this.samples.length >= 24) this.autoCalibrate();
    }
    const scaleDepth = clamp((palmScale - this.baseline.farScale) / Math.max(.025, this.baseline.nearScale - this.baseline.farScale), 0, 1);
    const zDepth = Number.isFinite(worldZ)
      ? clamp((this.baseline.zFar - worldZ) / Math.max(.04, this.baseline.zFar - this.baseline.zNear), 0, 1)
      : scaleDepth;
    const raw = Number.isFinite(worldZ) ? scaleDepth * .68 + zDepth * .32 : scaleDepth;
    const previous = this.filtered;
    this.filtered += (raw - this.filtered) * this.smoothing;
    const dt = this.lastAt ? Math.max(16, now - this.lastAt) : 16;
    this.velocity = (this.filtered - previous) / (dt / 1000);
    this.lastAt = now;
    this.zone = this.#resolveZone(this.filtered, this.zone);
    return this.snapshot(true, { palmScale, worldZ, raw });
  }

  autoCalibrate() {
    if (this.samples.length < 12) return this.baseline;
    const scales = this.samples.map((sample) => sample.palmScale).filter(Number.isFinite).sort((a, b) => a - b);
    const zs = this.samples.map((sample) => sample.worldZ).filter(Number.isFinite).sort((a, b) => a - b);
    const low = scales[Math.floor((scales.length - 1) * .12)] || .065;
    const high = scales[Math.floor((scales.length - 1) * .88)] || .145;
    if (high - low > .025) {
      this.baseline.farScale = clamp(low * .92, .035, .13);
      this.baseline.nearScale = clamp(high * 1.08, .09, .28);
      this.calibrated = true;
    }
    if (zs.length >= 8) {
      this.baseline.zNear = zs[Math.floor((zs.length - 1) * .15)] ?? -.12;
      this.baseline.zFar = zs[Math.floor((zs.length - 1) * .85)] ?? .12;
    }
    return { ...this.baseline };
  }

  calibrate({ farScale, nearScale, zFar, zNear } = {}) {
    if (Number.isFinite(farScale)) this.baseline.farScale = clamp(farScale, .025, .2);
    if (Number.isFinite(nearScale)) this.baseline.nearScale = clamp(nearScale, .06, .35);
    if (Number.isFinite(zFar)) this.baseline.zFar = zFar;
    if (Number.isFinite(zNear)) this.baseline.zNear = zNear;
    this.calibrated = this.baseline.nearScale - this.baseline.farScale > .02;
    return { ...this.baseline };
  }

  #worldZ(gesture) {
    const world = gesture.worldLandmarks || gesture.world || null;
    if (Array.isArray(world) && world.length) {
      const indexes = [0, 5, 9, 13, 17];
      return median(indexes.map((index) => world[index]?.z).filter(Number.isFinite));
    }
    const landmarks = gesture.landmarks || null;
    if (Array.isArray(landmarks) && landmarks.length) return median([0, 5, 9, 13, 17].map((index) => landmarks[index]?.z).filter(Number.isFinite));
    return Number.isFinite(gesture.palm?.z) ? gesture.palm.z : NaN;
  }

  #resolveZone(value, previous) {
    if (previous === 'far' && value < .34 + this.hysteresis) return 'far';
    if (previous === 'near' && value > .66 - this.hysteresis) return 'near';
    if (value < .31) return 'far';
    if (value > .69) return 'near';
    return 'mid';
  }

  snapshot(detected = false, raw = {}) {
    const zone = DEPTH_ZONES.find((item) => item.id === this.zone) || DEPTH_ZONES[1];
    return {
      detected,
      normalized: Number(this.filtered.toFixed(3)),
      velocity: Number(this.velocity.toFixed(3)),
      direction: this.velocity > .22 ? 'pull' : this.velocity < -.22 ? 'push' : 'stable',
      zone: zone.id,
      zoneLabel: zone.label,
      color: zone.color,
      calibrated: this.calibrated,
      baseline: { ...this.baseline },
      ...raw
    };
  }
}
