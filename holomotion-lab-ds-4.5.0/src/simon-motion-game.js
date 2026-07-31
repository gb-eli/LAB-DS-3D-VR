import { MOTION_COMMANDS, evaluateMotion } from './motion-catalog.js';

const POOL_IDS = ['open','fist','pinch','point','thumbs_up','peace','arms_open','hands_up','squat','lean_left','lean_right','clap'];
const POOL = MOTION_COMMANDS.filter((item) => POOL_IDS.includes(item.id));

export class SimonMotionGame {
  constructor({ callbacks = {} } = {}) {
    this.callbacks = callbacks;
    this.active = false;
    this.sequence = [];
    this.index = 0;
    this.round = 0;
    this.score = 0;
    this.holdStartedAt = 0;
    this.cooldownUntil = 0;
  }

  start({ reset = true } = {}) {
    this.active = true;
    if (reset || !this.sequence.length) this.reset();
  }
  stop() { this.active = false; }
  dispose() { this.stop(); this.callbacks = {}; }

  reset() {
    this.sequence = [];
    this.index = 0;
    this.round = 0;
    this.score = 0;
    this.addRound();
  }

  addRound() {
    this.round += 1;
    const next = POOL[Math.floor(Math.random() * POOL.length)];
    this.sequence.push(next);
    this.index = 0;
    this.holdStartedAt = 0;
    this.callbacks.onSequence?.({ sequence: this.sequence, round: this.round, score: this.score });
  }

  update(context, now = performance.now()) {
    if (!this.active || now < this.cooldownUntil) return;
    const expected = this.sequence[this.index];
    const evaluation = evaluateMotion(expected, context);
    if (evaluation.completed) {
      if (!this.holdStartedAt) this.holdStartedAt = now;
    } else this.holdStartedAt = 0;
    const progress = this.holdStartedAt ? Math.min(1, (now - this.holdStartedAt) / Math.min(650, expected.hold)) : 0;
    this.callbacks.onProgress?.({ expected, evaluation, progress, index: this.index, total: this.sequence.length, score: this.score });
    if (progress >= 1) {
      this.index += 1;
      this.score += 80 + this.round * 20;
      this.holdStartedAt = 0;
      this.cooldownUntil = now + 420;
      if (this.index >= this.sequence.length) {
        const roundScore = this.score;
        this.callbacks.onRound?.({ round: this.round, score: this.score, xp: 12 + this.round * 2 });
        setTimeout(() => this.active && this.addRound(), 520);
        return roundScore;
      }
      this.callbacks.onProgress?.({ expected: this.sequence[this.index], evaluation: null, progress: 0, index: this.index, total: this.sequence.length, score: this.score });
    }
  }
}
