const KEY = "holomotion-lab-ds:v3";
const LEGACY_KEYS = ["holomotion-lab-ds:v2", "holomotion-lab-ds:v1"];

const DEFAULTS = {
  quality: "balanced",
  mirror: true,
  skeleton: true,
  gestureUi: false,
  dwellUi: true,
  sensitivity: 1,
  cubeColor: "#00e5ff",
  objectType: "cube",
  captureMode: "close",
  players: 1,
  highScore: 0,
  bestPose: 0,
  bestGestureScore: 0,
  sessions: 0,
  lastMode: "sandbox"
};

export class LocalStore {
  constructor() {
    this.data = this.read();
  }

  read() {
    try {
      const current = JSON.parse(localStorage.getItem(KEY) || "null");
      if (current) return { ...DEFAULTS, ...current };
      for (const key of LEGACY_KEYS) {
        const legacy = JSON.parse(localStorage.getItem(key) || "null");
        if (!legacy) continue;
        const migrated = { ...DEFAULTS, ...legacy };
        localStorage.setItem(KEY, JSON.stringify(migrated));
        return migrated;
      }
      return { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  }

  get(key) { return this.data[key]; }

  set(key, value) {
    this.data[key] = value;
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); }
    catch (error) { console.warn("Não foi possível salvar a preferência local.", error); }
  }

  increment(key) { this.set(key, Number(this.get(key) || 0) + 1); }

  reset() {
    this.data = { ...DEFAULTS };
    localStorage.removeItem(KEY);
  }
}
