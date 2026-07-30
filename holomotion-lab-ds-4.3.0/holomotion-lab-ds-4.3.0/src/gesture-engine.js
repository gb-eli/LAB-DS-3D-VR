import { CURVATURE_LABELS, GESTURE_LABELS, ORIENTATION_LABELS } from "./config.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (a, b) => a && b ? Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)) : Infinity;
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function angleAt(a, b, c) {
  if (!a || !b || !c) return 0;
  const ab = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
  const cb = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const magnitude = Math.hypot(ab.x, ab.y, ab.z) * Math.hypot(cb.x, cb.y, cb.z);
  if (!magnitude) return 0;
  return Math.acos(clamp(dot / magnitude, -1, 1)) * 180 / Math.PI;
}

function fingerState(hand, mcp, pip, dip, tip, extensionThreshold = 146) {
  const pipAngle = angleAt(hand[mcp], hand[pip], hand[dip]);
  const dipAngle = angleAt(hand[pip], hand[dip], hand[tip]);
  const wrist = hand[0];
  const reachRatio = distance(hand[tip], wrist) / Math.max(0.0001, distance(hand[pip], wrist));
  return {
    extended: pipAngle >= extensionThreshold && dipAngle >= 130 && reachRatio > 1.07,
    pipAngle,
    dipAngle,
    reachRatio
  };
}

function handBounds(hand) {
  if (!hand?.length) return null;
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const point of hand) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
  };
}

function handOrientation(hand) {
  const wrist = hand?.[0];
  const middleMcp = hand?.[9];
  if (!wrist || !middleMcp) return { type: "diagonal", label: ORIENTATION_LABELS.diagonal, angle: 0, roll: 0 };
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  const angle = Math.atan2(-dy, dx);
  const degrees = angle * 180 / Math.PI;
  let type = "diagonal";
  if (Math.abs(dy) > Math.abs(dx) * 1.32) type = dy < 0 ? "vertical_up" : "vertical_down";
  else if (Math.abs(dx) > Math.abs(dy) * 1.32) type = dx < 0 ? "horizontal_left" : "horizontal_right";
  return { type, label: ORIENTATION_LABELS[type] || ORIENTATION_LABELS.diagonal, angle: degrees, roll: angle };
}

function palmNormal(worldHand) {
  if (!worldHand?.[17] || !worldHand?.[5] || !worldHand?.[0]) return null;
  const wrist = worldHand[0];
  const a = {
    x: worldHand[5].x - wrist.x,
    y: worldHand[5].y - wrist.y,
    z: worldHand[5].z - wrist.z
  };
  const b = {
    x: worldHand[17].x - wrist.x,
    y: worldHand[17].y - wrist.y,
    z: worldHand[17].z - wrist.z
  };
  const normal = {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
  const magnitude = Math.hypot(normal.x, normal.y, normal.z) || 1;
  return { x: normal.x / magnitude, y: normal.y / magnitude, z: normal.z / magnitude };
}

function classifyCurvature(states, extendedCount) {
  const bendAngles = states.flatMap((state) => [state.pipAngle, state.dipAngle]);
  const meanAngle = average(bendAngles);
  if (extendedCount >= 4 && meanAngle > 150) return { type: "flat", label: CURVATURE_LABELS.flat, score: clamp((meanAngle - 145) / 35, 0, 1) };
  if (extendedCount <= 1 && meanAngle < 116) return { type: "folded", label: CURVATURE_LABELS.folded, score: clamp((125 - meanAngle) / 45, 0, 1) };
  return { type: "curved", label: CURVATURE_LABELS.curved, score: clamp(1 - Math.abs(meanAngle - 132) / 50, 0, 1) };
}

function classifyPalmFacing(normal) {
  if (!normal) return { type: "unknown", label: "ORIENTAÇÃO 3D INDISPONÍVEL" };
  const absZ = Math.abs(normal.z);
  if (absZ < 0.34) return { type: "edge", label: "PALMA DE LADO" };
  return normal.z < 0
    ? { type: "front", label: "PALMA FRONTAL" }
    : { type: "back", label: "DORSO FRONTAL" };
}

export function analyzeHand(hand, {
  previousStable = "unknown",
  sensitivity = 1,
  worldHand = null
} = {}) {
  if (!hand?.[20]) {
    return {
      type: "unknown",
      label: GESTURE_LABELS.unknown,
      confidence: 0,
      extended: [],
      orientation: { type: "diagonal", label: ORIENTATION_LABELS.diagonal, angle: 0, roll: 0 },
      curvature: { type: "curved", label: CURVATURE_LABELS.curved, score: 0 },
      palmFacing: { type: "unknown", label: "ORIENTAÇÃO 3D INDISPONÍVEL" }
    };
  }

  const adjustedSensitivity = clamp(Number(sensitivity) || 1, 0.72, 1.4);
  const palmScale = Math.max(0.022, (distance(hand[0], hand[9]) + distance(hand[5], hand[17])) / 2);
  const palm = {
    x: average([hand[0].x, hand[5].x, hand[9].x, hand[13].x, hand[17].x]),
    y: average([hand[0].y, hand[5].y, hand[9].y, hand[13].y, hand[17].y]),
    z: average([hand[0].z || 0, hand[5].z || 0, hand[9].z || 0, hand[13].z || 0, hand[17].z || 0])
  };

  const index = fingerState(hand, 5, 6, 7, 8);
  const middle = fingerState(hand, 9, 10, 11, 12);
  const ring = fingerState(hand, 13, 14, 15, 16, 142);
  const pinky = fingerState(hand, 17, 18, 19, 20, 140);
  const thumbAngle = angleAt(hand[1], hand[2], hand[4]);
  const thumbReach = distance(hand[4], hand[5]) / palmScale;
  const thumbExtended = thumbAngle > 126 && thumbReach > 0.48;
  const states = [index, middle, ring, pinky];
  const extended = [thumbExtended, ...states.map((state) => state.extended)];
  const extendedCount = extended.filter(Boolean).length;

  const pinchRatio = distance(hand[4], hand[8]) / palmScale;
  const pinchClose = 0.39 * adjustedSensitivity;
  const pinchRelease = pinchClose + 0.13;
  const pinching = previousStable === "pinch" || previousStable === "ok"
    ? pinchRatio < pinchRelease
    : pinchRatio < pinchClose;

  const tipCompression = average([8, 12, 16, 20].map((id) => distance(hand[id], palm) / palmScale));
  const fistScore = clamp((1.55 - tipCompression) / 0.6, 0, 1) * 0.62
    + clamp((2 - states.filter((state) => state.extended).length) / 2, 0, 1) * 0.38;
  const openScore = clamp((extendedCount - 2.5) / 2, 0, 1);

  const orientation = handOrientation(hand);
  const curvature = classifyCurvature(states, extendedCount);
  const normal = palmNormal(worldHand);
  const palmFacing = classifyPalmFacing(normal);
  const thumbDirection = hand[4].y < hand[2].y - palmScale * 0.25 ? "up"
    : hand[4].y > hand[2].y + palmScale * 0.25 ? "down"
      : "side";
  const touchRatios = {
    index: distance(hand[4], hand[8]) / palmScale,
    middle: distance(hand[4], hand[12]) / palmScale,
    ring: distance(hand[4], hand[16]) / palmScale,
    pinky: distance(hand[4], hand[20]) / palmScale
  };
  const touchThreshold = 0.5 * adjustedSensitivity;
  const touches = Object.fromEntries(Object.entries(touchRatios).map(([finger, ratio]) => [finger, ratio < touchThreshold]));
  const thumbClosest = Object.entries(touchRatios).sort((a, b) => a[1] - b[1])[0]?.[0] || "index";
  const crossedIndexMiddle = ((hand[8].x - hand[12].x) * (hand[5].x - hand[9].x)) < -0.00018;
  const indexBent = !index.extended && index.pipAngle > 68 && index.pipAngle < 138 && index.dipAngle > 70;

  let type = "unknown";
  let confidence = 0.48;
  if (fistScore > 0.68 && states.every((state) => !state.extended)) {
    type = "fist";
    confidence = clamp(fistScore, 0.68, 0.99);
  } else if (pinching && middle.extended && ring.extended && pinky.extended) {
    type = "ok";
    confidence = clamp(1 - pinchRatio / Math.max(0.001, pinchRelease), 0.62, 0.98);
  } else if (pinching) {
    type = "pinch";
    confidence = clamp(1 - pinchRatio / Math.max(0.001, pinchRelease), 0.54, 0.99);
  } else if (thumbExtended && !index.extended && !middle.extended && !ring.extended && !pinky.extended && thumbDirection === "up") {
    type = "thumbs_up";
    confidence = 0.88;
  } else if (thumbExtended && !index.extended && !middle.extended && !ring.extended && !pinky.extended && thumbDirection === "down") {
    type = "thumbs_down";
    confidence = 0.84;
  } else if (index.extended && middle.extended && !ring.extended && !pinky.extended) {
    type = "peace";
    confidence = 0.88;
  } else if (index.extended && !middle.extended && !ring.extended && !pinky.extended) {
    type = "point";
    confidence = 0.91;
  } else if (openScore > 0.5) {
    type = "open";
    confidence = clamp(openScore, 0.58, 0.98);
  }

  return {
    type,
    label: GESTURE_LABELS[type] || GESTURE_LABELS.unknown,
    confidence,
    pinchRatio,
    palmScale,
    palm,
    bounds: handBounds(hand),
    extended,
    extendedCount,
    fistScore,
    openScore,
    orientation,
    curvature,
    palmFacing,
    normal,
    touches,
    touchRatios,
    thumbClosest,
    crossedIndexMiddle,
    indexBent,
    fingerStates: { index, middle, ring, pinky }
  };
}

function directionChanges(points = [], axis = "x", minimumStep = 0.012) {
  let previousSign = 0;
  let changes = 0;
  for (let index = 1; index < points.length; index += 1) {
    const delta = points[index][axis] - points[index - 1][axis];
    if (Math.abs(delta) < minimumStep) continue;
    const sign = Math.sign(delta);
    if (previousSign && sign !== previousSign) changes += 1;
    previousSign = sign;
  }
  return changes;
}

function detectAlphabetMotion(history = [], extended = [], now = performance.now()) {
  const recent = history.filter((entry) => now - entry.time <= 1100);
  if (recent.length < 6) return null;
  const first = recent[0];
  const last = recent[recent.length - 1];

  if (extended[4] && !extended[1] && !extended[2] && !extended[3]) {
    const points = recent.map((entry) => ({ x: entry.pinkyX, y: entry.pinkyY }));
    const vertical = last.pinkyY - first.pinkyY;
    const tail = points.slice(Math.floor(points.length * 0.58));
    const tailHorizontal = Math.abs(tail.at(-1).x - tail[0].x);
    if (vertical > 0.09 && tailHorizontal > 0.045) return "J";
  }

  if (extended[1] && !extended[2] && !extended[3] && !extended[4]) {
    const points = recent.map((entry) => ({ x: entry.indexX, y: entry.indexY }));
    const spanX = Math.max(...points.map((point) => point.x)) - Math.min(...points.map((point) => point.x));
    const vertical = last.indexY - first.indexY;
    const third = Math.max(2, Math.floor(points.length / 3));
    const a0 = points[0];
    const a1 = points[Math.min(points.length - 1, third)];
    const a2 = points[Math.min(points.length - 1, third * 2)];
    const a3 = points.at(-1);
    const dx1 = a1.x - a0.x;
    const dx2 = a2.x - a1.x;
    const dx3 = a3.x - a2.x;
    const zigzag = Math.abs(dx1) > 0.035 && Math.abs(dx2) > 0.035 && Math.abs(dx3) > 0.035
      && Math.sign(dx1) === Math.sign(dx3) && Math.sign(dx1) !== Math.sign(dx2);
    const changes = directionChanges(points, "x", 0.014);
    if (spanX > 0.13 && vertical > 0.055 && zigzag && changes >= 2) return "Z";
  }
  return null;
}

function detectMotion(history, currentGesture, now, cooldownUntil) {
  if (history.length < 4 || now < cooldownUntil) return null;
  const recent = history.filter((entry) => now - entry.time <= 520);
  if (recent.length < 4) return null;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const elapsed = Math.max(1, last.time - first.time) / 1000;
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const speed = Math.hypot(dx, dy) / elapsed;
  const scaleDelta = (last.scale - first.scale) / Math.max(0.001, first.scale);
  let rollDelta = last.roll - first.roll;
  while (rollDelta > Math.PI) rollDelta -= Math.PI * 2;
  while (rollDelta < -Math.PI) rollDelta += Math.PI * 2;

  if (["open", "point", "peace"].includes(currentGesture) && speed > 0.62 && Math.abs(dx) > 0.14 && Math.abs(dx) > Math.abs(dy) * 1.35) {
    return { type: dx < 0 ? "swipe_left" : "swipe_right", speed, dx, dy };
  }
  if (["open", "point"].includes(currentGesture) && speed > 0.58 && Math.abs(dy) > 0.14 && Math.abs(dy) > Math.abs(dx) * 1.35) {
    return { type: dy < 0 ? "swipe_up" : "swipe_down", speed, dx, dy };
  }
  if (Math.abs(scaleDelta) > 0.24 && currentGesture === "open") {
    return { type: scaleDelta > 0 ? "push" : "pull", speed: Math.abs(scaleDelta) / elapsed, scaleDelta };
  }
  if (Math.abs(rollDelta) > 0.72 && ["open", "point"].includes(currentGesture)) {
    return { type: rollDelta > 0 ? "rotate_ccw" : "rotate_cw", speed: Math.abs(rollDelta) / elapsed, rollDelta };
  }
  return null;
}

export class GestureEngine {
  constructor({ sensitivity = 1 } = {}) {
    this.sensitivity = sensitivity;
    this.trackers = new Map();
  }

  setSensitivity(value) {
    this.sensitivity = clamp(Number(value) || 1, 0.72, 1.4);
  }

  reset() {
    this.trackers.clear();
  }

  update(hands = [], handedness = [], timestamp = performance.now(), worldHands = []) {
    const seen = new Set();
    const results = hands.map((hand, index) => {
      const handed = handedness[index]?.categoryName || handedness[index]?.displayName || `Hand${index + 1}`;
      const key = handed;
      seen.add(key);
      const tracker = this.trackers.get(key) || {
        stable: "unknown",
        candidate: "unknown",
        candidateFrames: 0,
        changedAt: timestamp,
        lastSeen: timestamp,
        motionCooldownUntil: 0,
        history: []
      };
      const analysis = analyzeHand(hand, {
        previousStable: tracker.stable,
        sensitivity: this.sensitivity,
        worldHand: worldHands[index]
      });

      if (analysis.type === tracker.candidate) tracker.candidateFrames += 1;
      else {
        tracker.candidate = analysis.type;
        tracker.candidateFrames = 1;
      }

      const previous = tracker.stable;
      const framesNeeded = ["pinch", "fist", "ok"].includes(analysis.type) ? 2 : 3;
      if (tracker.candidateFrames >= framesNeeded && analysis.type !== tracker.stable) {
        tracker.stable = analysis.type;
        tracker.changedAt = timestamp;
      }

      tracker.history.push({
        x: analysis.palm?.x || 0,
        y: analysis.palm?.y || 0,
        indexX: hand?.[8]?.x || 0,
        indexY: hand?.[8]?.y || 0,
        pinkyX: hand?.[20]?.x || 0,
        pinkyY: hand?.[20]?.y || 0,
        scale: analysis.palmScale || 0,
        roll: analysis.orientation?.roll || 0,
        time: timestamp
      });
      tracker.history = tracker.history.filter((entry) => timestamp - entry.time <= 1200).slice(-26);
      const motion = detectMotion(tracker.history, tracker.stable, timestamp, tracker.motionCooldownUntil);
      const dynamicLetter = detectAlphabetMotion(tracker.history, analysis.extended, timestamp);
      if (motion) {
        tracker.motionCooldownUntil = timestamp + 650;
        tracker.history = tracker.history.slice(-2);
      }
      tracker.lastSeen = timestamp;
      this.trackers.set(key, tracker);

      return {
        ...analysis,
        rawType: analysis.type,
        type: tracker.stable,
        label: GESTURE_LABELS[tracker.stable] || GESTURE_LABELS.unknown,
        handedness: handed,
        justStarted: tracker.stable !== previous,
        previousType: previous,
        heldFor: timestamp - tracker.changedAt,
        motion,
        dynamicLetter,
        motionPath: tracker.history.map((entry) => ({ x: entry.indexX, y: entry.indexY, time: entry.time }))
      };
    });

    for (const [key, tracker] of this.trackers) {
      if (!seen.has(key) && timestamp - tracker.lastSeen > 750) this.trackers.delete(key);
    }
    return results;
  }
}

export function mirrorLandmarks(points = [], mirror = false) {
  if (!mirror) return points.map((point) => ({ ...point }));
  return points.map((point) => ({ ...point, x: 1 - point.x }));
}

export function mirrorWorldLandmarks(points = [], mirror = false) {
  if (!mirror) return points.map((point) => ({ ...point }));
  return points.map((point) => ({ ...point, x: -point.x }));
}
