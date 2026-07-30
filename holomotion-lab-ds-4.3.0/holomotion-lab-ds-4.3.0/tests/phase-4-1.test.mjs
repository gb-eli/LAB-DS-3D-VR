import test from "node:test";
import assert from "node:assert/strict";
import { BodyChallengeGame } from "../src/body-challenge-game.js";
import { DanceGame } from "../src/dance-game.js";
import { StretchGame } from "../src/stretch-game.js";
import { LibrasGame, LIBRAS_LETTERS } from "../src/libras-game.js";

const body = (...actions) => ({ actions: new Set(actions), events: new Set() });

test("Body Challenge confirma comando sustentado", () => {
  let hits = 0;
  const game = new BodyChallengeGame({ onHit: () => { hits += 1; } });
  game.active = true;
  game.command = { id: "arms_open", title: "Abra", hold: 400, match: ({ body }) => body.actions.has("arms_open") };
  game.commandDeadline = 5000;
  game.lastTickAt = 100;
  game.timeLeft = 45;
  game.update({ body: body("arms_open") }, 100);
  game.update({ body: body("arms_open") }, 600);
  assert.equal(hits, 1);
  assert.ok(game.score > 0);
});

test("Dance Mirror avança quando movimento fica estável", () => {
  let hits = 0;
  const game = new DanceGame({ onHit: () => { hits += 1; } });
  game.active = true;
  game.patternIndex = 0;
  game.moveIndex = 0;
  game.beatStartedAt = 100;
  game.update({ body: body("lean_left") }, 100);
  game.update({ body: body("lean_left") }, 380);
  assert.equal(hits, 1);
  assert.equal(game.moveIndex, 1);
});

test("Alongamento conclui uma posição mantida", () => {
  let stepIndex = 0;
  const game = new StretchGame({ onStep: (_, index) => { stepIndex = index; } });
  game.start();
  game.update({ body: body("hands_up") }, 100);
  game.update({ body: body("hands_up") }, 4300);
  assert.equal(stepIndex, 1);
  assert.equal(game.score, 150);
});

test("Libras Lab valida configuração aproximada da letra L", () => {
  let successes = 0;
  const game = new LibrasGame({ onSuccess: () => { successes += 1; } });
  game.start({ mode: "learn" });
  game.index = LIBRAS_LETTERS.findIndex((letter) => letter.id === "L");
  const gesture = { extended: [true, true, false, false, false], type: "unknown", orientation: { type: "vertical_up" }, handedness: "Right" };
  game.update({ gestures: [gesture] }, 100);
  game.update({ gestures: [gesture] }, 900);
  assert.equal(successes, 1);
  assert.ok(game.score >= 100);
});
