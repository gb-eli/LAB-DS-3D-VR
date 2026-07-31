import { MOTION_COMMANDS, evaluateMotion } from './motion-catalog.js';

export class MotionChecklistGame {
  constructor({ callbacks = {}, options = {} } = {}) {
    this.callbacks = callbacks;
    this.options = options;
    this.active = false;
    this.index = 0;
    this.startedAt = 0;
    this.holdStartedAt = 0;
    this.score = 0;
    this.completed = new Set();
    this.commands = [...MOTION_COMMANDS];
    this.lastEvaluation = null;
  }

  get command() { return this.commands[this.index] || this.commands[0]; }

  start({ reset = false } = {}) {
    this.active = true;
    if (reset) this.reset();
    this.startedAt = performance.now();
    this.callbacks.onStep?.(this.command, this.index, this.commands.length);
  }

  stop() { this.active = false; this.holdStartedAt = 0; }
  dispose() { this.stop(); this.callbacks = {}; }

  reset() {
    this.index = 0;
    this.score = 0;
    this.completed.clear();
    this.holdStartedAt = 0;
    this.callbacks.onStep?.(this.command, this.index, this.commands.length);
  }

  next() {
    this.index = (this.index + 1) % this.commands.length;
    this.holdStartedAt = 0;
    this.callbacks.onStep?.(this.command, this.index, this.commands.length);
  }

  previous() {
    this.index = (this.index - 1 + this.commands.length) % this.commands.length;
    this.holdStartedAt = 0;
    this.callbacks.onStep?.(this.command, this.index, this.commands.length);
  }

  update(context, now = performance.now()) {
    if (!this.active) return;
    const evaluation = evaluateMotion(this.command, context);
    this.lastEvaluation = evaluation;
    if (evaluation.completed) {
      if (!this.holdStartedAt) this.holdStartedAt = now;
    } else {
      this.holdStartedAt = 0;
    }
    const holdProgress = this.holdStartedAt ? Math.min(1, (now - this.holdStartedAt) / this.command.hold) : 0;
    this.callbacks.onProgress?.({ evaluation, holdProgress, score: this.score, index: this.index, total: this.commands.length });
    if (holdProgress >= 1) {
      const first = !this.completed.has(this.command.id);
      this.completed.add(this.command.id);
      const gained = first ? 100 + this.command.xp * 5 : 35;
      this.score += gained;
      this.callbacks.onSuccess?.({ command: this.command, score: this.score, gained, xp: first ? this.command.xp : 2, first });
      this.index += 1;
      this.holdStartedAt = 0;
      if (this.index >= this.commands.length) {
        this.index = 0;
        this.callbacks.onComplete?.({ score: this.score, completed: this.completed.size, total: this.commands.length });
      }
      this.callbacks.onStep?.(this.command, this.index, this.commands.length);
    }
  }
}
