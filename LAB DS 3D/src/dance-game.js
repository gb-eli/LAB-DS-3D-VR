const MOVES = Object.freeze([
  { id: "left", icon: "↙", title: "Incline à esquerda", hold: 220, match: ({ body }) => body.actions?.has("lean_left") },
  { id: "right", icon: "↘", title: "Incline à direita", hold: 220, match: ({ body }) => body.actions?.has("lean_right") },
  { id: "open", icon: "┼", title: "Abra os braços", hold: 220, match: ({ body }) => body.actions?.has("arms_open") },
  { id: "up", icon: "Y", title: "Mãos ao alto", hold: 220, match: ({ body }) => body.actions?.has("hands_up") },
  { id: "down", icon: "⌄", title: "Agache", hold: 220, match: ({ body }) => body.actions?.has("squat") },
  { id: "cross", icon: "✕", title: "Cruze os braços", hold: 240, match: ({ body }) => body.actions?.has("arms_crossed") },
  { id: "guard", icon: "◇", title: "Posição de defesa", hold: 240, match: ({ body }) => body.actions?.has("guard") },
  { id: "left_up", icon: "↖", title: "Mão esquerda ao alto", hold: 220, match: ({ body }) => body.actions?.has("left_hand_up") && !body.actions?.has("right_hand_up") },
  { id: "right_up", icon: "↗", title: "Mão direita ao alto", hold: 220, match: ({ body }) => body.actions?.has("right_hand_up") && !body.actions?.has("left_hand_up") },
  { id: "left_leg", icon: "⇖", title: "Eleve a perna esquerda", hold: 260, match: ({ body }) => body.actions?.has("left_leg_up") },
  { id: "right_leg", icon: "⇗", title: "Eleve a perna direita", hold: 260, match: ({ body }) => body.actions?.has("right_leg_up") },
  { id: "clap", icon: "✦", title: "Palmas", instant: true, match: ({ body }) => body.events?.has("clap") },
  { id: "jump", icon: "↑", title: "Pulo", instant: true, match: ({ body }) => body.events?.has("jump") }
]);

const PATTERNS = Object.freeze([
  ["left", "right", "open", "clap"],
  ["up", "down", "left", "right", "clap"],
  ["left_up", "right_up", "cross", "open"],
  ["left_leg", "right_leg", "guard", "clap"],
  ["open", "left", "open", "right", "jump", "clap"],
  ["left_up", "right", "down", "right_up", "left", "open", "clap"]
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
    this.bpm = 76;
  }

  get pattern() { return PATTERNS[this.patternIndex].map((id) => MOVES.find((move) => move.id === id)); }
  get current() { return this.pattern[this.moveIndex]; }

  start(now = performance.now()) {
    this.active = true;
    this.patternIndex = 0;
    this.moveIndex = 0;
    this.score = 0;
    this.combo = 0;
    this.bpm = 76;
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
      if (this.current.instant) this.matchedSince = now - (this.current.hold || 220);
      else if (!this.matchedSince) this.matchedSince = now;
    } else if (!this.current.instant) this.matchedSince = 0;
    const holdNeeded = this.current.hold || 220;
    const holdProgress = matched ? Math.min(1, Math.max(0, now - (this.matchedSince || now)) / holdNeeded) : 0;
    const accepted = this.current.instant ? matched : holdProgress >= 1;
    const timingAccuracy = Math.max(0, 1 - Math.abs(progress - 0.62) / 0.62);
    this.onBeat({ move: this.current, index: this.moveIndex, total: this.pattern.length, progress, holdProgress, timingAccuracy, score: this.score, combo: this.combo, bpm: this.bpm });

    if (accepted) {
      this.combo += 1;
      const precision = Math.round((timingAccuracy * 0.55 + holdProgress * 0.45) * 100);
      this.score += 100 + Math.round(precision * 0.6) + this.combo * 12;
      this.onHit({ move: this.current, score: this.score, combo: this.combo, precision });
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
    this.bpm = Math.min(112, this.bpm + 6);
    this.onPattern({ pattern: this.pattern, patternIndex: this.patternIndex, bpm: this.bpm });
  }
}

export { MOVES as DANCE_MOVES, PATTERNS as DANCE_PATTERNS };
