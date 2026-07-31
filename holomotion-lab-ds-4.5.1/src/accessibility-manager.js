export const ACCESSIBILITY_PRESETS = Object.freeze({
  standard: { label: 'Padrão', contrast: false, largeText: false, reducedMotion: false, colorAssist: false },
  classroom: { label: 'Sala e projetor', contrast: true, largeText: true, reducedMotion: false, colorAssist: true },
  highContrast: { label: 'Alto contraste', contrast: true, largeText: false, reducedMotion: false, colorAssist: true },
  large: { label: 'Textos e controles maiores', contrast: false, largeText: true, reducedMotion: false, colorAssist: false },
  reduced: { label: 'Movimento reduzido', contrast: false, largeText: false, reducedMotion: true, colorAssist: true }
});

export class AccessibilityManager {
  constructor({ root = document.documentElement, store = null, announcer = null } = {}) {
    this.root = root;
    this.store = store;
    this.announcer = announcer;
    const preferredReduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    this.state = {
      preset: store?.get?.('accessibilityPreset') || (preferredReduced ? 'reduced' : 'standard'),
      audioCues: store?.get?.('audioCues') !== false
    };
    this.apply(this.state.preset, false);
  }

  apply(presetId = 'standard', persist = true) {
    const preset = ACCESSIBILITY_PRESETS[presetId] || ACCESSIBILITY_PRESETS.standard;
    this.state.preset = ACCESSIBILITY_PRESETS[presetId] ? presetId : 'standard';
    this.root.dataset.accessibility = this.state.preset;
    this.root.classList.toggle('a11y-contrast', preset.contrast);
    this.root.classList.toggle('a11y-large', preset.largeText);
    this.root.classList.toggle('a11y-reduced-motion', preset.reducedMotion);
    this.root.classList.toggle('a11y-color-assist', preset.colorAssist);
    if (persist) this.store?.set?.('accessibilityPreset', this.state.preset);
    this.announce(`Acessibilidade: ${preset.label}`);
    return { id: this.state.preset, ...preset };
  }

  setAudioCues(enabled) {
    this.state.audioCues = Boolean(enabled);
    this.store?.set?.('audioCues', this.state.audioCues);
    this.announce(this.state.audioCues ? 'Sinais sonoros ativados' : 'Sinais sonoros desativados');
  }

  announce(message) {
    if (!message) return;
    if (this.announcer) {
      this.announcer.textContent = '';
      setTimeout(() => { this.announcer.textContent = message; }, 20);
    }
  }

  snapshot() { return { ...this.state, preset: { id: this.state.preset, ...(ACCESSIBILITY_PRESETS[this.state.preset] || ACCESSIBILITY_PRESETS.standard) } }; }
}
