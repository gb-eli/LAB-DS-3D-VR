import test from "node:test";
import assert from "node:assert/strict";
import {
  LibrasGame,
  LIBRAS_LETTERS,
  LIBRAS_LETTER_MAP,
  evaluateLibrasLetter,
  normalizeLibrasWord
} from "../src/libras-game.js";

const gesture = (overrides = {}) => ({
  type: "unknown",
  handedness: "Right",
  extended: [false, false, false, false, false],
  orientation: { type: "vertical_up" },
  curvature: { type: "folded" },
  palmFacing: { type: "front" },
  touches: {},
  thumbClosest: "index",
  crossedIndexMiddle: false,
  indexBent: false,
  dynamicLetter: null,
  ...overrides
});

test("Libras Lab possui A–Z sem IDs duplicados", () => {
  assert.equal(LIBRAS_LETTERS.length, 26);
  assert.equal(new Set(LIBRAS_LETTERS.map((item) => item.id)).size, 26);
  assert.deepEqual(LIBRAS_LETTERS.map((item) => item.id), "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
});

test("normaliza palavra removendo acentos, espaços e símbolos", () => {
  assert.equal(normalizeLibrasWord("  educação 3D! "), "EDUCACAO D".replace(" ", ""));
  assert.equal(normalizeLibrasWord("João"), "JOAO");
});

test("avalia a configuração guiada da letra L", () => {
  const result = evaluateLibrasLetter(LIBRAS_LETTER_MAP.get("L"), gesture({
    extended: [true, true, false, false, false],
    orientation: { type: "vertical_up" }
  }), { difficulty: "standard" });
  assert.equal(result.matched, true);
  assert.ok(result.score >= 0.7);
});

test("preferência de mão bloqueia a mão diferente", () => {
  const result = evaluateLibrasLetter(LIBRAS_LETTER_MAP.get("L"), gesture({
    extended: [true, true, false, false, false],
    handedness: "Left"
  }), { handPreference: "right", difficulty: "guided" });
  assert.equal(result.matched, false);
  assert.equal(result.handMismatch, "right");
});

test("letra dinâmica Z exige trajetória reconhecida", () => {
  const base = gesture({ extended: [false, true, false, false, false] });
  const before = evaluateLibrasLetter(LIBRAS_LETTER_MAP.get("Z"), base, { difficulty: "guided" });
  const after = evaluateLibrasLetter(LIBRAS_LETTER_MAP.get("Z"), { ...base, dynamicLetter: "Z" }, { difficulty: "guided" });
  assert.equal(before.matched, false);
  assert.equal(after.matched, true);
});

test("modo palavra soletra a sequência informada", () => {
  const targets = [];
  const game = new LibrasGame({ onLetter: (item) => targets.push(item.id) });
  game.start({ mode: "word", word: "AULA", difficulty: "guided" });
  assert.equal(game.letter.id, "A");
  game.manualConfirm(100);
  assert.equal(game.letter.id, "U");
  game.manualConfirm(200);
  assert.equal(game.letter.id, "L");
  assert.deepEqual(game.sequence, ["A", "U", "L", "A"]);
  assert.ok(targets.length >= 3);
});

test("feedback aponta o primeiro dedo divergente", () => {
  const result = evaluateLibrasLetter(LIBRAS_LETTER_MAP.get("B"), gesture({
    extended: [false, true, false, true, true]
  }), { difficulty: "guided" });
  assert.match(result.feedback, /Médio/);
  assert.equal(result.fingers.find((item) => item.finger === "Médio")?.ok, false);
});
