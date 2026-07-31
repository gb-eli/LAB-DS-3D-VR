import test from "node:test";
import assert from "node:assert/strict";
import { AcademyGame } from "../src/academy-game.js";
import { SequenceGame } from "../src/sequence-game.js";

test("academia avança após manter o gesto", () => {
  let successes = 0;
  const game = new AcademyGame({ onSuccess: () => { successes += 1; } });
  game.start();
  game.update({ gestures: [{ type: "open" }], body: { actions: new Set(), events: new Set() } }, 100);
  game.update({ gestures: [{ type: "open" }], body: { actions: new Set(), events: new Set() } }, 900);
  assert.equal(successes, 1);
  assert.equal(game.index, 1);
});

test("sequência aceita o comando esperado", () => {
  let progress = 0;
  const game = new SequenceGame({ onProgress: ({ index }) => { progress = index; } });
  game.active = true;
  game.sequence = [{ id: "open", title: "Mão aberta", icon: "✋", match: ({ gestures }) => gestures.some((g) => g.type === "open") }];
  game.inputIndex = 0;
  game.armed = true;
  game.update({ gestures: [{ type: "open" }], body: { actions: new Set() } }, 100);
  game.update({ gestures: [{ type: "open" }], body: { actions: new Set() } }, 600);
  assert.equal(progress, 1);
});

test("sequência reinicia a estabilidade quando o gesto muda", () => {
  let progress = 0;
  const game = new SequenceGame({ onProgress: ({ index }) => { progress = index; } });
  game.active = true;
  game.sequence = [{ id: "open", title: "Mão aberta", icon: "✋" }];
  game.inputIndex = 0;
  game.armed = true;
  const emptyBody = { actions: new Set() };
  game.update({ gestures: [{ type: "fist" }], body: emptyBody }, 100);
  game.update({ gestures: [{ type: "open" }], body: emptyBody }, 450);
  game.update({ gestures: [{ type: "open" }], body: emptyBody }, 700);
  assert.equal(progress, 0);
  game.update({ gestures: [{ type: "open" }], body: emptyBody }, 900);
  assert.equal(progress, 1);
});
