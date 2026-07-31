import { HandDepthEstimator, DEPTH_ZONES } from './depth-estimator.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class DepthTrainerGame {
  constructor({ canvas = null, callbacks = {} } = {}) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext?.('2d') || null;
    this.callbacks = callbacks;
    this.estimator = new HandDepthEstimator({ smoothing: .34 });
    this.targets = [];
    this.active = false;
    this.score = 0;
    this.combo = 0;
    this.round = 0;
    this.current = null;
    this.startedAt = 0;
    this.remaining = 60_000;
    this.holdAt = 0;
    this.lastZone = 'mid';
    this.resizeObserver = null;
    if (this.canvas && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  start() {
    this.active = true;
    this.score = 0;
    this.combo = 0;
    this.round = 0;
    this.startedAt = performance.now();
    this.remaining = 60_000;
    this.estimator.reset();
    this.#nextTarget();
    this.resize();
    this.canvas?.classList?.add('active');
    this.callbacks.onStart?.(this.snapshot());
    return this.snapshot();
  }

  stop() { this.active = false; this.canvas?.classList?.remove('active'); }
  reset() { return this.start(); }

  update({ gestures = [] } = {}, now = performance.now()) {
    if (!this.active) return this.snapshot();
    this.remaining = Math.max(0, 60_000 - (now - this.startedAt));
    const gesture = gestures.find((entry) => entry?.palm) || null;
    const depth = this.estimator.observe(gesture, now);
    if (depth.detected && depth.zone === this.current?.zone && ['pinch', 'fist', 'ok', 'open', 'point'].includes(gesture?.type)) {
      if (!this.holdAt) this.holdAt = now;
      if (now - this.holdAt >= 520) {
        this.combo += 1;
        const gain = 100 + this.combo * 18;
        this.score += gain;
        this.callbacks.onHit?.({ gain, target: this.current, depth, ...this.snapshot() });
        this.#nextTarget();
      }
    } else {
      if (depth.detected && this.holdAt && depth.zone !== this.current?.zone) this.combo = Math.max(0, this.combo - 1);
      this.holdAt = 0;
    }
    if (this.remaining <= 0) this.#complete();
    this.lastZone = depth.zone;
    this.callbacks.onProgress?.({ depth, hold: this.holdAt ? clamp((now - this.holdAt) / 520, 0, 1) : 0, ...this.snapshot() });
    this.render(depth, gesture);
    return this.snapshot();
  }

  #nextTarget() {
    const choices = DEPTH_ZONES.filter((zone) => zone.id !== this.current?.zone);
    this.current = choices[Math.floor(Math.random() * choices.length)] || DEPTH_ZONES[1];
    this.round += 1;
    this.holdAt = 0;
    this.callbacks.onTarget?.({ target: this.current, round: this.round });
  }

  #complete() {
    if (!this.active) return;
    this.active = false;
    const xp = 45 + Math.min(140, this.round * 8 + this.combo * 5);
    this.callbacks.onComplete?.({ xp, ...this.snapshot() });
  }

  snapshot() { return { active: this.active, score: this.score, combo: this.combo, round: this.round, target: this.current, remaining: this.remaining }; }

  resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect?.() || { width: 1280, height: 720 };
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  render(depth = this.estimator.snapshot(false), gesture = null) {
    if (!this.ctx || !this.canvas || !this.active) return;
    const width = parseFloat(this.canvas.style.width) || this.canvas.width;
    const height = parseFloat(this.canvas.style.height) || this.canvas.height;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    const centers = { far: { x: width * .25, y: height * .5, r: 48 }, mid: { x: width * .5, y: height * .5, r: 76 }, near: { x: width * .75, y: height * .5, r: 108 } };
    for (const zone of DEPTH_ZONES) {
      const point = centers[zone.id];
      const target = zone.id === this.current?.zone;
      ctx.save();
      ctx.beginPath(); ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      ctx.fillStyle = target ? `${zone.color}26` : 'rgba(4,18,34,.42)'; ctx.fill();
      ctx.lineWidth = target ? 5 : 2; ctx.strokeStyle = target ? zone.color : 'rgba(150,220,240,.22)'; ctx.stroke();
      ctx.fillStyle = target ? '#ffffff' : '#8aa6b5'; ctx.font = `700 ${target ? 18 : 14}px system-ui`; ctx.textAlign = 'center'; ctx.fillText(zone.label, point.x, point.y + 5);
      ctx.restore();
    }
    if (depth.detected) {
      const x = width * (.25 + depth.normalized * .5);
      const y = height * .72;
      ctx.save(); ctx.shadowBlur = 24; ctx.shadowColor = depth.color; ctx.beginPath(); ctx.arc(x, y, 18 + depth.normalized * 20, 0, Math.PI * 2); ctx.fillStyle = `${depth.color}88`; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#dffbff'; ctx.font = '600 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText(`${depth.zoneLabel} · ${Math.round(depth.normalized * 100)}%`, x, y + 48);
    }
  }

  async dispose() { this.stop(); this.resizeObserver?.disconnect?.(); if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
}
