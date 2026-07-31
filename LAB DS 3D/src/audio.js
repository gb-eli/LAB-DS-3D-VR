export class HoloAudio {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.outputDeviceId = "";
  }

  ensure() {
    if (!this.enabled) return null;
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.context = new AudioContextClass();
    }
    if (this.context?.state === "suspended") this.context.resume().catch(() => {});
    if (this.outputDeviceId && typeof this.context?.setSinkId === "function" && this.context.sinkId !== this.outputDeviceId) {
      this.context.setSinkId(this.outputDeviceId).catch(() => {});
    }
    return this.context;
  }

  async setOutputDevice(deviceId = "") {
    this.outputDeviceId = deviceId || "";
    const context = this.ensure();
    if (!context || !deviceId) return { supported: Boolean(context?.setSinkId), applied: false };
    if (typeof context.setSinkId !== "function") return { supported: false, applied: false };
    await context.setSinkId(deviceId);
    return { supported: true, applied: true };
  }

  tone({ frequency = 440, duration = 0.08, type = "sine", gain = 0.04, slide = 0 } = {}) {
    const ctx = this.ensure();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const volume = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequency + slide), ctx.currentTime + duration);
    volume.gain.setValueAtTime(0.0001, ctx.currentTime);
    volume.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.01);
    volume.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(volume).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration + 0.02);
  }

  select() { this.tone({ frequency: 520, slide: 260, duration: 0.09, type: "triangle" }); }
  grab() { this.tone({ frequency: 190, slide: 120, duration: 0.11, type: "sawtooth", gain: 0.025 }); }
  release() { this.tone({ frequency: 340, slide: -100, duration: 0.09, type: "triangle" }); }
  success() {
    this.tone({ frequency: 660, duration: 0.08, type: "triangle" });
    setTimeout(() => this.tone({ frequency: 880, duration: 0.1, type: "triangle" }), 75);
  }
  miss() { this.tone({ frequency: 150, slide: -60, duration: 0.15, type: "sawtooth", gain: 0.025 }); }
}
