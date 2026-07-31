import { MOTION_COMMANDS, evaluateMotion } from './motion-catalog.js';

const POOL_IDS = ['open','fist','pinch','point','thumbs_up','ok','peace','arms_open','hands_up','squat','clap','lean_left','lean_right'];
const POOL = MOTION_COMMANDS.filter((item) => POOL_IDS.includes(item.id));

export class ReflexGame {
  constructor({ callbacks = {}, options = {} } = {}) {
    this.callbacks = callbacks;
    this.duration = options.duration || 45_000;
    this.active = false;
    this.command = null;
    this.startedAt = 0;
    this.commandAt = 0;
    this.score = 0;
    this.combo = 0;
    this.hits = 0;
    this.attempts = 0;
    this.holdStartedAt = 0;
  }

  start() {
    this.active = true;
    this.startedAt = performance.now();
    this.score = 0; this.combo = 0; this.hits = 0; this.attempts = 0;
    this.nextCommand(this.startedAt);
  }
  stop() { this.active = false; }
  dispose() { this.stop(); this.callbacks = {}; }

  nextCommand(now) {
    let next = POOL[Math.floor(Math.random() * POOL.length)];
    if (next?.id === this.command?.id) next = POOL[(POOL.indexOf(next) + 1) % POOL.length];
    this.command = next;
    this.commandAt = now;
    this.holdStartedAt = 0;
    this.callbacks.onCommand?.({ command: next, score: this.score, combo: this.combo });
  }

  update(context, now = performance.now()) {
    if (!this.active || !this.command) return;
    const remaining = Math.max(0, this.duration - (now - this.startedAt));
    if (!remaining) {
      this.active = false;
      const accuracy = Math.round(this.hits / Math.max(1, this.attempts) * 100);
      this.callbacks.onComplete?.({ score: this.score, combo: this.combo, hits: this.hits, attempts: this.attempts, accuracy, xp: 45 + Math.round(accuracy / 5) });
      return;
    }
    const evaluation = evaluateMotion(this.command, context);
    if (evaluation.completed) {
      if (!this.holdStartedAt) this.holdStartedAt = now;
    } else this.holdStartedAt = 0;
    const holdProgress = this.holdStartedAt ? Math.min(1, (now - this.holdStartedAt) / 420) : 0;
    const responseMs = now - this.commandAt;
    this.callbacks.onProgress?.({ command: this.command, evaluation, holdProgress, responseMs, remaining, score: this.score, combo: this.combo });
    if (holdProgress >= 1) {
      this.attempts += 1; this.hits += 1; this.combo += 1;
      const speedBonus = Math.max(0, 900 - Math.round(responseMs / 4));
      const gained = 100 + speedBonus + this.combo * 15;
      this.score += gained;
      this.callbacks.onHit?.({ command: this.command, gained, score: this.score, combo: this.combo, responseMs, xp: 4 + Math.min(8, this.combo) });
      this.nextCommand(now + 250);
    } else if (responseMs > 5000) {
      this.attempts += 1; this.combo = 0;
      this.callbacks.onMiss?.({ command: this.command, score: this.score });
      this.nextCommand(now);
    }
  }
}
