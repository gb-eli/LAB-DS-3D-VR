import { MOTION_COMMANDS, evaluateMotion } from './motion-catalog.js';

const POOL = MOTION_COMMANDS.filter((item) => !['smile','jump'].includes(item.id));

export class MarathonGame {
  constructor({ callbacks = {}, options = {} } = {}) {
    this.callbacks = callbacks;
    this.duration = options.duration || 90_000;
    this.active = false;
    this.command = null;
    this.startedAt = 0;
    this.commandAt = 0;
    this.holdStartedAt = 0;
    this.score = 0;
    this.combo = 0;
    this.completed = 0;
    this.energy = 100;
  }

  start() {
    this.active = true;
    this.startedAt = performance.now();
    this.score = 0; this.combo = 0; this.completed = 0; this.energy = 100;
    this.next(this.startedAt);
  }
  stop() { this.active = false; }
  dispose() { this.stop(); this.callbacks = {}; }

  next(now) {
    let next = POOL[Math.floor(Math.random() * POOL.length)];
    if (next?.id === this.command?.id) next = POOL[(POOL.indexOf(next) + 3) % POOL.length];
    this.command = next; this.commandAt = now; this.holdStartedAt = 0;
    this.callbacks.onCommand?.({ command: next, completed: this.completed, combo: this.combo, energy: this.energy });
  }

  update(context, now = performance.now()) {
    if (!this.active) return;
    const remaining = Math.max(0, this.duration - (now - this.startedAt));
    this.energy = Math.max(0, this.energy - 0.012);
    if (!remaining || this.energy <= 0) {
      this.active = false;
      this.callbacks.onComplete?.({ score: this.score, completed: this.completed, combo: this.combo, xp: 60 + this.completed * 2 });
      return;
    }
    const evaluation = evaluateMotion(this.command, context);
    if (evaluation.completed) {
      if (!this.holdStartedAt) this.holdStartedAt = now;
    } else this.holdStartedAt = 0;
    const progress = this.holdStartedAt ? Math.min(1, (now - this.holdStartedAt) / Math.min(this.command.hold, 620)) : 0;
    this.callbacks.onProgress?.({ command: this.command, evaluation, progress, remaining, score: this.score, combo: this.combo, energy: this.energy, completed: this.completed });
    if (progress >= 1) {
      this.completed += 1; this.combo += 1; this.energy = Math.min(100, this.energy + 4.5);
      const gained = 100 + this.combo * 18;
      this.score += gained;
      this.callbacks.onHit?.({ command: this.command, gained, score: this.score, combo: this.combo, completed: this.completed, xp: 3 });
      this.next(now + 250);
    } else if (now - this.commandAt > 7000) {
      this.combo = 0; this.energy = Math.max(0, this.energy - 8);
      this.callbacks.onMiss?.({ command: this.command, energy: this.energy });
      this.next(now);
    }
  }
}
