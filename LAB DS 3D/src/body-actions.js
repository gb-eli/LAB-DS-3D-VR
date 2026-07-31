const clamp01 = (value) => Math.max(0, Math.min(1, value));
const visible = (point, threshold = 0.42) => Boolean(point) && (point.visibility ?? 1) >= threshold;
const dist = (a, b) => a && b ? Math.hypot(a.x - b.x, a.y - b.y) : Infinity;
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function bodyScale(pose = []) {
  const ls = pose[11], rs = pose[12], lh = pose[23], rh = pose[24];
  if (![ls, rs, lh, rh].every((point) => visible(point))) return 0.35;
  return Math.max(0.18, (dist(ls, rs) + dist(lh, rh)) / 2);
}

export function evaluateBodyActions(pose = []) {
  const actions = new Set();
  if (!pose?.length) return { detected: false, actions, metrics: {} };

  const nose = pose[0];
  const ls = pose[11], rs = pose[12], le = pose[13], re = pose[14], lw = pose[15], rw = pose[16];
  const lh = pose[23], rh = pose[24], lk = pose[25], rk = pose[26], la = pose[27], ra = pose[28];
  const scale = bodyScale(pose);
  const shoulderMid = [ls, rs].every((point) => visible(point)) ? midpoint(ls, rs) : null;
  const hipMid = [lh, rh].every((point) => visible(point)) ? midpoint(lh, rh) : null;

  if ([nose, lw].every((point) => visible(point)) && lw.y < nose.y - scale * 0.34) actions.add("left_hand_up");
  if ([nose, rw].every((point) => visible(point)) && rw.y < nose.y - scale * 0.34) actions.add("right_hand_up");
  if (actions.has("left_hand_up") && actions.has("right_hand_up")) actions.add("hands_up");

  if ([ls, rs, lw, rw].every((point) => visible(point))) {
    const wristsLevel = Math.abs(lw.y - ls.y) < scale * 0.42 && Math.abs(rw.y - rs.y) < scale * 0.42;
    const spread = Math.abs(lw.x - rw.x) > scale * 2.35;
    if (wristsLevel && spread) actions.add("arms_open");
  }

  if ([lw, rw].every((point) => visible(point)) && dist(lw, rw) < scale * 0.55) actions.add("hands_together");

  if ([lw, rs, rw, ls].every((point) => visible(point))) {
    const crossed = dist(lw, rs) < scale * 0.72 && dist(rw, ls) < scale * 0.72;
    if (crossed) actions.add("arms_crossed");
  }

  if ([ls, rs, le, re, lw, rw].every((point) => visible(point))) {
    const guard = dist(lw, nose) < scale * 1.15 && dist(rw, nose) < scale * 1.15 && Math.abs(le.x - re.x) > scale * 0.75;
    if (guard) actions.add("guard");
  }

  let squatScore = 0;
  if ([lh, rh, lk, rk, la, ra, ls, rs].every((point) => visible(point))) {
    const hipY = (lh.y + rh.y) / 2;
    const kneeY = (lk.y + rk.y) / 2;
    const ankleY = (la.y + ra.y) / 2;
    const shoulderY = (ls.y + rs.y) / 2;
    const torso = Math.max(0.08, hipY - shoulderY);
    const thigh = Math.max(0.05, kneeY - hipY);
    const compact = clamp01((torso / Math.max(thigh, 0.02) - 0.85) / 1.45);
    const kneesBent = clamp01((ankleY - kneeY < thigh * 1.5 ? 1 : 0.65));
    squatScore = clamp01(compact * 0.76 + kneesBent * 0.24);
    if (squatScore > 0.6) actions.add("squat");
  }

  let lean = 0;
  if (shoulderMid && hipMid) {
    lean = (shoulderMid.x - hipMid.x) / scale;
    if (lean < -0.22) actions.add("lean_left");
    if (lean > 0.22) actions.add("lean_right");
  }

  let balance = 0;
  if ([lk, rk, la, ra].every((point) => visible(point))) {
    const leftLift = Math.abs(la.y - rk.y) > scale * 0.55 && la.y < ra.y - scale * 0.25;
    const rightLift = Math.abs(ra.y - lk.y) > scale * 0.55 && ra.y < la.y - scale * 0.25;
    if (leftLift) actions.add("left_leg_up");
    if (rightLift) actions.add("right_leg_up");
    balance = leftLift || rightLift ? 1 : 0;
  }

  return {
    detected: true,
    actions,
    metrics: {
      visible: pose.filter((point) => visible(point)).length,
      scale,
      lean,
      squat: squatScore,
      balance,
      hipY: hipMid?.y ?? null,
      shoulderY: shoulderMid?.y ?? null
    }
  };
}

export class BodyMotionAnalyzer {
  constructor() {
    this.previous = null;
    this.lastJumpAt = 0;
    this.lastClapAt = 0;
  }

  reset() {
    this.previous = null;
    this.lastJumpAt = 0;
    this.lastClapAt = 0;
  }

  update(pose = [], now = performance.now()) {
    const analysis = evaluateBodyActions(pose);
    const events = new Set();
    let movement = 0;
    if (!analysis.detected) {
      this.previous = null;
      return { ...analysis, events, movement: 0 };
    }

    const trackedIds = [0, 11, 12, 15, 16, 23, 24, 25, 26, 27, 28];
    const currentPoints = trackedIds.map((id) => pose[id]).filter((point) => visible(point));
    if (this.previous?.pose?.length && currentPoints.length) {
      const dt = Math.max(16, now - this.previous.now);
      let total = 0;
      let count = 0;
      for (const id of trackedIds) {
        const point = pose[id];
        const before = this.previous.pose[id];
        if (!visible(point) || !visible(before)) continue;
        total += Math.hypot(point.x - before.x, point.y - before.y) * (1000 / dt);
        count += 1;
      }
      movement = count ? total / count : 0;

      const hipY = analysis.metrics.hipY;
      const previousHipY = this.previous.hipY;
      if (hipY != null && previousHipY != null) {
        const verticalSpeed = (previousHipY - hipY) * (1000 / dt);
        if (verticalSpeed > 0.42 && now - this.lastJumpAt > 900) {
          events.add("jump");
          this.lastJumpAt = now;
        }
      }

      const lw = pose[15], rw = pose[16];
      const plw = this.previous.pose[15], prw = this.previous.pose[16];
      if ([lw, rw, plw, prw].every((point) => visible(point))) {
        const beforeDistance = dist(plw, prw);
        const currentDistance = dist(lw, rw);
        const closingSpeed = (beforeDistance - currentDistance) * (1000 / dt);
        if (currentDistance < analysis.metrics.scale * 0.5 && closingSpeed > 0.2 && now - this.lastClapAt > 750) {
          events.add("clap");
          this.lastClapAt = now;
        }
      }
    }

    this.previous = { pose: pose.map((point) => point ? { ...point } : point), now, hipY: analysis.metrics.hipY };
    return { ...analysis, events, movement };
  }
}

export const BODY_ACTION_LABELS = Object.freeze({
  arms_open: "Braços abertos",
  hands_up: "Mãos ao alto",
  left_hand_up: "Mão esquerda ao alto",
  right_hand_up: "Mão direita ao alto",
  hands_together: "Mãos juntas",
  arms_crossed: "Braços cruzados",
  guard: "Posição de defesa",
  squat: "Agachamento",
  lean_left: "Inclinação à esquerda",
  lean_right: "Inclinação à direita",
  left_leg_up: "Perna esquerda elevada",
  right_leg_up: "Perna direita elevada",
  jump: "Pulo",
  clap: "Palmas"
});
