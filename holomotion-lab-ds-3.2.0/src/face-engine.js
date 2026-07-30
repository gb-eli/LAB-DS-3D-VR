const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

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

export function analyzeFace(face = [], blendshapeCategories = []) {
  if (!face?.length) {
    return {
      detected: false,
      blinkLeft: 0,
      blinkRight: 0,
      jawOpen: 0,
      smile: 0,
      browUp: 0,
      headRoll: 0,
      headTilt: "centralizada",
      expression: "sem detecção"
    };
  }

  const map = scoreMap(blendshapeCategories);
  const blinkLeft = score(map, "eyeBlinkLeft");
  const blinkRight = score(map, "eyeBlinkRight");
  const jawOpen = score(map, "jawOpen");
  const smile = (score(map, "mouthSmileLeft") + score(map, "mouthSmileRight")) / 2;
  const browUp = score(map, "browInnerUp", "browOuterUpLeft", "browOuterUpRight");
  const leftEye = face[33] || face[133];
  const rightEye = face[263] || face[362];
  const headRoll = leftEye && rightEye ? Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) : 0;
  const degrees = headRoll * 180 / Math.PI;
  const headTilt = degrees > 7 ? "inclinada à direita" : degrees < -7 ? "inclinada à esquerda" : "centralizada";

  let expression = "neutra";
  if (jawOpen > 0.5) expression = "boca aberta";
  else if (smile > 0.42) expression = "sorrindo";
  else if (blinkLeft > 0.55 && blinkRight > 0.55) expression = "piscando";
  else if (blinkLeft > 0.58) expression = "olho esquerdo fechado";
  else if (blinkRight > 0.58) expression = "olho direito fechado";
  else if (browUp > 0.45) expression = "sobrancelhas levantadas";

  return {
    detected: true,
    blinkLeft: clamp(blinkLeft, 0, 1),
    blinkRight: clamp(blinkRight, 0, 1),
    jawOpen: clamp(jawOpen, 0, 1),
    smile: clamp(smile, 0, 1),
    browUp: clamp(browUp, 0, 1),
    headRoll,
    headTilt,
    expression
  };
}
