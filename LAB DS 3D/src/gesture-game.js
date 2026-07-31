import { assessGestureChallenge, gesturePresentation } from "./gesture-catalog.js";

function challenge(id, options = {}) {
  const visual = gesturePresentation(id);
  return Object.freeze({
    id,
    title: visual.title,
    icon: visual.icon,
    hint: visual.hint,
    hold: 720,
    minimumConfidence: 0.6,
    ...options
  });
}

const CHALLENGES = Object.freeze([
  challenge("open", { matches: (gesture) => gesture?.type === "open" }),
  challenge("fist", { matches: (gesture) => gesture?.type === "fist" }),
  challenge("pinch", { matches: (gesture) => gesture?.type === "pinch" }),
  challenge("point", { matches: (gesture) => gesture?.type === "point" }),
  challenge("peace", { matches: (gesture) => gesture?.type === "peace" }),
  challenge("thumbs_up", { minimumConfidence: 0.68, matches: (gesture) => gesture?.type === "thumbs_up" }),
  challenge("thumbs_down", { minimumConfidence: 0.65, matches: (gesture) => gesture?.type === "thumbs_down" }),
  challenge("ok", { minimumConfidence: 0.64, matches: (gesture) => gesture?.type === "ok" }),
  challenge("palm_front", { matches: (gesture) => gesture?.type === "open" && gesture?.palmFacing?.type === "front" }),
  challenge("vertical", { matches: (gesture) => gesture?.type === "open" && gesture?.orientation?.type === "vertical_up" }),
  challenge("horizontal", { matches: (gesture) => gesture?.type === "open" && gesture?.orientation?.type?.startsWith("horizontal") }),
  challenge("swipe", { instant: true, minimumConfidence: 0.55, matches: (gesture) => ["swipe_left", "swipe_right"].includes(gesture?.motion?.type) }),
  challenge("swipe_vertical", { instant: true, minimumConfidence: 0.55, matches: (gesture) => ["swipe_up", "swipe_down"].includes(gesture?.motion?.type) }),
  challenge("rotate", { instant: true, minimumConfidence: 0.55, matches: (gesture) => ["rotate_cw", "rotate_ccw"].includes(gesture?.motion?.type) }),
  challenge("push", { instant: true, minimumConfidence: 0.55, matches: (gesture) => gesture?.motion?.type === "push" }),
  challenge("pull", { instant: true, minimumConfidence: 0.55, matches: (gesture) => gesture?.motion?.type === "pull" })
]);

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

  get challenge() { return CHALLENGES[this.index % CHALLENGES.length]; }

  start() {
    this.active = true;
    this.index = 0;
    this.score = 0;
    this.holdStartedAt = 0;
    this.onChallenge(this.challenge);
  }

  stop() { this.active = false; this.holdStartedAt = 0; }

  next() {
    this.index = (this.index + 1) % CHALLENGES.length;
    this.holdStartedAt = 0;
    this.onChallenge(this.challenge);
  }

  update(gestures = [], now = performance.now()) {
    if (!this.active) return;
    const candidates = gestures.map((gesture) => ({ gesture, assessment: assessGestureChallenge(this.challenge, gesture) }));
    candidates.sort((a, b) => b.assessment.precision - a.assessment.precision);
    const best = candidates[0] || { gesture: null, assessment: assessGestureChallenge(this.challenge, null) };
    const matched = best.assessment.directMatch && (best.gesture?.confidence || 0) >= (this.challenge.minimumConfidence || 0.6);

    if (!matched) {
      this.holdStartedAt = 0;
      this.onProgress({ progress: 0, score: this.score, challenge: this.challenge, gesture: best.gesture, assessment: best.assessment });
      return;
    }

    if (this.challenge.instant) {
      if (now - this.lastSuccessAt < 760) return;
      this.complete(best.gesture, now, best.assessment);
      return;
    }

    if (!this.holdStartedAt) this.holdStartedAt = now;
    const duration = now - this.holdStartedAt;
    const progress = Math.min(1, duration / (this.challenge.hold || 720));
    const assessment = assessGestureChallenge(this.challenge, best.gesture, { holdProgress: progress });
    this.onProgress({ progress, score: this.score, challenge: this.challenge, gesture: best.gesture, assessment });
    if (progress >= 1 && now - this.lastSuccessAt > 720) this.complete(best.gesture, now, assessment);
  }

  complete(gesture, now, assessment = null) {
    this.lastSuccessAt = now;
    const precision = assessment?.precision || Math.round((gesture?.confidence || 0.7) * 100);
    const precisionBonus = Math.max(0, precision - 60);
    this.score += 100 + precisionBonus;
    const completed = this.challenge;
    this.onSuccess({ challenge: completed, score: this.score, gesture, assessment, precision });
    this.index = (this.index + 1) % CHALLENGES.length;
    this.holdStartedAt = 0;
    this.onChallenge(this.challenge);
  }
}

export { CHALLENGES };
