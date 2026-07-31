export const PERFORMANCE_PROFILES = {
  auto: { label: 'Automático', quality: 'balanced', targetFps: 50, adaptive: true, preload: 'idle', keepModules: 1 },
  performance: { label: 'Desempenho máximo', quality: 'performance', targetFps: 60, adaptive: true, preload: 'none', keepModules: 0 },
  balanced: { label: 'Equilibrado', quality: 'balanced', targetFps: 50, adaptive: true, preload: 'idle', keepModules: 1 },
  quality: { label: 'Qualidade gráfica', quality: 'quality', targetFps: 45, adaptive: true, preload: 'idle', keepModules: 1 },
  precision: { label: 'Precisão dos sensores', quality: 'precision', targetFps: 45, adaptive: true, preload: 'none', keepModules: 0 },
  turbo: { label: 'DS Turbo', quality: 'turbo', targetFps: 60, adaptive: true, preload: 'idle', keepModules: 2 },
  economy: { label: 'Economia de energia', quality: 'economy', targetFps: 35, adaptive: true, preload: 'none', keepModules: 0 }
};

export const USAGE_MODES = {
  auto: { label: 'Automático' },
  presentation: { label: 'Apresentação em aula' },
  body: { label: 'Jogos corporais' },
  hands: { label: 'Gestos e mãos' },
  libras: { label: 'Libras' },
  holograms: { label: 'Hologramas 3D' },
  scanner: { label: 'Scanner do ambiente' },
  duo: { label: 'Duas pessoas' },
  offline: { label: 'Offline' },
  teacher: { label: 'Modo professor' }
};

export class PerformanceManager {
  constructor({ profile = 'auto', usage = 'auto', onChange = () => {}, onAdapt = () => {} } = {}) {
    this.profileId = PERFORMANCE_PROFILES[profile] ? profile : 'auto';
    this.usageId = USAGE_MODES[usage] ? usage : 'auto';
    this.onChange = onChange;
    this.onAdapt = onAdapt;
    this.samples = [];
    this.state = 'stable';
    this.adaptiveLevel = 0;
    this.lastAdaptAt = 0;
    this.capability = null;
  }

  get profile() { return PERFORMANCE_PROFILES[this.profileId]; }
  get usage() { return USAGE_MODES[this.usageId]; }

  detectCapability() {
    const cores = navigator.hardwareConcurrency || 2;
    const memory = navigator.deviceMemory || 4;
    let webgl2 = false;
    try { webgl2 = Boolean(document.createElement('canvas').getContext('webgl2')); } catch {}
    const score = cores * 1.4 + memory * 1.8 + (webgl2 ? 5 : 0);
    const recommendation = score >= 28 ? 'turbo' : score >= 18 ? 'balanced' : 'economy';
    this.capability = { cores, memory, webgl2, score: Math.round(score), recommendation };
    if (this.profileId === 'auto') this.onChange({ type: 'recommendation', profile: recommendation, capability: this.capability });
    return this.capability;
  }

  setProfile(profileId) {
    if (!PERFORMANCE_PROFILES[profileId]) return;
    this.profileId = profileId;
    this.adaptiveLevel = 0;
    this.samples.length = 0;
    this.onChange({ type: 'profile', profileId, profile: this.profile });
  }

  setUsage(usageId) {
    if (!USAGE_MODES[usageId]) return;
    this.usageId = usageId;
    this.onChange({ type: 'usage', usageId, usage: this.usage });
  }

  resolveQuality(mode = '') {
    if (this.profileId !== 'auto') return this.profile.quality;
    if (!this.capability) this.detectCapability();
    if (['libras', 'gestures', 'checklist'].includes(mode)) return this.capability.recommendation === 'economy' ? 'performance' : 'precision';
    if (['explorer', 'sandbox', 'aura'].includes(mode)) return this.capability.recommendation === 'turbo' ? 'turbo' : 'balanced';
    return PERFORMANCE_PROFILES[this.capability.recommendation]?.quality || 'balanced';
  }

  sample(fps, now = performance.now()) {
    if (!Number.isFinite(fps)) return;
    this.samples.push(fps);
    if (this.samples.length > 8) this.samples.shift();
    const avg = this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length;
    const target = this.profile.targetFps;
    const nextState = avg < target * 0.65 ? 'reduced' : avg < target * 0.84 ? 'adjusting' : 'stable';
    if (nextState !== this.state) {
      this.state = nextState;
      this.onChange({ type: 'state', state: nextState, fps: Math.round(avg) });
    }
    if (!this.profile.adaptive || now - this.lastAdaptAt < 4500 || this.samples.length < 6) return;
    if (avg < target * 0.64 && this.adaptiveLevel < 3) {
      this.adaptiveLevel += 1;
      this.lastAdaptAt = now;
      this.onAdapt({ direction: 'down', level: this.adaptiveLevel, fps: avg });
    } else if (avg > target * 0.92 && this.adaptiveLevel > 0) {
      this.adaptiveLevel -= 1;
      this.lastAdaptAt = now;
      this.onAdapt({ direction: 'up', level: this.adaptiveLevel, fps: avg });
    }
  }

  snapshot() {
    return {
      profileId: this.profileId,
      usageId: this.usageId,
      profile: this.profile,
      usage: this.usage,
      state: this.state,
      adaptiveLevel: this.adaptiveLevel,
      capability: this.capability
    };
  }
}
