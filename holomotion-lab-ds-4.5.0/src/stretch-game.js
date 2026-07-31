const ROUTINES = Object.freeze([
  { id: "reach", icon: "Y", title: "Alongue para cima", hint: "Eleve as mãos e alongue o corpo sem forçar.", seconds: 4, match: ({ body }) => body.actions?.has("hands_up") },
  { id: "open", icon: "┼", title: "Abra o peito", hint: "Abra os braços e mantenha os ombros relaxados.", seconds: 4, match: ({ body }) => body.actions?.has("arms_open") },
  { id: "left", icon: "↙", title: "Inclinação esquerda", hint: "Incline lentamente o tronco para a esquerda.", seconds: 4, match: ({ body }) => body.actions?.has("lean_left") },
  { id: "right", icon: "↘", title: "Inclinação direita", hint: "Incline lentamente o tronco para a direita.", seconds: 4, match: ({ body }) => body.actions?.has("lean_right") },
  { id: "cross", icon: "×", title: "Abraço dos ombros", hint: "Cruze os braços suavemente à frente do corpo.", seconds: 4, match: ({ body }) => body.actions?.has("arms_crossed") },
  { id: "balance_left", icon: "◩", title: "Equilíbrio esquerdo", hint: "Eleve a perna esquerda e mantenha o equilíbrio.", seconds: 3, match: ({ body }) => body.actions?.has("left_leg_up") },
  { id: "balance_right", icon: "◧", title: "Equilíbrio direito", hint: "Eleve a perna direita e mantenha o equilíbrio.", seconds: 3, match: ({ body }) => body.actions?.has("right_leg_up") }
]);

export class StretchGame {
  constructor({ onStep = () => {}, onProgress = () => {}, onComplete = () => {} } = {}) {
    this.onStep = onStep;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.active = false;
    this.index = 0;
    this.holdStartedAt = 0;
    this.score = 0;
  }

  get step() { return ROUTINES[this.index]; }

  start() {
    this.active = true;
    this.index = 0;
    this.score = 0;
    this.holdStartedAt = 0;
    this.onStep(this.step, this.index, ROUTINES.length);
  }

  stop() { this.active = false; this.holdStartedAt = 0; }

  update(context, now = performance.now()) {
    if (!this.active || !this.step) return;
    if (!this.step.match(context || {})) {
      this.holdStartedAt = 0;
      this.onProgress({ progress: 0, remaining: this.step.seconds, index: this.index, total: ROUTINES.length, score: this.score });
      return;
    }
    if (!this.holdStartedAt) this.holdStartedAt = now;
    const elapsed = (now - this.holdStartedAt) / 1000;
    const progress = Math.min(1, elapsed / this.step.seconds);
    this.onProgress({ progress, remaining: Math.max(0, this.step.seconds - elapsed), index: this.index, total: ROUTINES.length, score: this.score });
    if (progress < 1) return;
    this.score += 150;
    this.index += 1;
    this.holdStartedAt = 0;
    if (this.index >= ROUTINES.length) {
      this.active = false;
      this.onComplete({ score: this.score, total: ROUTINES.length });
      return;
    }
    this.onStep(this.step, this.index, ROUTINES.length);
  }
}

export { ROUTINES as STRETCH_ROUTINES };
