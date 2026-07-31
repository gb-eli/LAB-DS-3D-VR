const LEVELS = [
  { level: 1, name: 'Iniciante Digital', min: 0 },
  { level: 2, name: 'Explorador de Gestos', min: 250 },
  { level: 3, name: 'Operador Holográfico', min: 650 },
  { level: 4, name: 'Controlador de Movimento', min: 1300 },
  { level: 5, name: 'Especialista Corporal', min: 2300 },
  { level: 6, name: 'Mestre Holográfico', min: 3800 },
  { level: 7, name: 'Operador Cósmico', min: 6000 }
];

export class ProgressionSystem {
  constructor(store, { onChange = () => {}, onLevelUp = () => {} } = {}) {
    this.store = store;
    this.onChange = onChange;
    this.onLevelUp = onLevelUp;
    this.data = store.get('progression') || { xp: 0, achievements: {}, modules: {}, updatedAt: null };
  }

  getLevel(xp = this.data.xp) {
    return [...LEVELS].reverse().find((item) => xp >= item.min) || LEVELS[0];
  }

  get nextLevel() {
    const current = this.getLevel();
    return LEVELS.find((item) => item.level === current.level + 1) || null;
  }

  award(amount, reason, { module = 'general', achievement = null } = {}) {
    const safe = Math.max(0, Math.round(Number(amount) || 0));
    if (!safe) return this.snapshot();
    const previousLevel = this.getLevel();
    this.data.xp += safe;
    this.data.updatedAt = new Date().toISOString();
    const currentModule = this.data.modules[module] || { xp: 0, completions: 0, best: 0 };
    currentModule.xp += safe;
    this.data.modules[module] = currentModule;
    if (achievement && !this.data.achievements[achievement]) this.data.achievements[achievement] = this.data.updatedAt;
    this.store.set('progression', this.data);
    const nextLevel = this.getLevel();
    const payload = { amount: safe, reason, module, previousLevel, level: nextLevel, ...this.snapshot() };
    this.onChange(payload);
    if (nextLevel.level > previousLevel.level) this.onLevelUp(payload);
    return payload;
  }

  complete(module, score = 0, xp = 50) {
    const stats = this.data.modules[module] || { xp: 0, completions: 0, best: 0 };
    stats.completions += 1;
    stats.best = Math.max(stats.best, Math.round(score || 0));
    this.data.modules[module] = stats;
    this.store.set('progression', this.data);
    return this.award(xp, 'Atividade concluída', { module, achievement: `first-${module}` });
  }

  reset() {
    this.data = { xp: 0, achievements: {}, modules: {}, updatedAt: null };
    this.store.set('progression', this.data);
    this.onChange(this.snapshot());
  }

  snapshot() {
    const level = this.getLevel();
    const next = this.nextLevel;
    const inLevel = this.data.xp - level.min;
    const span = next ? next.min - level.min : 1;
    return {
      ...this.data,
      level,
      next,
      progress: next ? Math.min(1, inLevel / span) : 1,
      xpToNext: next ? Math.max(0, next.min - this.data.xp) : 0
    };
  }
}

export { LEVELS };
