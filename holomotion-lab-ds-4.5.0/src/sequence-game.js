const TOKENS = Object.freeze([
  { id: "open", title: "Mão aberta", icon: "✋", kind: "hand", match: ({ gestures }) => gestures.some((g) => g?.type === "open") },
  { id: "fist", title: "Punho", icon: "✊", kind: "hand", match: ({ gestures }) => gestures.some((g) => g?.type === "fist") },
  { id: "pinch", title: "Pinça", icon: "⌁", kind: "hand", match: ({ gestures }) => gestures.some((g) => ["pinch", "ok"].includes(g?.type)) },
  { id: "point", title: "Apontar", icon: "☝", kind: "hand", match: ({ gestures }) => gestures.some((g) => g?.type === "point") },
  { id: "arms_open", title: "Braços abertos", icon: "┼", kind: "body", match: ({ body }) => body.actions?.has("arms_open") },
  { id: "hands_up", title: "Mãos ao alto", icon: "Y", kind: "body", match: ({ body }) => body.actions?.has("hands_up") },
  { id: "squat", title: "Agachar", icon: "⌄", kind: "body", match: ({ body }) => body.actions?.has("squat") },
  { id: "lean_left", title: "Inclinar esquerda", icon: "↙", kind: "body", match: ({ body }) => body.actions?.has("lean_left") },
  { id: "lean_right", title: "Inclinar direita", icon: "↘", kind: "body", match: ({ body }) => body.actions?.has("lean_right") }
]);

function pick(pool, previous) {
  const options = pool.filter((token) => token.id !== previous?.id);
  return options[Math.floor(Math.random() * options.length)] || pool[0];
}

export class SequenceGame {
  constructor({ onSequence = () => {}, onProgress = () => {}, onRound = () => {}, onFail = () => {} } = {}) {
    this.onSequence = onSequence;
    this.onProgress = onProgress;
    this.onRound = onRound;
    this.onFail = onFail;
    this.active = false;
    this.sequence = [];
    this.inputIndex = 0;
    this.round = 0;
    this.score = 0;
    this.armed = true;
    this.candidateSince = 0;
    this.candidateId = null;
    this.lastAcceptedAt = 0;
    this.demoOnly = false;
  }

  start({ demoOnly = false } = {}) {
    this.active = true;
    this.demoOnly = demoOnly;
    this.sequence = [];
    this.inputIndex = 0;
    this.round = 0;
    this.score = 0;
    this.armed = true;
    this.addRound();
  }

  stop() { this.active = false; }

  addRound() {
    const pool = this.demoOnly ? TOKENS.filter((token) => token.kind === "hand") : TOKENS;
    const targetLength = Math.min(8, 2 + this.round);
    while (this.sequence.length < targetLength) this.sequence.push(pick(pool, this.sequence.at(-1)));
    this.round += 1;
    this.inputIndex = 0;
    this.armed = true;
    this.candidateSince = 0;
    this.candidateId = null;
    this.onSequence({ sequence: this.sequence, round: this.round, score: this.score });
    this.onProgress({ index: 0, total: this.sequence.length, score: this.score, round: this.round });
  }

  update(context, now = performance.now()) {
    if (!this.active || !this.sequence.length) return;
    const matches = TOKENS.filter((token) => token.match(context || {}));
    if (!matches.length) {
      this.armed = true;
      this.candidateSince = 0;
      this.candidateId = null;
      return;
    }
    if (!this.armed || (this.lastAcceptedAt && now - this.lastAcceptedAt < 420)) return;

    const expected = this.sequence[this.inputIndex];
    const candidate = matches.find((token) => token.id === expected.id) || matches[0];
    if (this.candidateId !== candidate.id) {
      this.candidateId = candidate.id;
      this.candidateSince = now;
    }
    if (!this.candidateSince) this.candidateSince = now;
    const stableFor = now - this.candidateSince;
    if (stableFor < 420) return;

    this.armed = false;
    this.candidateSince = 0;
    this.candidateId = null;
    this.lastAcceptedAt = now;
    if (candidate.id !== expected.id) {
      this.score = Math.max(0, this.score - 50);
      this.inputIndex = 0;
      this.onFail({ expected, received: candidate, score: this.score, round: this.round });
      this.onProgress({ index: 0, total: this.sequence.length, score: this.score, round: this.round });
      return;
    }

    this.inputIndex += 1;
    this.score += 100 + this.round * 10;
    this.onProgress({ index: this.inputIndex, total: this.sequence.length, score: this.score, round: this.round, accepted: candidate });
    if (this.inputIndex >= this.sequence.length) {
      this.score += 250 * this.round;
      this.onRound({ round: this.round, score: this.score, sequence: this.sequence });
      setTimeout(() => { if (this.active) this.addRound(); }, 900);
    }
  }
}

export { TOKENS as SEQUENCE_TOKENS };
