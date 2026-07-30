import test from "node:test";
import assert from "node:assert/strict";
import { ShapeGame } from "../src/shape-game.js";

globalThis.devicePixelRatio = 1;

globalThis.ResizeObserver = class {
  constructor(callback) { this.callback = callback; }
  observe() {}
  disconnect() {}
};

function createCanvas() {
  const noop = () => {};
  const context = new Proxy({
    setTransform: noop,
    clearRect: noop,
    save: noop,
    restore: noop,
    beginPath: noop,
    arc: noop,
    stroke: noop,
    fill: noop,
    fillRect: noop,
    fillText: noop,
    translate: noop,
    rotate: noop,
    rect: noop,
    moveTo: noop,
    lineTo: noop,
    closePath: noop,
    scale: noop,
    setLineDash: noop
  }, { get(target, key) { return key in target ? target[key] : 0; }, set(target, key, value) { target[key] = value; return true; } });
  return {
    width: 0,
    height: 0,
    parentElement: { getBoundingClientRect: () => ({ width: 800, height: 600 }) },
    getContext: () => context
  };
}

test("coleta uma forma quando a mão fecha sobre o alvo", () => {
  let lastScore = 0;
  const game = new ShapeGame(createCanvas(), { onScore: ({ score }) => { lastScore = score; } });
  game.active = true;
  game.running = true;
  game.targetIndex = 0;
  game.lastTimestamp = 1000;
  game.shapes = [{
    id: "target",
    type: "circle",
    color: "#00d9ff",
    x: 400,
    y: 300,
    size: 40,
    speed: 0,
    rotation: 0,
    spin: 0,
    pulse: 0,
    caught: false
  }];
  const results = {
    hands: [[{ x: 0.5, y: 0.5 }]],
    gestures: [{
      type: "fist",
      justStarted: true,
      handedness: "Left",
      palm: { x: 0.5, y: 0.5 },
      bounds: { width: 0.16, height: 0.2, center: { x: 0.5, y: 0.5 } }
    }]
  };
  game.update(results, 1016);
  assert.ok(lastScore >= 100);
  assert.equal(game.hits, 1);
  assert.equal(game.shapes.length, 0);
});

test("modo de duas pessoas atribui pontos ao jogador correto", () => {
  let scores = [0, 0];
  const game = new ShapeGame(createCanvas(), { onScore: ({ playerScores }) => { scores = playerScores || scores; } });
  game.setPlayers(2);
  game.active = true;
  game.running = true;
  game.targetIndex = 0;
  game.lastTimestamp = 1000;
  game.shapes = [{
    id: "p2-target",
    type: "circle",
    color: "#00d9ff",
    player: 1,
    x: 400,
    y: 300,
    size: 40,
    speed: 0,
    rotation: 0,
    spin: 0,
    pulse: 0,
    caught: false
  }];
  const invisiblePose = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
  const playerTwoPose = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
  playerTwoPose[15] = { x: 0.5, y: 0.5, visibility: 1 };
  game.update({ poses: [invisiblePose, playerTwoPose], hands: [], gestures: [] }, 1016);
  assert.ok(scores[1] >= 100);
  assert.equal(scores[0], 0);
});
