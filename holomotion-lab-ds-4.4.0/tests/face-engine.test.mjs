import test from "node:test";
import assert from "node:assert/strict";
import { analyzeFace } from "../src/face-engine.js";

function fakeFace() {
  const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  points[33] = { x: 0.4, y: 0.45, z: 0 };
  points[263] = { x: 0.6, y: 0.49, z: 0 };
  return points;
}

test("interpreta sorriso, boca e inclinação do rosto", () => {
  const categories = [
    { categoryName: "mouthSmileLeft", score: 0.8 },
    { categoryName: "mouthSmileRight", score: 0.7 },
    { categoryName: "jawOpen", score: 0.2 },
    { categoryName: "eyeBlinkLeft", score: 0.1 },
    { categoryName: "eyeBlinkRight", score: 0.1 }
  ];
  const result = analyzeFace(fakeFace(), categories);
  assert.equal(result.detected, true);
  assert.equal(result.expression, "sorrindo");
  assert.ok(result.smile > 0.7);
  assert.notEqual(result.headTilt, "centralizada");
});

test("usa a matriz facial para estimar orientação da cabeça", () => {
  const matrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0.5, 0, 0.866, 0,
    0, 0, 0, 1
  ];
  const result = analyzeFace(fakeFace(), [], matrix);
  assert.ok(result.yawDegrees > 20);
  assert.match(result.headDirection, /direita/);
});
