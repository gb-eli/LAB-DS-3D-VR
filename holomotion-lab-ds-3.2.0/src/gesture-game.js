const CHALLENGES = [
  { id: "open", title: "Mão aberta", hint: "Abra todos os dedos e mantenha a palma visível.", matches: (gesture) => gesture?.type === "open" },
  { id: "fist", title: "Mão fechada", hint: "Feche a mão completamente.", matches: (gesture) => gesture?.type === "fist" },
  { id: "pinch", title: "Pinça", hint: "Junte a ponta do indicador com o polegar.", matches: (gesture) => ["pinch", "ok"].includes(gesture?.type) },
  { id: "point", title: "Apontar", hint: "Deixe apenas o indicador estendido.", matches: (gesture) => gesture?.type === "point" },
  { id: "peace", title: "Vitória", hint: "Estenda o indicador e o dedo médio.", matches: (gesture) => gesture?.type === "peace" },
  { id: "thumbs_up", title: "Positivo", hint: "Feche os dedos e levante o polegar.", matches: (gesture) => gesture?.type === "thumbs_up" },
  { id: "vertical", title: "Mão em pé", hint: "Mantenha a mão aberta na orientação vertical.", matches: (gesture) => gesture?.type === "open" && gesture?.orientation?.type === "vertical_up" },
  { id: "horizontal", title: "Mão deitada", hint: "Mantenha a mão aberta na orientação horizontal.", matches: (gesture) => gesture?.type === "open" && gesture?.orientation?.type?.startsWith("horizontal") },
  { id: "swipe", title: "Deslizar", hint: "Com a mão aberta, faça um movimento lateral rápido.", matches: (gesture) => ["swipe_left", "swipe_right"].includes(gesture?.motion?.type) }
];

export class GestureGame {
  constructor({ onChallenge = () => {}, onProgress = () => {}, onSuccess = () => {} } = {}) {
    this.onChallenge = onChallenge;
    this.onProgress = onProgress;
    this.onSuccess = onSuccess;
    this.index = 0;
    this.holdStartedAt = 0;
    this.lastSuccessAt = 0;
    this.score = 0;
    this.active = false;
  }

  get challenge() {
    return CHALLENGES[this.index % CHALLENGES.length];
  }

  start() {
    this.active = true;
    this.index = 0;
    this.score = 0;
    this.holdStartedAt = 0;
    this.onChallenge(this.challenge);
  }

  stop() {
    this.active = false;
    this.holdStartedAt = 0;
  }

  next() {
    this.index = (this.index + 1) % CHALLENGES.length;
    this.holdStartedAt = 0;
    this.onChallenge(this.challenge);
  }

  update(gestures = [], now = performance.now()) {
    if (!this.active) return;
    const match = gestures.find((gesture) => this.challenge.matches(gesture));
    if (!match) {
      this.holdStartedAt = 0;
      this.onProgress({ progress: 0, score: this.score, challenge: this.challenge });
      return;
    }

    if (this.challenge.id === "swipe") {
      if (now - this.lastSuccessAt < 750) return;
      this.complete(match, now);
      return;
    }

    if (!this.holdStartedAt) this.holdStartedAt = now;
    const duration = now - this.holdStartedAt;
    const progress = Math.min(1, duration / 700);
    this.onProgress({ progress, score: this.score, challenge: this.challenge, gesture: match });
    if (progress >= 1 && now - this.lastSuccessAt > 700) this.complete(match, now);
  }

  complete(gesture, now) {
    this.lastSuccessAt = now;
    this.score += 100;
    const completed = this.challenge;
    this.onSuccess({ challenge: completed, score: this.score, gesture });
    this.index = (this.index + 1) % CHALLENGES.length;
    this.holdStartedAt = 0;
    this.onChallenge(this.challenge);
  }
}

export { CHALLENGES };
