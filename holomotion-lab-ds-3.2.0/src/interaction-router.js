const CLICKABLE = "button:not([disabled]), [role='button'], .swatch, input[type='color'], select, input[type='range']";

export class GestureInteractionRouter {
  constructor(stage, {
    enabled = true,
    dwellEnabled = true,
    dwellMs = 900,
    onHover = () => {},
    onClick = () => {},
    onProgress = () => {}
  } = {}) {
    this.stage = stage;
    this.enabled = enabled;
    this.dwellEnabled = dwellEnabled;
    this.dwellMs = dwellMs;
    this.onHover = onHover;
    this.onClick = onClick;
    this.onProgress = onProgress;
    this.hovered = null;
    this.hoverStartedAt = 0;
    this.lastClickAt = 0;
    this.lastGesture = "unknown";
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) this.clearHover();
  }

  setDwellEnabled(enabled) {
    this.dwellEnabled = Boolean(enabled);
    this.hoverStartedAt = performance.now();
  }

  clearHover() {
    this.hovered?.classList.remove("gesture-hover");
    this.hovered = null;
    this.hoverStartedAt = 0;
    this.onProgress(0, null);
  }

  update(point, gesture, now = performance.now()) {
    if (!this.enabled || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      this.clearHover();
      this.lastGesture = gesture?.type || "unknown";
      return { consumed: false, target: null, progress: 0 };
    }

    const rect = this.stage.getBoundingClientRect();
    const clientX = rect.left + point.x * rect.width;
    const clientY = rect.top + point.y * rect.height;
    const element = document.elementFromPoint(clientX, clientY);
    const target = element?.closest?.(CLICKABLE) || null;

    if (target !== this.hovered) {
      this.hovered?.classList.remove("gesture-hover");
      this.hovered = target;
      this.hoverStartedAt = now;
      this.hovered?.classList.add("gesture-hover");
      if (target) this.onHover(target);
    }

    const current = gesture?.type || "unknown";
    const clickGesture = ["pinch", "fist", "ok"].includes(current);
    const rising = clickGesture && !["pinch", "fist", "ok"].includes(this.lastGesture);
    let progress = 0;
    if (target && this.dwellEnabled && current === "point") {
      progress = Math.min(1, (now - this.hoverStartedAt) / this.dwellMs);
      this.onProgress(progress, target);
    } else this.onProgress(0, target);

    let clicked = false;
    if (target && now - this.lastClickAt > 650 && (rising || progress >= 1)) {
      this.lastClickAt = now;
      this.hoverStartedAt = now;
      target.click();
      this.onClick(target);
      clicked = true;
      progress = 0;
    }
    this.lastGesture = current;
    return { consumed: Boolean(target), target, progress, clicked };
  }
}
