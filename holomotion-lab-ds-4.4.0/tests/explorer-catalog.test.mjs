import test from "node:test";
import assert from "node:assert/strict";
import {
  EXPLORER_CATEGORIES,
  EXPLORER_EXHIBITS,
  getExplorerExhibit,
  getAdjacentExplorerExhibit
} from "../src/explorer-catalog.js";

test("Holo Explorer possui nove exposições com IDs únicos", () => {
  assert.equal(EXPLORER_EXHIBITS.length, 9);
  assert.equal(new Set(EXPLORER_EXHIBITS.map((item) => item.id)).size, EXPLORER_EXHIBITS.length);
  EXPLORER_EXHIBITS.forEach((item) => {
    assert.ok(item.title);
    assert.ok(item.summary);
    assert.ok(item.objective);
    assert.ok(item.facts.length >= 3);
    assert.ok(item.hotspots.length >= 3);
  });
});

test("todas as categorias do Explorer possuem exposições", () => {
  EXPLORER_CATEGORIES.forEach((category) => {
    assert.ok(EXPLORER_EXHIBITS.some((item) => item.category === category.id), category.id);
  });
});

test("navegação do Explorer é circular", () => {
  const first = EXPLORER_EXHIBITS[0];
  const last = EXPLORER_EXHIBITS.at(-1);
  assert.equal(getAdjacentExplorerExhibit(first.id, -1).id, last.id);
  assert.equal(getAdjacentExplorerExhibit(last.id, 1).id, first.id);
});

test("exposição inválida retorna o Sistema Solar", () => {
  assert.equal(getExplorerExhibit("inexistente").id, "solar-system");
});

import { readFile } from "node:fs/promises";

test("cada exposição possui um construtor procedural no motor 3D", async () => {
  const source = await readFile(new URL("../src/three-scene.js", import.meta.url), "utf8");
  const expectedBuilders = [
    "buildSolarSystem", "buildEarthMoon", "buildMotherboard", "buildDrone", "buildRobot",
    "buildVolcano", "buildCave", "buildWorldMap", "buildLandmarks"
  ];
  expectedBuilders.forEach((name) => assert.match(source, new RegExp(`\\b${name}\\b`)));
  assert.match(source, /setExplorerHandInteraction/);
  assert.match(source, /setExplorerExploded/);
});

test("interface possui modo, painel e controles do Holo Explorer", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-mode-target="explorer"/);
  assert.match(html, /id="explorerPanel"/);
  assert.match(html, /id="explorerExhibitSelect"/);
  assert.match(html, /id="explodeExplorerButton"/);
});
