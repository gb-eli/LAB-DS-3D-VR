import test from "node:test";
import assert from "node:assert/strict";
import { evaluateBodyActions } from "../src/body-actions.js";

function point(x, y) { return { x, y, visibility: 1 }; }
function poseBase() {
  const pose = Array.from({ length: 33 }, () => point(.5, .5));
  pose[0] = point(.5, .2);
  pose[11] = point(.4, .38); pose[12] = point(.6, .38);
  pose[13] = point(.3, .38); pose[14] = point(.7, .38);
  pose[15] = point(.18, .38); pose[16] = point(.82, .38);
  pose[23] = point(.44, .62); pose[24] = point(.56, .62);
  pose[25] = point(.44, .78); pose[26] = point(.56, .78);
  pose[27] = point(.44, .95); pose[28] = point(.56, .95);
  return pose;
}

test("reconhece braços abertos", () => {
  const result = evaluateBodyActions(poseBase());
  assert.equal(result.detected, true);
  assert.equal(result.actions.has("arms_open"), true);
});

test("reconhece mãos ao alto", () => {
  const pose = poseBase();
  pose[15] = point(.42, .05); pose[16] = point(.58, .05);
  const result = evaluateBodyActions(pose);
  assert.equal(result.actions.has("hands_up"), true);
});

import { BodyMotionAnalyzer } from "../src/body-actions.js";

test("detecta pulo e palmas como eventos temporais", () => {
  const analyzer = new BodyMotionAnalyzer();
  const before = poseBase();
  before[15] = point(.2, .4); before[16] = point(.8, .4);
  analyzer.update(before, 1000);

  const after = poseBase();
  [23, 24, 25, 26, 27, 28, 11, 12, 13, 14].forEach((id) => { after[id] = point(after[id].x, after[id].y - .1); });
  after[15] = point(.49, .3); after[16] = point(.51, .3);
  const result = analyzer.update(after, 1100);
  assert.equal(result.events.has("jump"), true);
  assert.equal(result.events.has("clap"), true);
});
