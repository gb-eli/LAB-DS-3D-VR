const MOVES = Object.freeze([
  { id: "left", icon: "↙", title: "Incline à esquerda", match: ({ body }) => body.actions?.has("lean_left") },
  { id: "right", icon: "↘", title: "Incline à direita", match: ({ body }) => body.actions?.has("lean_right") },
  { id: "open", icon: "┼", title: "Abra os braços", match: ({ body }) => body.actions?.has("arms_open") },
  { id: "up", icon: "Y", title: "Mãos ao alto", match: ({ body }) => body.actions?.has("hands_up") },
  { id: "down", icon: "⌄", title: "Agache", match: ({ body }) => body.actions?.has("squat") },
  { id: "clap", icon: "✦", title: "Palmas", instant: true, match: ({ body }) => body.events?.has("clap") }
]);

const PATTERNS = Object.freeze([
  ["left", "right", "open", "clap"],
  ["up", "down", "left", "right"],
  ["open", "left", "open", "right", "clap"],
  ["left", "right", "up", "down", "clap", "open"]
]);

export class DanceGame {
  constructor({ onPattern = () => {}, onBeat = () => {}, onHit = () => {}, onMiss = () => {}, onComplete = () => {} } = {}) {
    this.onPattern = onPattern;
    this.onBeat = onBeat;
    this.onHit = onHit;
    this.onMiss = onMiss;
    this.onComplete = onComplete;
    this.active = false;
    this.patternIndex = 0;
    this.moveIndex = 0;
    this.score = 0;
    this.combo = 0;
    this.beatStartedAt = 0;
    this.matchedSince = 0;
    this.bpm = 78;
  }

  get pattern() { return PATTERNS[this.patternIndex].map((id) => MOVES.find((move) => move.id === id)); }
  get current() { return this.pattern[this.moveIndex]; }

  start(now = performance.now()) {
    this.active = true;
    this.patternIndex = 0;
    this.moveIndex = 0;
    this.score = 0;
    this.combo = 0;
    this.beatStartedAt = now;
    this.matchedSince = 0;
    this.onPattern({ pattern: this.pattern, patternIndex: this.patternIndex, bpm: this.bpm });
  }

  stop() { this.active = false; }

  update(context, now = performance.now()) {
    if (!this.active || !this.current) return;
    const beatDuration = 60000 / this.bpm;
    const elapsed = now - this.beatStartedAt;
    const progress = Math.min(1, elapsed / beatDuration);
    const matched = this.current.match(context || {});
    if (matched) {
      if (this.current.instant) this.matchedSince = now - 250;
      else if (!this.matchedSince) this.matchedSince = now;
    } else if (!this.current.instant) this.matchedSince = 0;
    const hold = this.current.instant ? matched : this.matchedSince && now - this.matchedSince >= 240;
    this.onBeat({ move: this.current, index: this.moveIndex, total: this.pattern.length, progress, score: this.score, combo: this.combo, bpm: this.bpm });

    if (hold) {
      this.combo += 1;
      this.score += 120 + this.combo * 12;
      this.onHit({ move: this.current, score: this.score, combo: this.combo });
      this.advance(now);
      return;
    }
    if (progress >= 1) {
      this.combo = 0;
      this.score = Math.max(0, this.score - 25);
      this.onMiss({ move: this.current, score: this.score, combo: this.combo });
      this.advance(now);
    }
  }

  advance(now) {
    this.moveIndex += 1;
    this.beatStartedAt = now;
    this.matchedSince = 0;
    if (this.moveIndex < this.pattern.length) return;
    this.patternIndex += 1;
    if (this.patternIndex >= PATTERNS.length) {
      this.active = false;
      this.onComplete({ score: this.score, combo: this.combo });
      return;
    }
    this.moveIndex = 0;
    this.bpm = Math.min(104, this.bpm + 7);
    this.onPattern({ pattern: this.pattern, patternIndex: this.patternIndex, bpm: this.bpm });
  }
}

export { MOVES as DANCE_MOVES, PATTERNS as DANCE_PATTERNS };
