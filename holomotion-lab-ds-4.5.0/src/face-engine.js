const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const clamp01 = (value) => clamp(value, 0, 1);

function scoreMap(categories = []) {
  const map = new Map();
  for (const category of categories) {
    const key = category?.categoryName || category?.displayName;
    if (key) map.set(key, Number(category.score) || 0);
  }
  return map;
}

function score(map, ...names) {
  return Math.max(0, ...names.map((name) => map.get(name) || 0));
}

function normalizeAngle(value) {
  let angle = value;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function orientationFromMatrix(matrix = []) {
  if (!Array.isArray(matrix) || matrix.length < 16) return null;
  const m = matrix.map(Number);
  if (m.some((value) => !Number.isFinite(value))) return null;
  const pitch = Math.atan2(-m[9], Math.hypot(m[8], m[10]));
  const yaw = Math.atan2(m[8], m[10]);
  const roll = Math.atan2(m[1], m[5]);
  return { pitch: normalizeAngle(pitch), yaw: normalizeAngle(yaw), roll: normalizeAngle(roll) };
}

function orientationFromLandmarks(face = []) {
  const leftEye = face[33] || face[133];
  const rightEye = face[263] || face[362];
  const leftSide = face[234];
  const rightSide = face[454];
  const nose = face[1] || face[4];
  const forehead = face[10];
  const chin = face[152];
  if (!leftEye || !rightEye || !nose) return { roll: 0, yaw: 0, pitch: 0 };
  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
  let yaw = 0;
  if (leftSide && rightSide) {
    const centerX = (leftSide.x + rightSide.x) / 2;
    const halfWidth = Math.max(0.001, Math.abs(rightSide.x - leftSide.x) / 2);
    yaw = clamp((nose.x - centerX) / halfWidth, -1, 1) * 0.72;
  }
  let pitch = 0;
  if (forehead && chin) {
    const centerY = (forehead.y + chin.y) / 2;
    const halfHeight = Math.max(0.001, Math.abs(chin.y - forehead.y) / 2);
    pitch = clamp((nose.y - centerY) / halfHeight, -1, 1) * 0.62;
  }
  return { roll, yaw, pitch };
}

function gazeFromBlendshapes(map) {
  const left = score(map, "eyeLookOutLeft", "eyeLookInRight");
  const right = score(map, "eyeLookInLeft", "eyeLookOutRight");
  const up = score(map, "eyeLookUpLeft", "eyeLookUpRight");
  const down = score(map, "eyeLookDownLeft", "eyeLookDownRight");
  return { x: clamp(right - left, -1, 1), y: clamp(down - up, -1, 1) };
}

function directionLabel(yaw, pitch, roll) {
  const yawDeg = yaw * 180 / Math.PI;
  const pitchDeg = pitch * 180 / Math.PI;
  const rollDeg = roll * 180 / Math.PI;
  const horizontal = yawDeg > 9 ? "direita" : yawDeg < -9 ? "esquerda" : "centro";
  const vertical = pitchDeg > 8 ? "baixo" : pitchDeg < -8 ? "cima" : "nível";
  const tilt = rollDeg > 7 ? "inclinada à direita" : rollDeg < -7 ? "inclinada à esquerda" : "sem inclinação";
  return { horizontal, vertical, tilt, yawDeg, pitchDeg, rollDeg };
}

export function analyzeFace(face = [], blendshapeCategories = [], transformationMatrix = null) {
  if (!face?.length) {
    return {
      detected: false,
      blinkLeft: 0,
      blinkRight: 0,
      jawOpen: 0,
      smile: 0,
      browUp: 0,
      headRoll: 0,
      headYaw: 0,
      headPitch: 0,
      headTilt: "centralizada",
      headDirection: "centralizada",
      gazeX: 0,
      gazeY: 0,
      expression: "sem detecção",
      landmarkCount: 0
    };
  }

  const map = scoreMap(blendshapeCategories);
  const blinkLeft = score(map, "eyeBlinkLeft");
  const blinkRight = score(map, "eyeBlinkRight");
  const jawOpen = score(map, "jawOpen");
  const smile = (score(map, "mouthSmileLeft") + score(map, "mouthSmileRight")) / 2;
  const browUp = score(map, "browInnerUp", "browOuterUpLeft", "browOuterUpRight");
  const cheekPuff = score(map, "cheekPuff");
  const mouthPucker = score(map, "mouthPucker");
  const matrixOrientation = orientationFromMatrix(transformationMatrix);
  const orientation = matrixOrientation || orientationFromLandmarks(face);
  const direction = directionLabel(orientation.yaw, orientation.pitch, orientation.roll);
  const gaze = gazeFromBlendshapes(map);

  let expression = "neutra";
  if (jawOpen > 0.46) expression = "boca aberta";
  else if (smile > 0.38) expression = "sorrindo";
  else if (blinkLeft > 0.52 && blinkRight > 0.52) expression = "piscando";
  else if (blinkLeft > 0.56) expression = "olho esquerdo fechado";
  else if (blinkRight > 0.56) expression = "olho direito fechado";
  else if (browUp > 0.4) expression = "sobrancelhas levantadas";
  else if (cheekPuff > 0.45) expression = "bochechas infladas";
  else if (mouthPucker > 0.45) expression = "lábios projetados";

  return {
    detected: true,
    blinkLeft: clamp01(blinkLeft),
    blinkRight: clamp01(blinkRight),
    jawOpen: clamp01(jawOpen),
    smile: clamp01(smile),
    browUp: clamp01(browUp),
    cheekPuff: clamp01(cheekPuff),
    mouthPucker: clamp01(mouthPucker),
    headRoll: orientation.roll,
    headYaw: orientation.yaw,
    headPitch: orientation.pitch,
    headTilt: direction.tilt,
    headDirection: `${direction.horizontal} · ${direction.vertical}`,
    yawDegrees: direction.yawDeg,
    pitchDegrees: direction.pitchDeg,
    rollDegrees: direction.rollDeg,
    gazeX: gaze.x,
    gazeY: gaze.y,
    expression,
    landmarkCount: face.length
  };
}
