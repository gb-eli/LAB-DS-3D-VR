export const PERFORMANCE_PROFILES = {
  auto: { label: 'Automático', quality: 'balanced', targetFps: 50, adaptive: true, preload: 'idle', keepModules: 1 },
  performance: { label: 'Desempenho máximo', quality: 'performance', targetFps: 60, adaptive: true, preload: 'none', keepModules: 0 },
  balanced: { label: 'Equilibrado', quality: 'balanced', targetFps: 50, adaptive: true, preload: 'idle', keepModules: 1 },
  quality: { label: 'Qualidade gráfica', quality: 'quality', targetFps: 45, adaptive: true, preload: 'idle', keepModules: 1 },
  precision: { label: 'Precisão dos sensores', quality: 'precision', targetFps: 45, adaptive: true, preload: 'none', keepModules: 0 },
  turbo: { label: 'DS Turbo', quality: 'turbo', targetFps: 60, adaptive: true, preload: 'idle', keepModules: 2 },
  ultra: { label: 'DS Ultra', quality: 'ultra', targetFps: 120, adaptive: true, preload: 'idle', keepModules: 3 },
  extreme: { label: 'Experimental 240', quality: 'ultra', targetFps: 240, adaptive: true, preload: 'none', keepModules: 1 },
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
    this.emaFps = 0;
    this.lowWindows = 0;
    this.goodWindows = 0;
    this.stallWindows = 0;
    this.lastSampleAt = 0;
    this.displayRefreshRate = 60;
    this.hardwareSnapshot = null;
  }

  get profile() { return PERFORMANCE_PROFILES[this.profileId]; }
  get targetFps() { return Math.max(30, Math.min(this.profile.targetFps, this.displayRefreshRate || this.profile.targetFps)); }
  get usage() { return USAGE_MODES[this.usageId]; }

  detectCapability() {
    const cores = navigator.hardwareConcurrency || 2;
    const memory = navigator.deviceMemory || 4;
    let webgl2 = false;
    try { webgl2 = Boolean(document.createElement('canvas').getContext('webgl2')); } catch {}
    const saveData = Boolean(navigator.connection?.saveData);
    const mobile = (navigator.maxTouchPoints || 0) > 0 && Math.min(globalThis.screen?.width || 1280, globalThis.screen?.height || 720) < 900;
    const score = cores * 1.4 + memory * 1.8 + (webgl2 ? 5 : 0) - (saveData ? 6 : 0) - (mobile ? 2 : 0);
    const recommendation = score >= 28 ? 'turbo' : score >= 18 ? 'balanced' : 'economy';
    this.capability = { cores, memory, webgl2, saveData, mobile, score: Math.round(score), recommendation };
    if (this.profileId === 'auto') this.onChange({ type: 'recommendation', profile: recommendation, capability: this.capability });
    return this.capability;
  }

  setRefreshRate(rate = 60) {
    const value = Number(rate);
    if (Number.isFinite(value) && value >= 24 && value <= 500) this.displayRefreshRate = value;
    this.onChange({ type: 'refresh-rate', refreshRate: this.displayRefreshRate, targetFps: this.targetFps });
  }

  applyHardwareSnapshot(snapshot = {}) {
    this.hardwareSnapshot = snapshot;
    if (snapshot.refreshRate) this.setRefreshRate(snapshot.refreshRate);
    if (this.profileId === 'auto' && snapshot.recommendation && PERFORMANCE_PROFILES[snapshot.recommendation]) {
      this.capability = { ...(this.capability || {}), ...snapshot, recommendation: snapshot.recommendation };
      this.onChange({ type: 'recommendation', profile: snapshot.recommendation, capability: this.capability });
    }
  }

  setProfile(profileId) {
    if (!PERFORMANCE_PROFILES[profileId]) return;
    this.profileId = profileId;
    this.adaptiveLevel = 0;
    this.samples.length = 0;
    this.emaFps = 0;
    this.lowWindows = 0;
    this.goodWindows = 0;
    this.stallWindows = 0;
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
    if (mode === 'scanner') return this.capability.recommendation === 'turbo' ? 'turbo' : this.capability.recommendation === 'economy' ? 'performance' : 'balanced';
    if (['explorer', 'sandbox', 'aura'].includes(mode)) return this.capability.recommendation === 'turbo' ? 'turbo' : 'balanced';
    return PERFORMANCE_PROFILES[this.capability.recommendation]?.quality || 'balanced';
  }

  sample(fps, now = performance.now()) {
    if (!Number.isFinite(fps)) return;
    this.samples.push(fps);
    if (this.samples.length > 12) this.samples.shift();
    this.emaFps = this.emaFps ? this.emaFps * 0.72 + fps * 0.28 : fps;
    const ordered = [...this.samples].sort((a, b) => a - b);
    const lowPercentile = ordered[Math.floor((ordered.length - 1) * 0.25)] || fps;
    const avg = this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length;
    const effective = Math.min(avg, this.emaFps * 1.04, lowPercentile * 1.12);
    const target = this.targetFps;
    const sampleGap = this.lastSampleAt ? now - this.lastSampleAt : 1000;
    this.lastSampleAt = now;
    if (sampleGap > 1550 || fps < target * .42) this.stallWindows += 1;
    else this.stallWindows = Math.max(0, this.stallWindows - 1);
    const nextState = effective < target * 0.62 ? 'reduced' : effective < target * 0.83 ? 'adjusting' : 'stable';
    if (nextState !== this.state) {
      this.state = nextState;
      this.onChange({ type: 'state', state: nextState, fps: Math.round(effective) });
    }
    if (effective < target * 0.72) { this.lowWindows += 1; this.goodWindows = 0; }
    else if (effective > target * 0.94) { this.goodWindows += 1; this.lowWindows = Math.max(0, this.lowWindows - 1); }
    else { this.lowWindows = Math.max(0, this.lowWindows - 1); this.goodWindows = Math.max(0, this.goodWindows - 1); }
    if (!this.profile.adaptive || this.samples.length < 5) return;
    const severe = effective < target * 0.5 || this.stallWindows >= 2;
    const downReady = severe ? this.lowWindows >= 2 || this.stallWindows >= 2 : this.lowWindows >= 4;
    if (downReady && this.adaptiveLevel < 4 && now - this.lastAdaptAt > (severe ? 1800 : 3200)) {
      this.adaptiveLevel += 1;
      this.lowWindows = 0;
      this.lastAdaptAt = now;
      this.onAdapt({ direction: 'down', level: this.adaptiveLevel, fps: effective, budget: this.budget() });
    } else if (this.goodWindows >= 12 && this.adaptiveLevel > 0 && now - this.lastAdaptAt > 6500) {
      this.adaptiveLevel -= 1;
      this.goodWindows = 0;
      this.lastAdaptAt = now;
      this.onAdapt({ direction: 'up', level: this.adaptiveLevel, fps: effective, budget: this.budget() });
    }
  }

  budget() {
    const levels = [
      { pixelRatio: 1, particles: 1, effects: 1, sensorScale: 1, motionScale: 1 },
      { pixelRatio: .88, particles: .72, effects: .82, sensorScale: 1.12, motionScale: .92 },
      { pixelRatio: .74, particles: .42, effects: .58, sensorScale: 1.34, motionScale: .82 },
      { pixelRatio: .64, particles: .2, effects: .34, sensorScale: 1.62, motionScale: .72 },
      { pixelRatio: .54, particles: .08, effects: .18, sensorScale: 1.95, motionScale: .52 }
    ];
    return levels[this.adaptiveLevel] || levels.at(-1);
  }

  snapshot() {
    return {
      profileId: this.profileId,
      usageId: this.usageId,
      profile: this.profile,
      targetFps: this.targetFps,
      displayRefreshRate: this.displayRefreshRate,
      hardwareSnapshot: this.hardwareSnapshot,
      usage: this.usage,
      state: this.state,
      adaptiveLevel: this.adaptiveLevel,
      emaFps: this.emaFps,
      budget: this.budget(),
      capability: this.capability,
      stallWindows: this.stallWindows
    };
  }
}
