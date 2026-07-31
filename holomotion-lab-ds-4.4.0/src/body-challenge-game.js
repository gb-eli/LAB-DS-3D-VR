const COMMANDS = Object.freeze([
  { id: "arms_open", icon: "┼", title: "Abra os braços", hint: "Estenda os dois braços na altura dos ombros.", hold: 520, match: ({ body }) => body.actions?.has("arms_open") },
  { id: "hands_up", icon: "Y", title: "Mãos ao alto", hint: "Levante as duas mãos acima da cabeça.", hold: 520, match: ({ body }) => body.actions?.has("hands_up") },
  { id: "squat", icon: "⌄", title: "Agache", hint: "Dobre os joelhos e abaixe o quadril.", hold: 480, match: ({ body }) => body.actions?.has("squat") },
  { id: "lean_left", icon: "↙", title: "Incline à esquerda", hint: "Incline o tronco para a esquerda.", hold: 480, match: ({ body }) => body.actions?.has("lean_left") },
  { id: "lean_right", icon: "↘", title: "Incline à direita", hint: "Incline o tronco para a direita.", hold: 480, match: ({ body }) => body.actions?.has("lean_right") },
  { id: "left_hand_up", icon: "↖", title: "Mão esquerda", hint: "Levante apenas a mão esquerda.", hold: 460, match: ({ body }) => body.actions?.has("left_hand_up") && !body.actions?.has("right_hand_up") },
  { id: "right_hand_up", icon: "↗", title: "Mão direita", hint: "Levante apenas a mão direita.", hold: 460, match: ({ body }) => body.actions?.has("right_hand_up") && !body.actions?.has("left_hand_up") },
  { id: "guard", icon: "◇", title: "Defesa", hint: "Posicione as mãos diante do rosto.", hold: 520, match: ({ body }) => body.actions?.has("guard") },
  { id: "clap", icon: "✦", title: "Bata palmas", hint: "Aproxime as mãos rapidamente.", instant: true, match: ({ body }) => body.events?.has("clap") },
  { id: "jump", icon: "↑", title: "Pule", hint: "Faça um pulo curto e permaneça enquadrado.", instant: true, match: ({ body }) => body.events?.has("jump") }
]);

function pickCommand(previousId, difficulty = 1) {
  const pool = difficulty < 2 ? COMMANDS.filter((item) => !["jump", "guard"].includes(item.id)) : COMMANDS;
  const candidates = pool.filter((item) => item.id !== previousId);
  return candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
}

export class BodyChallengeGame {
  constructor({ onCommand = () => {}, onProgress = () => {}, onHit = () => {}, onMiss = () => {}, onFinish = () => {} } = {}) {
    this.onCommand = onCommand;
    this.onProgress = onProgress;
    this.onHit = onHit;
    this.onMiss = onMiss;
    this.onFinish = onFinish;
    this.active = false;
    this.command = null;
    this.score = 0;
    this.combo = 0;
    this.round = 0;
    this.timeLeft = 45;
    this.commandDeadline = 0;
    this.holdStartedAt = 0;
    this.lastTickAt = 0;
  }

  start(now = performance.now()) {
    this.active = true;
    this.score = 0;
    this.combo = 0;
    this.round = 0;
    this.timeLeft = 45;
    this.lastTickAt = now;
    this.next(now);
  }

  stop() { this.active = false; }

  next(now) {
    this.round += 1;
    this.command = pickCommand(this.command?.id, Math.floor(this.round / 5) + 1);
    this.commandDeadline = now + Math.max(1700, 4200 - this.round * 85);
    this.holdStartedAt = 0;
    this.onCommand({ command: this.command, round: this.round, deadline: this.commandDeadline });
  }

  update(context, now = performance.now()) {
    if (!this.active || !this.command) return;
    const dt = Math.max(0, now - this.lastTickAt);
    this.lastTickAt = now;
    this.timeLeft = Math.max(0, this.timeLeft - dt / 1000);
    if (this.timeLeft <= 0) {
      this.active = false;
      this.onFinish({ score: this.score, combo: this.combo, round: this.round });
      return;
    }

    const remaining = Math.max(0, this.commandDeadline - now);
    const matched = this.command.match(context || {});
    let progress = 0;
    if (matched) {
      if (this.command.instant) progress = 1;
      else {
        if (!this.holdStartedAt) this.holdStartedAt = now;
        progress = Math.min(1, (now - this.holdStartedAt) / (this.command.hold || 500));
      }
    } else this.holdStartedAt = 0;

    this.onProgress({ progress, remaining, timeLeft: this.timeLeft, score: this.score, combo: this.combo, round: this.round });
    if (progress >= 1) {
      const speedBonus = Math.round(remaining / 20);
      this.combo += 1;
      this.score += 100 + speedBonus + this.combo * 15;
      this.onHit({ command: this.command, score: this.score, combo: this.combo, speedBonus });
      this.next(now + 1);
      return;
    }

    if (remaining <= 0) {
      const missed = this.command;
      this.combo = 0;
      this.score = Math.max(0, this.score - 40);
      this.onMiss({ command: missed, score: this.score, combo: this.combo });
      this.next(now + 1);
    }
  }
}

export { COMMANDS as BODY_CHALLENGE_COMMANDS };
