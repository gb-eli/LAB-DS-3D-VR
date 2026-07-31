const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const ASSEMBLY_TUTORIAL_STEPS = Object.freeze([
  { id: 'detect', icon: '☝', title: 'Mostre uma mão', instruction: 'Mantenha a mão inteira visível na área central.', duration: 650, check: ({ gesture }) => Boolean(gesture?.palm) },
  { id: 'open', icon: '✋', title: 'Abra a mão', instruction: 'Abra os dedos para preparar a seleção.', duration: 520, check: ({ gesture }) => ['open', 'point', 'peace'].includes(gesture?.type) },
  { id: 'pinch', icon: '⌁', title: 'Faça uma pinça', instruction: 'Encoste o indicador no polegar sobre uma peça.', duration: 520, check: ({ gesture, grabbed }) => ['pinch', 'ok'].includes(gesture?.type) || Boolean(grabbed) },
  { id: 'move', icon: '↔', title: 'Arraste a peça', instruction: 'Mova a mão lentamente até a zona destacada.', duration: 580, check: ({ moved }) => moved > .08 },
  { id: 'depth', icon: '◉', title: 'Teste a profundidade', instruction: 'Aproxime e afaste a mão para percorrer LONGE, MÉDIO e PERTO.', duration: 760, check: ({ depthVisited }) => depthVisited?.size >= 2 },
  { id: 'release', icon: '✋', title: 'Solte para encaixar', instruction: 'Abra a mão quando a peça estiver sobre o encaixe.', duration: 520, check: ({ placed }) => placed > 0 }
]);

export class TutorialDirector {
  constructor({ steps = ASSEMBLY_TUTORIAL_STEPS, callbacks = {} } = {}) {
    this.steps = steps;
    this.callbacks = callbacks;
    this.reset();
  }

  reset() {
    this.active = false;
    this.index = 0;
    this.progress = 0;
    this.holdStartedAt = 0;
    this.completed = false;
    this.startedAt = 0;
  }

  start(index = 0) {
    this.active = true;
    this.completed = false;
    this.index = clamp(index, 0, this.steps.length - 1);
    this.progress = 0;
    this.holdStartedAt = 0;
    this.startedAt = performance.now();
    this.callbacks.onStep?.(this.snapshot());
    return this.snapshot();
  }

  pause() { this.active = false; this.callbacks.onState?.(this.snapshot()); }
  resume() { if (!this.completed) { this.active = true; this.callbacks.onState?.(this.snapshot()); } }
  toggle() { this.active ? this.pause() : this.resume(); return this.active; }

  next() {
    if (this.index >= this.steps.length - 1) return this.#complete();
    this.index += 1;
    this.progress = 0;
    this.holdStartedAt = 0;
    this.callbacks.onStep?.(this.snapshot());
    return this.snapshot();
  }

  previous() {
    this.index = Math.max(0, this.index - 1);
    this.progress = 0;
    this.holdStartedAt = 0;
    this.callbacks.onStep?.(this.snapshot());
    return this.snapshot();
  }

  repeat() {
    this.progress = 0;
    this.holdStartedAt = 0;
    this.callbacks.onRepeat?.(this.snapshot());
    return this.snapshot();
  }

  update(context = {}, now = performance.now()) {
    if (!this.active || this.completed) return this.snapshot();
    const step = this.steps[this.index];
    const valid = Boolean(step.check?.(context));
    if (valid) {
      if (!this.holdStartedAt) this.holdStartedAt = now;
      this.progress = clamp((now - this.holdStartedAt) / step.duration, 0, 1);
      if (this.progress >= 1) {
        this.callbacks.onValidated?.({ step, index: this.index, total: this.steps.length });
        this.next();
      }
    } else {
      this.holdStartedAt = 0;
      this.progress = Math.max(0, this.progress - .08);
    }
    this.callbacks.onProgress?.(this.snapshot());
    return this.snapshot();
  }

  demonstration(now = performance.now()) {
    const step = this.steps[this.index];
    const phase = ((now - this.startedAt) % 2200) / 2200;
    const wave = .5 - Math.cos(phase * Math.PI * 2) * .5;
    if (step?.id === 'move') return { x: .22 + wave * .56, y: .67 - Math.sin(phase * Math.PI) * .18, pinch: true, depth: .5 };
    if (step?.id === 'depth') return { x: .5, y: .52, pinch: false, depth: .15 + wave * .72 };
    if (step?.id === 'pinch') return { x: .28, y: .72, pinch: phase > .42 && phase < .82, depth: .5 };
    if (step?.id === 'release') return { x: .52, y: .35, pinch: phase < .58, depth: .5 };
    return { x: .5 + Math.sin(phase * Math.PI * 2) * .06, y: .5, pinch: step?.id !== 'open', depth: .5 };
  }

  snapshot() {
    return { active: this.active, completed: this.completed, index: this.index, total: this.steps.length, progress: this.progress, step: this.steps[this.index] || null };
  }

  #complete() {
    this.active = false;
    this.completed = true;
    this.progress = 1;
    this.callbacks.onComplete?.(this.snapshot());
    return this.snapshot();
  }
}
