import test from "node:test";
import assert from "node:assert/strict";
import { analyzeHand, mirrorLandmarks, GestureEngine } from "../src/gesture-engine.js";

function hand(closed = false) {
  const x = 0.5, y = 0.5, spread = closed ? 0.018 : 0.05;
  const points = Array.from({ length: 21 }, () => ({ x, y, z: 0 }));
  points[0] = { x, y: y + 0.08, z: 0 };
  const fingers = [[5,6,7,8,-.045],[9,10,11,12,-.015],[13,14,15,16,.02],[17,18,19,20,.055]];
  fingers.forEach(([mcp,pip,dip,tip,dx]) => {
    points[mcp] = { x: x + dx, y, z: 0 };
    points[pip] = { x: x + dx, y: y - spread, z: 0 };
    points[dip] = { x: x + dx, y: y - spread * 1.7, z: 0 };
    points[tip] = { x: x + dx, y: y - spread * 2.5, z: 0 };
  });
  points[1] = { x: x - .05, y: y + .025, z: 0 };
  points[2] = { x: x - .07, y: y + .005, z: 0 };
  points[3] = { x: x - .085, y: y - spread * .3, z: 0 };
  points[4] = { x: x - (closed ? .025 : .105), y: y - spread * .6, z: 0 };
  if (closed) [8,12,16,20].forEach((id, index) => { points[id] = { x: x + (index - 1.5) * .018, y: y + .015, z: 0 }; });
  return points;
}

test("classifica mão aberta e mão fechada", () => {
  assert.equal(analyzeHand(hand(false)).type, "open");
  assert.equal(analyzeHand(hand(true)).type, "fist");
});

test("espelha coordenadas sem alterar o original", () => {
  const original = [{ x: 0.2, y: 0.4, z: 0 }];
  const mirrored = mirrorLandmarks(original, true);
  assert.equal(mirrored[0].x, 0.8);
  assert.equal(original[0].x, 0.2);
});

test("estabiliza o gesto após quadros consecutivos", () => {
  const engine = new GestureEngine();
  const first = engine.update([hand(true)], [{ categoryName: "Left" }], 10)[0];
  const second = engine.update([hand(true)], [{ categoryName: "Left" }], 30)[0];
  assert.equal(first.type, "unknown");
  assert.equal(second.type, "fist");
  assert.equal(second.justStarted, true);
});

test("reconhece orientação vertical e horizontal da mão", () => {
  const vertical = hand(false);
  assert.equal(analyzeHand(vertical).orientation.type, "vertical_up");
  const center = { x: 0.5, y: 0.5 };
  const horizontal = vertical.map((point) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return { ...point, x: center.x - dy, y: center.y + dx };
  });
  assert.ok(analyzeHand(horizontal).orientation.type.startsWith("horizontal"));
});

test("detecta movimento lateral rápido com a mão aberta", () => {
  const engine = new GestureEngine();
  const moved = (offset) => hand(false).map((point) => ({ ...point, x: point.x + offset }));
  const frames = [
    [0, 0], [0.005, 60], [0.01, 120], [0.02, 180], [0.18, 260], [0.38, 340]
  ];
  let motion = null;
  for (const [offset, time] of frames) {
    const result = engine.update([moved(offset)], [{ categoryName: "Left" }], time)[0];
    motion ||= result.motion;
  }
  assert.equal(motion?.type, "swipe_right");
});
