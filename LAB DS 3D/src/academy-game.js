import { gesturePresentation } from "./gesture-catalog.js";

const handStep = (id, options = {}) => {
  const visual = gesturePresentation(id);
  return { id, category: options.category || "MÃO", title: visual.title, hint: visual.hint, icon: visual.icon, hold: 680, ...options };
};

const STEPS = Object.freeze([
  handStep("open", { matches: ({ gestures }) => gestures.some((g) => g?.type === "open") }),
  handStep("fist", { matches: ({ gestures }) => gestures.some((g) => g?.type === "fist") }),
  handStep("pinch", { category: "DEDOS", matches: ({ gestures }) => gestures.some((g) => g?.type === "pinch") }),
  handStep("point", { category: "DEDOS", matches: ({ gestures }) => gestures.some((g) => g?.type === "point") }),
  handStep("peace", { category: "DEDOS", matches: ({ gestures }) => gestures.some((g) => g?.type === "peace") }),
  handStep("thumbs_up", { category: "GESTO", matches: ({ gestures }) => gestures.some((g) => g?.type === "thumbs_up") }),
  handStep("ok", { category: "GESTO", matches: ({ gestures }) => gestures.some((g) => g?.type === "ok") }),
  handStep("vertical", { category: "ORIENTAÇÃO", matches: ({ gestures }) => gestures.some((g) => g?.type === "open" && g?.orientation?.type === "vertical_up") }),
  handStep("horizontal", { category: "ORIENTAÇÃO", matches: ({ gestures }) => gestures.some((g) => g?.type === "open" && g?.orientation?.type?.startsWith("horizontal")) }),
  handStep("swipe", { category: "MOVIMENTO", instant: true, matches: ({ gestures }) => gestures.some((g) => ["swipe_left", "swipe_right"].includes(g?.motion?.type)) }),
  handStep("rotate", { category: "MOVIMENTO", instant: true, matches: ({ gestures }) => gestures.some((g) => ["rotate_cw", "rotate_ccw"].includes(g?.motion?.type)) }),
  { id: "arms_open", category: "CORPO", title: "Abra os braços", hint: "Mantenha os braços na altura dos ombros.", icon: "┼", hold: 780, matches: ({ body }) => body.actions?.has("arms_open") },
  { id: "hands_up", category: "CORPO", title: "Mãos ao alto", hint: "Levante as duas mãos acima da cabeça.", icon: "Y", hold: 780, matches: ({ body }) => body.actions?.has("hands_up") },
  { id: "arms_crossed", category: "CORPO", title: "Cruze os braços", hint: "Cruze os punhos diante do tronco.", icon: "✕", hold: 760, matches: ({ body }) => body.actions?.has("arms_crossed") },
  { id: "guard", category: "CORPO", title: "Posição de defesa", hint: "Posicione as mãos diante do rosto.", icon: "◇", hold: 760, matches: ({ body }) => body.actions?.has("guard") },
  { id: "squat", category: "CORPO", title: "Agache", hint: "Dobre os joelhos e abaixe o quadril.", icon: "⌄", hold: 720, matches: ({ body }) => body.actions?.has("squat") },
  { id: "lean", category: "CORPO", title: "Incline o corpo", hint: "Incline o tronco para qualquer lado.", icon: "◒", hold: 700, matches: ({ body }) => body.actions?.has("lean_left") || body.actions?.has("lean_right") },
  { id: "balance", category: "CORPO", title: "Equilíbrio", hint: "Levante uma das pernas e mantenha o equilíbrio.", icon: "↟", hold: 780, matches: ({ body }) => body.actions?.has("left_leg_up") || body.actions?.has("right_leg_up") },
  { id: "clap", category: "MOVIMENTO", title: "Bata palmas", hint: "Aproxime as duas mãos rapidamente.", icon: "✦", instant: true, matches: ({ body }) => body.events?.has("clap") },
  { id: "jump", category: "MOVIMENTO", title: "Pule", hint: "Faça um pulo curto mantendo-se no enquadramento.", icon: "↑", instant: true, matches: ({ body }) => body.events?.has("jump") }
]);

export class AcademyGame {
  constructor({ onStep = () => {}, onProgress = () => {}, onSuccess = () => {}, onComplete = () => {} } = {}) {
    this.onStep = onStep;
    this.onProgress = onProgress;
    this.onSuccess = onSuccess;
    this.onComplete = onComplete;
    this.active = false;
    this.index = 0;
    this.score = 0;
    this.holdStartedAt = 0;
    this.lastSuccessAt = 0;
  }

  get step() { return STEPS[this.index]; }

  start() {
    this.active = true;
    this.index = 0;
    this.score = 0;
    this.holdStartedAt = 0;
    this.onStep(this.step, this.index, STEPS.length);
    this.onProgress({ progress: 0, score: 0, index: 0, total: STEPS.length });
  }

  stop() { this.active = false; this.holdStartedAt = 0; }

  update(context, now = performance.now()) {
    if (!this.active || !this.step) return;
    const matched = this.step.matches(context || {});
    if (!matched) {
      this.holdStartedAt = 0;
      this.onProgress({ progress: 0, score: this.score, index: this.index, total: STEPS.length, step: this.step });
      return;
    }

    if (this.step.instant) {
      if (now - this.lastSuccessAt > 650) this.complete(now);
      return;
    }

    if (!this.holdStartedAt) this.holdStartedAt = now;
    const progress = Math.min(1, (now - this.holdStartedAt) / (this.step.hold || 700));
    this.onProgress({ progress, score: this.score, index: this.index, total: STEPS.length, step: this.step });
    if (progress >= 1 && now - this.lastSuccessAt > 650) this.complete(now);
  }

  complete(now) {
    const completed = this.step;
    this.lastSuccessAt = now;
    this.score += 100;
    this.onSuccess({ step: completed, score: this.score, index: this.index, total: STEPS.length });
    this.index += 1;
    this.holdStartedAt = 0;
    if (this.index >= STEPS.length) {
      this.active = false;
      this.onComplete({ score: this.score, total: STEPS.length });
      return;
    }
    this.onStep(this.step, this.index, STEPS.length);
  }
}

export { STEPS as ACADEMY_STEPS };
